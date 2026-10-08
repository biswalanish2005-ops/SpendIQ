from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.savings_investments import (
    SavingsIntelligenceResponse,
    InvestmentIntelligenceResponse,
)
from app.analytics.savings import SavingsAnalytics
from app.analytics.investments import InvestmentAnalytics

router = APIRouter()


@router.get("/savings", response_model=SavingsIntelligenceResponse)
async def get_savings_intelligence(
    reference_date: Optional[datetime] = Query(None, description="Optional anchor reference date"),
    months: int = Query(6, ge=1, le=24, description="Number of historical months to analyze"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve savings rate intelligence, 20% benchmark comparison,
    emergency fund runway, and next-month projection.
    """
    return await SavingsAnalytics.get_savings_intelligence(
        db=db,
        user_id=current_user.id,
        reference_date=reference_date,
        months_back=months,
    )


@router.get("/investments", response_model=InvestmentIntelligenceResponse)
async def get_investment_intelligence(
    reference_date: Optional[datetime] = Query(None, description="Optional anchor reference date"),
    months: int = Query(6, ge=1, le=24, description="Number of historical months to analyze"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve investment contribution cadence, income allocation percentage,
    consistency score, and asset allocation breakdown.
    """
    return await InvestmentAnalytics.get_investment_intelligence(
        db=db,
        user_id=current_user.id,
        reference_date=reference_date,
        months_back=months,
    )
