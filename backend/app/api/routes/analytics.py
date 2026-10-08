from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.analytics import (
    CashFlowOverview,
    SpendingTrendResponse,
    CategoryBreakdownResponse,
    MerchantAggregate,
    SpendingVelocityResponse,
)
from app.analytics import (
    CashFlowAnalytics,
    TimeSeriesAnalytics,
    CategoryAnalytics,
    MerchantAnalytics,
    VelocityAnalytics,
)

router = APIRouter()

@router.get("/overview", response_model=CashFlowOverview)
async def get_analytics_overview(
    reference_date: Optional[datetime] = Query(None, description="Optional anchor reference date"),
    account_id: Optional[str] = Query(None, description="Optional account filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve comprehensive cash flow KPI summary for current month,
    complete with MoM variance and backend semantic status classifications.
    """
    return await CashFlowAnalytics.get_overview(db, current_user.id, reference_date, account_id)

@router.get("/spending/trend", response_model=SpendingTrendResponse)
async def get_spending_trend(
    months: int = Query(6, ge=1, le=24, description="Number of historical months"),
    account_id: Optional[str] = Query(None, description="Optional account filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve monthly time series data formatted for Recharts spending trajectory visualizations.
    """
    return await TimeSeriesAnalytics.get_monthly_spending_trend(db, current_user.id, months, account_id)

@router.get("/spending/categories", response_model=CategoryBreakdownResponse)
async def get_category_breakdown(
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    account_id: Optional[str] = Query(None, description="Optional account filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve hierarchical spending distributions, wallet share, and fixed vs discretionary ratio.
    """
    return await CategoryAnalytics.get_breakdown(db, current_user.id, start_date, end_date, account_id)

@router.get("/spending/merchants", response_model=List[MerchantAggregate])
async def get_top_merchants(
    limit: int = Query(10, ge=1, le=50, description="Max merchants to return"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    account_id: Optional[str] = Query(None, description="Optional account filter"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve top spending merchants with average ticket and contribution share.
    """
    return await MerchantAnalytics.get_top_merchants(db, current_user.id, limit, start_date, end_date, account_id, category)

@router.get("/spending/velocity", response_model=SpendingVelocityResponse)
async def get_spending_velocity(
    days: int = Query(30, ge=7, le=90, description="Number of days to analyze"),
    account_id: Optional[str] = Query(None, description="Optional account filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve daily spending velocity, 7-day burn rate, and cumulative spend progress.
    """
    return await VelocityAnalytics.get_velocity(db, current_user.id, days, account_id)
