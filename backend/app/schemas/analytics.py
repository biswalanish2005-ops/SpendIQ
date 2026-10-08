from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class MetricCardAnalytics(BaseModel):
    metric: str
    label: str
    current: Decimal
    previous: Decimal
    change_amount: Decimal
    change_percent: Decimal
    direction: str  # INCREASE, DECREASE, NEUTRAL
    impact: str     # POSITIVE, NEGATIVE, NEUTRAL
    status: str     # IMPROVING, CONCERNING, STABLE, ATTENTION_REQUIRED
    status_label: str
    historical_average: Optional[Decimal] = None
    sparkline: List[Decimal] = []
    currency: str = "USD"

    model_config = ConfigDict(from_attributes=True)

class CashFlowOverview(BaseModel):
    spending: MetricCardAnalytics
    savings: MetricCardAnalytics
    income: MetricCardAnalytics
    investments: MetricCardAnalytics
    savings_rate: MetricCardAnalytics
    average_daily_spend: Decimal
    period_label: str

    model_config = ConfigDict(from_attributes=True)

class CategoryAggregate(BaseModel):
    category_name: str
    group: str
    amount: Decimal
    percentage: Decimal
    transaction_count: int
    change_percent: Optional[Decimal] = None

    model_config = ConfigDict(from_attributes=True)

class CategoryBreakdownResponse(BaseModel):
    total_spending: Decimal
    categories: List[CategoryAggregate]
    fixed_amount: Decimal
    discretionary_amount: Decimal
    discretionary_ratio: Decimal

    model_config = ConfigDict(from_attributes=True)

class MerchantAggregate(BaseModel):
    merchant_name: str
    amount: Decimal
    transaction_count: int
    average_ticket: Decimal
    percentage: Decimal

    model_config = ConfigDict(from_attributes=True)

class TimeSeriesPoint(BaseModel):
    period: str
    date: str
    actual: Optional[Decimal] = None
    historical_average: Optional[Decimal] = None

    model_config = ConfigDict(from_attributes=True)

class SpendingTrendResponse(BaseModel):
    points: List[TimeSeriesPoint]
    historical_baseline: Decimal
    granularity: str

    model_config = ConfigDict(from_attributes=True)

class VelocityPoint(BaseModel):
    date: str
    day_label: str
    amount: Decimal
    moving_average: Decimal

    model_config = ConfigDict(from_attributes=True)

class CumulativePoint(BaseModel):
    day_of_month: int
    current_month_cumulative: Decimal
    previous_month_cumulative: Optional[Decimal] = None

    model_config = ConfigDict(from_attributes=True)

class SpendingVelocityResponse(BaseModel):
    daily_velocity: List[VelocityPoint]
    cumulative_comparison: List[CumulativePoint]
    seven_day_burn_rate: Decimal
    period_label: str

    model_config = ConfigDict(from_attributes=True)
