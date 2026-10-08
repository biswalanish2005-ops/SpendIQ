from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class InsightItem(BaseModel):
    """Structured, verified AI insight card grounded in analytics facts."""
    id: str
    category: str = Field(
        description="'SPENDING' | 'SAVINGS' | 'INVESTMENTS' | 'ANOMALIES' | 'FORECAST' | 'FINANCIAL_HEALTH'"
    )
    headline: str
    summary: str
    evidence: List[str] = Field(
        default_factory=list,
        description="List of verified numeric data points grounding this narrative",
    )
    metric_value: str = Field(description="Display-ready primary quantitative metric")
    status: str = Field(description="'IMPROVING' | 'CONCERNING' | 'STABLE' | 'ATTENTION_REQUIRED'")
    impact: str = Field(description="'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'")
    action_state: str = Field(
        default="ACTIVE",
        description="'ACTIVE' | 'DISMISSED' | 'ACTED_UPON'",
    )
    recommendation: Optional[str] = None
    navigation_link: str = Field(description="Target route for visual evidence drilldown")
    action_label: str = Field(description="Call-to-action button text")
    confidence_score: float = Field(default=0.95, ge=0.0, le=1.0)
    created_at: datetime


class InsightSummary(BaseModel):
    """Aggregate statistics for active intelligence signals."""
    total_insights: int
    active_count: int
    acted_upon_count: int
    improving_count: int
    concerning_count: int
    attention_count: int
    average_confidence: float


class InsightStatusUpdateRequest(BaseModel):
    """Payload to update an insight's action status."""
    status: str = Field(description="'ACTIVE' | 'DISMISSED' | 'ACTED_UPON'")
