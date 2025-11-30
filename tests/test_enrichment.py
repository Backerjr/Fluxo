import asyncio
from typing import Any, Dict, Optional

import httpx
import pytest

from src.enricher import AIStrategy, CSVProcessor, LeadEnricher, calculate_stats
from src.models import EnrichedLead, LeadInput


class StubAIStrategy(AIStrategy):
    def __init__(
        self,
        strategy: str = "default",
        email_patterns: Optional[list[str]] = None,
        linkedin: Optional[dict] = None,
    ):
        self._strategy = strategy
        self._email_patterns = email_patterns or []
        self._linkedin = linkedin or {}

    async def get_enrichment_strategy(self, lead: LeadInput) -> str:  # type: ignore[override]
        return self._strategy

    async def generate_email_patterns(self, lead: LeadInput) -> list[str]:  # type: ignore[override]
        return list(self._email_patterns)

    async def find_linkedin(self, lead: LeadInput) -> Optional[dict]:  # type: ignore[override]
        return self._linkedin or None


def test_enrich_with_hunter_preferred_over_ai_patterns() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        data: Dict[str, Any] = {"data": {"email": "hunter@example.com", "score": 90}}
        return httpx.Response(200, json=data)

    async def runner() -> EnrichedLead:
        transport = httpx.MockTransport(handler)
        client = httpx.AsyncClient(transport=transport)

        lead = LeadInput(first_name="Ada", last_name="Lovelace", company="Analytical Engines")
        ai_strategy = StubAIStrategy(email_patterns=["ai@example.com"], linkedin={"url": "https://linkedin.com/in/ada"})

        async with LeadEnricher(
            hunter_api_key="test-key",
            ai_strategy=ai_strategy,
            http_client=client,
            max_concurrency=2,
        ) as enricher:
            return await enricher.enrich(lead)

    enriched = asyncio.run(runner())
    assert enriched.email == "hunter@example.com"
    assert "Hunter.io" in enriched.data_sources
    assert enriched.enrichment_status == "completed"


def test_enrich_without_hunter_uses_ai_patterns_and_linkedin() -> None:
    async def runner() -> EnrichedLead:
        lead = LeadInput(first_name="Grace", last_name="Hopper", company="Compilers Corp")
        ai_strategy = StubAIStrategy(
            email_patterns=["grace.hopper@compilerscorp.com"],
            linkedin={"url": "https://linkedin.com/in/grace"},
        )

        async with LeadEnricher(
            hunter_api_key=None,
            ai_strategy=ai_strategy,
            max_concurrency=1,
        ) as enricher:
            return await enricher.enrich(lead)

    enriched = asyncio.run(runner())
    assert enriched.email == "grace.hopper@compilerscorp.com"
    assert "AI-Generated" in enriched.data_sources
    assert "AI-LinkedIn" in enriched.data_sources
    assert enriched.linkedin_url == "https://linkedin.com/in/grace"
    assert enriched.enrichment_status == "completed"


def test_calculate_stats_counts_completed_and_partial() -> None:
    async def runner() -> tuple[int, int, int, float]:
        leads = [
            EnrichedLead(first_name="A", last_name="B", company="C", email="a@c.com", enrichment_status="completed"),
            EnrichedLead(first_name="D", last_name="E", company="F", enrichment_status="partial"),
        ]
        stats = calculate_stats(leads)
        return stats.total_leads, stats.completed, stats.partial, stats.cost_per_lead

    total, completed, partial, cost_per_lead = asyncio.run(runner())
    assert total == 2
    assert completed == 1
    assert partial == 1
    assert cost_per_lead == 0


def test_csv_processor_filters_invalid_rows(tmp_path: pytest.TempPathFactory) -> None:
    csv_file = tmp_path / "leads.csv"
    csv_file.write_text("first_name,last_name,company\nAlice,Smith,Wonderland Inc\n,Brown,NoName\n")

    processor = CSVProcessor()
    leads = processor.load(str(csv_file))
    assert len(leads) == 1
    assert leads[0].first_name == "Alice"

    enriched = [EnrichedLead(**leads[0].model_dump(), enrichment_status="completed")]
    output_file = tmp_path / "out.csv"
    processor.write(str(output_file), enriched)
    contents = output_file.read_text()
    assert "Alice" in contents
