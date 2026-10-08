from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class AnomalyItemResponse(BaseModel):
    """Detailed record of an unusual spending transaction."""
    id: str
    transaction_id: str
    amount: float
    currency: str = "USD"
    merchant_name: str
    category_name: str
    occurred_at: datetime
    anomaly_score: float = Field(description="Normalized outlier score from 0.0 to 1.0")
    expected_value: float = Field(description="Baseline expected amount for this category")
    deviation_factor: float = Field(description="Multiplier relative to category baseline")
    severity: str = Field(description="'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL'")
    explanation: str = Field(description="Natural language reason for anomalous classification")
    status: str = Field(description="'DETECTED' | 'ACKNOWLEDGED' | 'DISMISSED'")
    detected_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnomalySummaryResponse(BaseModel):
    """Aggregated anomaly metrics and severity distribution."""
    total_anomalies: int
    high_severity_count: int
    medium_severity_count: int
    low_severity_count: int
    resolved_count: int
    total_anomalous_amount: float
    resolution_rate: float


class AnomalyTimelinePoint(BaseModel):
    """Timeline entry comparing verified normal spending vs. anomalous spikes."""
    date: str
    normal_spend: float
    anomalous_spend: float
    anomaly_count: int


class AnomalyStatusUpdateRequest(BaseModel):
    """Payload for updating anomaly review status."""
    status: str = Field(pattern="^(DETECTED|ACKNOWLEDGED|DISMISSED)$")


class AnomalyScanResponse(BaseModel):
    """Response returned when on-demand anomaly detection scan completes."""
    scanned_transactions: int
    anomalies_detected: int
    new_anomalies_created: int
    message: str
