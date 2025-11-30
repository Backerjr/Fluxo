from __future__ import annotations

import asyncio
import json
import logging
from typing import Iterable, List, Optional

import httpx
from openai import AsyncOpenAI
from tenacity import AsyncRetrying, retry_if_exception_type, stop_after_attempt, wait_exponential

from .models import EnrichedLead, EnrichmentStats, LeadInput

logger = logging.getLogger(__name__)


class AIStrategy:
    """Handle AI prompting for strategy, email patterns, and LinkedIn discovery."""

    def __init__(self, client: Optional[AsyncOpenAI] = None):
        self.client = client or AsyncOpenAI()

    async def _ask_model(self, prompt: str, max_tokens: int, temperature: float) -> Optional[str]:
        async for attempt in AsyncRetrying(
            retry=retry_if_exception_type(Exception),
            wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
            stop=stop_after_attempt(3),
            reraise=True,
        ):
            with attempt:
                response = await self.client.chat.completions.create(
                    model="gemini-2.5-flash",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
                content = response.choices[0].message.content
                if content:
                    return content.strip()
        return None

    async def get_enrichment_strategy(self, lead: LeadInput) -> str:
        prompt = f"""You are a B2B data enrichment expert. Analyze this lead and suggest the best strategy to find their contact information:

Lead Information:
- Name: {lead.first_name} {lead.last_name}
- Company: {lead.company}

Provide a one-sentence strategy focusing on the most likely sources for accurate data."""
        try:
            strategy = await self._ask_model(prompt, max_tokens=100, temperature=0.3)
            return strategy or "Use standard email patterns and LinkedIn search"
        except Exception as exc:
            logger.warning("AI strategy generation failed: %s", exc)
            return "Use standard email patterns and LinkedIn search"

    async def generate_email_patterns(self, lead: LeadInput) -> List[str]:
        domain = self._extract_domain(lead.company)
        prompt = f"""Generate the 3 most likely email addresses for this person:

Name: {lead.first_name} {lead.last_name}
Company: {lead.company}
Domain: {domain}

Return ONLY a JSON array of email addresses, ordered by likelihood. Example format:
["firstname.lastname@domain.com", "firstnamelastname@domain.com", "flastname@domain.com"]"""
        try:
            content = await self._ask_model(prompt, max_tokens=150, temperature=0.3)
            if not content:
                return []
            if "[" in content and "]" in content:
                start = content.index("[")
                end = content.rindex("]") + 1
                return json.loads(content[start:end])
        except Exception as exc:
            logger.warning("AI email pattern generation failed: %s", exc)
        return []

    async def find_linkedin(self, lead: LeadInput) -> Optional[dict]:
        prompt = f"""Generate the most likely LinkedIn profile URL for this person:

Name: {lead.first_name} {lead.last_name}
Company: {lead.company}

Return ONLY a JSON object with this format:
{{"url": "https://www.linkedin.com/in/firstname-lastname", "title": "likely job title"}}"""
        try:
            content = await self._ask_model(prompt, max_tokens=150, temperature=0.3)
            if not content:
                return None
            if "{" in content and "}" in content:
                start = content.index("{")
                end = content.rindex("}") + 1
                return json.loads(content[start:end])
        except Exception as exc:
            logger.warning("AI LinkedIn discovery failed: %s", exc)
        return None

    @staticmethod
    def _extract_domain(company: str) -> str:
        domain = company.lower().replace(" ", "").replace(",", "").replace(".", "")
        return f"{domain}.com"


class LeadEnricher:
    """Async lead enricher implementing waterfall logic with concurrency and retries."""

    def __init__(
        self,
        hunter_api_key: Optional[str],
        ai_strategy: AIStrategy,
        http_client: Optional[httpx.AsyncClient] = None,
        max_concurrency: int = 5,
        rate_limit_delay: float = 0.0,
    ):
        self.hunter_api_key = hunter_api_key
        self.ai_strategy = ai_strategy
        self.http_client = http_client or httpx.AsyncClient(timeout=10.0)
        self.semaphore = asyncio.Semaphore(max_concurrency)
        self.rate_limit_delay = rate_limit_delay

    async def __aenter__(self) -> "LeadEnricher":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        await self.http_client.aclose()

    async def enrich(self, lead: LeadInput) -> EnrichedLead:
        enriched = EnrichedLead(**lead.model_dump())
        async with self.semaphore:
            logger.info("Enriching lead: %s %s (%s)", lead.first_name, lead.last_name, lead.company)
            strategy = await self.ai_strategy.get_enrichment_strategy(lead)
            logger.debug("Strategy for %s %s: %s", lead.first_name, lead.last_name, strategy)

            if self.hunter_api_key and not enriched.email:
                hunter_result = await self._find_email_hunter(lead)
                if hunter_result:
                    enriched.email = hunter_result.get("email") or enriched.email
                    enriched.confidence_score = min(
                        1.0, enriched.confidence_score + hunter_result.get("confidence", 0) * 0.4
                    )
                    enriched.with_source("Hunter.io")
                    logger.info("Hunter.io email found for %s %s", lead.first_name, lead.last_name)

            if not enriched.email:
                patterns = await self.ai_strategy.generate_email_patterns(lead)
                if patterns:
                    enriched.email = patterns[0]
                    enriched.confidence_score = min(1.0, enriched.confidence_score + 0.3)
                    enriched.with_source("AI-Generated")
                    logger.info("AI-generated email pattern used for %s %s", lead.first_name, lead.last_name)

            linkedin_result = await self.ai_strategy.find_linkedin(lead)
            if linkedin_result:
                enriched.linkedin_url = linkedin_result.get("url")
                enriched.title = linkedin_result.get("title")
                enriched.confidence_score = min(1.0, enriched.confidence_score + 0.3)
                enriched.with_source("AI-LinkedIn")
                logger.info("LinkedIn profile inferred for %s %s", lead.first_name, lead.last_name)

            enriched.enrichment_status = "completed" if enriched.email else "partial"
            await self._respect_rate_limit()
            return enriched

    async def enrich_many(self, leads: Iterable[LeadInput]) -> List[EnrichedLead]:
        tasks = [asyncio.create_task(self.enrich(lead)) for lead in leads]
        return await asyncio.gather(*tasks)

    async def _respect_rate_limit(self) -> None:
        if self.rate_limit_delay > 0:
            await asyncio.sleep(self.rate_limit_delay)

    async def _find_email_hunter(self, lead: LeadInput) -> Optional[dict]:
        if not self.hunter_api_key:
            return None

        params = {
            "domain": AIStrategy._extract_domain(lead.company),
            "first_name": lead.first_name,
            "last_name": lead.last_name,
            "api_key": self.hunter_api_key,
        }

        async for attempt in AsyncRetrying(
            retry=retry_if_exception_type(httpx.HTTPError),
            wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
            stop=stop_after_attempt(3),
            reraise=True,
        ):
            with attempt:
                response = await self.http_client.get("https://api.hunter.io/v2/email-finder", params=params)
                response.raise_for_status()
                data = response.json()
                if data.get("data") and data["data"].get("email"):
                    return {
                        "email": data["data"]["email"],
                        "confidence": data["data"].get("score", 50) / 100,
                    }
        return None


class CSVProcessor:
    """Handle CSV IO with validation via Pydantic models."""

    def load(self, input_file: str) -> List[LeadInput]:
        import csv

        leads: List[LeadInput] = []
        with open(input_file, "r", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                try:
                    leads.append(LeadInput(**row))
                except Exception as exc:
                    logger.warning("Skipping invalid row %s: %s", row, exc)
        return leads

    def write(self, output_file: str, leads: Iterable[EnrichedLead]) -> None:
        import csv

        fieldnames = [
            "first_name",
            "last_name",
            "company",
            "email",
            "phone",
            "linkedin_url",
            "title",
            "confidence_score",
            "data_sources",
            "enrichment_status",
        ]
        with open(output_file, "w", encoding="utf-8", newline="") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for lead in leads:
                writer.writerow(lead.as_csv_row())


def calculate_stats(enriched_leads: List[EnrichedLead]) -> EnrichmentStats:
    total = len(enriched_leads)
    completed = sum(1 for lead in enriched_leads if lead.enrichment_status == "completed")
    avg_confidence = sum(lead.confidence_score for lead in enriched_leads) / total if total else 0
    total_cost = 0.0  # Placeholder for future cost calculations
    return EnrichmentStats(
        total_leads=total,
        completed=completed,
        partial=total - completed,
        avg_confidence=avg_confidence,
        total_cost=total_cost,
        cost_per_lead=total_cost / total if total else 0,
    )

