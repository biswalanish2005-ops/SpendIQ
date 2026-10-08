from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class CombinedTimelinePoint(BaseModel):
    """Unified timeline point showing actual historical data or predicted forecast with bounds."""
    period_date: str = Field(description="ISO Date string for period start e.g. '2026-09-01'")
    period_label: str = Field(description="Display label e.g. 'Sep 2026'")
    actual_amount: Optional[float] = Field(default=None, description="Actual spending amount if historical")
    forecast_amount: Optional[float] = Field(default=None, description="Forecasted spending amount if projection")
    lower_bound: Optional[float] = Field(default=None, description="Lower prediction interval (80% or 95% bound)")
    upper_bound: Optional[float] = Field(default=None, description="Upper prediction interval (80% or 95% bound)")
    is_forecast: bool = Field(default=False, description="True if projected point, False if historical")

    model_config = ConfigDict(from_attributes=True)


class SpendingDriver(BaseModel):
    """Categorical spending driver contributing to forecasted variance."""
    category_name: str
    historical_monthly_average: float
    current_amount: float
    projected_amount: float
    dollar_variance: float
    percentage_impact: float
    direction: str = Field(description="'INCREASE' | 'DECREASE' | 'STABLE'")
    impact_level: str = Field(description="'HIGH' | 'MEDIUM' | 'LOW'")
    explanation: str


class CategoryForecast(BaseModel):
    """Category-level forecast breakdown."""
    category_name: str
    current_spend: float
    projected_spend: float
    projected_change_pct: float
    trend: str = Field(description="'UP' | 'DOWN' | 'STABLE'")
    confidence_score: float = Field(description="0.0 to 1.0 confidence in category projection")
    share_of_projected_spend: float


class ForecastRunSummary(BaseModel):
    """Metadata about the ML model training run and evaluation."""
    run_id: str
    target_metric: str
    horizon_days: int
    model_name: str
    model_version: str
    created_at: datetime
    evaluation_metrics: Dict[str, Any] = Field(default_factory=dict)


class SpendingForecastResponse(BaseModel):
    """Primary spending forecast response containing timeline, drivers, and model metadata."""
    run: ForecastRunSummary
    projected_next_month: float
    historical_monthly_average: float
    expected_change_pct: float
    direction: str = Field(description="'INCREASE' | 'DECREASE' | 'STABLE'")
    financial_impact: str = Field(description="'CONCERNING' | 'IMPROVING' | 'NEUTRAL'")
    status: str = Field(description="'CONCERNING' | 'IMPROVING' | 'STABLE'")
    confidence_interval_pct: int = Field(default=80, description="Confidence percentage e.g. 80")
    next_month_lower_bound: Optional[float] = None
    next_month_upper_bound: Optional[float] = None
    timeline: List[CombinedTimelinePoint]
    drivers: List[SpendingDriver]
    category_forecasts: List[CategoryForecast]
    savings_forecast: Optional[Dict[str, Any]] = None
    investment_forecast: Optional[Dict[str, Any]] = None
