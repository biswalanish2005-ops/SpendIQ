from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.insights import (
    InsightItem,
    InsightSummary,
    InsightStatusUpdateRequest,
)
from app.services.insights_service import AIInsightsService

router = APIRouter()


@router.get("", response_model=List[InsightItem])
async def list_insights(
    category: Optional[str] = Query(None, description="Filter by category (e.g. SPENDING, SAVINGS, INVESTMENTS, ANOMALIES, FORECAST, FINANCIAL_HEALTH)"),
    status: Optional[str] = Query(None, description="Filter by status (e.g. IMPROVING, CONCERNING, STABLE, ATTENTION_REQUIRED)"),
    action_state: Optional[str] = Query(None, description="Filter by user action state (e.g. ACTIVE, DISMISSED, ACTED_UPON)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve grounded AI insights with multi-criteria filtering.
    """
    return await AIInsightsService.get_insights(
        db=db,
        user_id=current_user.id,
        category=category,
        status=status,
        action_state=action_state,
    )


@router.get("/summary", response_model=InsightSummary)
async def get_insights_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve summary counts of active, acted upon, and concerning insights.
    """
    return await AIInsightsService.get_insight_summary(
        db=db,
        user_id=current_user.id,
    )


@router.post("/generate", response_model=List[InsightItem])
async def generate_insights(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Trigger on-demand re-evaluation of all analytical subsystems and generate fresh insights.
    """
    return await AIInsightsService.generate_grounded_insights(
        db=db,
        user_id=current_user.id,
    )


@router.patch("/{insight_id}/status", response_model=InsightItem)
async def update_insight_status(
    insight_id: str,
    payload: InsightStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update an insight's user action state (ACTIVE, DISMISSED, or ACTED_UPON).
    """
    updated = await AIInsightsService.update_insight_status(
        db=db,
        user_id=current_user.id,
        insight_id=insight_id,
        new_status=payload.status,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insight not found or access denied.",
        )
    return updated
