from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.anomaly_service import AnomalyService
from app.schemas.anomaly import (
    AnomalyItemResponse,
    AnomalySummaryResponse,
    AnomalyTimelinePoint,
    AnomalyStatusUpdateRequest,
    AnomalyScanResponse,
)

router = APIRouter()
anomaly_service = AnomalyService()


@router.get(
    "",
    response_model=List[AnomalyItemResponse],
    summary="List detected unusual spending transactions",
)
async def list_anomalies(
    severity: Optional[str] = Query(default=None, description="Filter by severity: HIGH, MEDIUM, LOW"),
    status: Optional[str] = Query(default=None, description="Filter by status: DETECTED, ACKNOWLEDGED, DISMISSED"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves user's unusual spending transactions with full contextual explanations."""
    return await anomaly_service.get_anomalies(
        db=db,
        user_id=current_user.id,
        severity=severity,
        status=status,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/summary",
    response_model=AnomalySummaryResponse,
    summary="Get anomaly counts, severity breakdown, and impact volume",
)
async def get_anomaly_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves aggregated metrics: total unusual transactions, severity distribution, and volume."""
    return await anomaly_service.get_anomaly_summary(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/timeline",
    response_model=List[AnomalyTimelinePoint],
    summary="Get anomaly timeline comparing normal vs anomalous spend",
)
async def get_anomaly_timeline(
    days: int = Query(default=90, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Provides daily aggregated time series contrasting regular spending against unusual spikes."""
    return await anomaly_service.get_anomaly_timeline(
        db=db,
        user_id=current_user.id,
        days=days,
    )


@router.patch(
    "/{anomaly_id}/status",
    response_model=AnomalyItemResponse,
    summary="Update anomaly resolution status (acknowledge or dismiss)",
)
async def update_anomaly_status(
    anomaly_id: str,
    payload: AnomalyStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allows user to mark an unusual transaction as acknowledged or dismissed."""
    item = await anomaly_service.update_anomaly_status(
        db=db,
        user_id=current_user.id,
        anomaly_id=anomaly_id,
        new_status=payload.status,
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anomaly record not found.",
        )
    return item


@router.post(
    "/scan",
    response_model=AnomalyScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger statistical scan across all transactions",
)
async def trigger_anomaly_scan(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Executes fresh statistical outlier detection across historical transactions."""
    return await anomaly_service.scan_and_detect_anomalies(
        db=db,
        user_id=current_user.id,
    )
