from datetime import date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# --- Savings Models ---

class MonthlySavingsPoint(BaseModel):
    """Historical monthly savings entry."""
    period_date: str
    period_label: str
    income: float
    expenses: float
    savings_amount: float
    savings_rate: float
    target_benchmark_rate: float = 20.0
    is_projected: bool = False


class EmergencyFundDetails(BaseModel):
    """Emergency reserve coverage metrics."""
    liquid_balance: float
    monthly_burn_rate: float
    months_of_coverage: float
    recommended_months: int = 6
    target_reserve_amount: float
    funding_percentage: float
    status: str = Field(description="'EXCELLENT' | 'ADEQUATE' | 'NEEDS_ATTENTION'")


class SavingsIntelligenceResponse(BaseModel):
    """Complete savings analytics response."""
    current_savings_amount: float
    current_savings_rate: float
    mom_change_rate: float
    direction: str = Field(description="'INCREASE' | 'DECREASE' | 'STABLE'")
    financial_impact: str = Field(description="'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'")
    status: str = Field(description="'IMPROVING' | 'CONCERNING' | 'STABLE'")
    average_savings_rate_6m: float
    projected_next_month_savings: float
    projected_next_month_rate: float
    emergency_fund: EmergencyFundDetails
    trajectory: List[MonthlySavingsPoint]


# --- Investment Models ---

class MonthlyInvestmentPoint(BaseModel):
    """Historical monthly investment contribution entry."""
    period_date: str
    period_label: str
    contribution_amount: float
    income_share_pct: float
    cumulative_invested: float
    is_projected: bool = False


class AssetAllocationItem(BaseModel):
    """Allocation breakdown per asset class or account."""
    name: str
    account_type: str
    institution: str
    balance: float
    percentage: float


class InvestmentIntelligenceResponse(BaseModel):
    """Complete investment analytics response."""
    current_monthly_contribution: float
    income_share_percentage: float
    mom_change_percentage: float
    direction: str = Field(description="'INCREASE' | 'DECREASE' | 'STABLE'")
    financial_impact: str = Field(description="'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'")
    status: str = Field(description="'IMPROVING' | 'CONCERNING' | 'STABLE'")
    consistency_score: float = Field(description="0 to 100 consistency index")
    total_portfolio_balance: float
    projected_next_month_contribution: float
    allocations: List[AssetAllocationItem]
    cadence: List[MonthlyInvestmentPoint]
