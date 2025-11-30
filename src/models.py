from __future__ import annotations

import re
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class LeadBase(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    @field_validator("first_name", "last_name", "company", check_fields=False)
    @classmethod
    def _strip_and_validate(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be empty")
        return cleaned


class LeadInput(LeadBase):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    company: str = Field(..., min_length=1)
    email: Optional[str] = Field(default=None)

    @field_validator("email")
    @classmethod
    def _validate_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            return None
        if not EMAIL_PATTERN.match(cleaned):
            raise ValueError("invalid email format")
        return cleaned


class EnrichedLead(LeadInput):
    phone: Optional[str] = None
    linkedin_url: Optional[HttpUrl] = None
    title: Optional[str] = None
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    data_sources: List[str] = Field(default_factory=list)
    enrichment_status: str = Field(default="pending")

    def with_source(self, source: str) -> "EnrichedLead":
        if source not in self.data_sources:
            self.data_sources.append(source)
        return self

    def as_csv_row(self) -> dict:
        data = self.model_dump()
        data["data_sources"] = ", ".join(self.data_sources)
        return data


class EnrichmentStats(BaseModel):
    total_leads: int
    completed: int
    partial: int
    avg_confidence: float
    total_cost: float
    cost_per_lead: float

