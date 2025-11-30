from __future__ import annotations


import argparse
import asyncio
import logging
import os
from typing import Optional

from openai import AsyncOpenAI

from .enricher import AIStrategy, CSVProcessor, LeadEnricher, calculate_stats


def configure_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Async AI-powered lead enrichment")
    parser.add_argument("input", help="Path to input CSV with leads")
    parser.add_argument("output", help="Path to write enriched CSV")
    parser.add_argument("--hunter-api-key", dest="hunter_api_key", default=os.getenv("HUNTER_API_KEY"))
    parser.add_argument("--concurrency", type=int, default=5, help="Max concurrent enrichment tasks")
    parser.add_argument("--rate-limit-delay", type=float, default=0.0, help="Delay between calls to respect rate limits")
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging")
    return parser.parse_args()


async def run(
    input_file: str,
    output_file: str,
    hunter_api_key: Optional[str],
    concurrency: int,
    rate_limit_delay: float,
) -> None:
    csv_processor = CSVProcessor()
    leads = csv_processor.load(input_file)
    if not leads:
        logging.warning("No valid leads found in %s", input_file)
        return

    ai_strategy = AIStrategy(AsyncOpenAI())
    async with LeadEnricher(
        hunter_api_key=hunter_api_key,
        ai_strategy=ai_strategy,
        max_concurrency=concurrency,
        rate_limit_delay=rate_limit_delay,
    ) as enricher:
        enriched_leads = await enricher.enrich_many(leads)

    csv_processor.write(output_file, enriched_leads)
    stats = calculate_stats(enriched_leads)

    logging.info(
        "Processed %s leads | Completed: %s | Partial: %s | Avg confidence: %.2f",
        stats.total_leads,
        stats.completed,
        stats.partial,
        stats.avg_confidence,
    )


def main() -> None:
    args = parse_args()
    configure_logging(args.verbose)
    asyncio.run(
        run(
            input_file=args.input,
            output_file=args.output,
            hunter_api_key=args.hunter_api_key,
            concurrency=args.concurrency,
            rate_limit_delay=args.rate_limit_delay,
        )
    )


if __name__ == "__main__":
    main()
