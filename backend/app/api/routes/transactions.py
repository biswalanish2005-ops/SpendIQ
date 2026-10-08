from datetime import datetime
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionOut,
    TransactionFilterParams,
    TransactionSummary,
)
from app.schemas.common import PaginatedResponse
from app.services.transaction_service import TransactionService

router = APIRouter()

# Whitelist of allowed sort columns — prevents column name injection
_ALLOWED_SORT_COLUMNS = frozenset({
    "occurred_at", "amount", "merchant_name", "category_name", "created_at",
})

@router.get("", response_model=PaginatedResponse[TransactionOut])
async def list_transactions(
    search: Optional[str] = Query(None, description="Search across merchant, description, and category"),
    start_date: Optional[datetime] = Query(None, description="Start date filter (inclusive)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (inclusive)"),
    category: Optional[str] = Query(None, description="Category name filter"),
    merchant: Optional[str] = Query(None, description="Merchant name partial match"),
    direction: Optional[str] = Query(None, description="Direction: INCOME, EXPENSE, INVESTMENT"),
    min_amount: Optional[Decimal] = Query(None, ge=0, description="Minimum amount"),
    max_amount: Optional[Decimal] = Query(None, ge=0, description="Maximum amount"),
    account_id: Optional[str] = Query(None, description="Account ID"),
    sort_by: Optional[str] = Query("occurred_at", description="Field to sort by: occurred_at, amount, merchant_name, category_name"),
    sort_order: Optional[str] = Query("desc", description="Sort direction: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List transactions with multi-parameter search, filtering, dynamic sorting, and pagination scoped to current user."""
    # Security: validate sort_by against whitelist to prevent column name injection
    effective_sort_by = sort_by or "occurred_at"
    if effective_sort_by not in _ALLOWED_SORT_COLUMNS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid sort_by value '{effective_sort_by}'. Allowed: {sorted(_ALLOWED_SORT_COLUMNS)}",
        )
    params = TransactionFilterParams(
        search=search,
        start_date=start_date,
        end_date=end_date,
        category=category,
        merchant=merchant,
        direction=direction,
        min_amount=min_amount,
        max_amount=max_amount,
        account_id=account_id,
        sort_by=effective_sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return await TransactionService.get_multi(db, current_user.id, params)


@router.get("/summary", response_model=TransactionSummary)
async def get_transactions_summary(
    search: Optional[str] = Query(None, description="Search across merchant, description, and category"),
    start_date: Optional[datetime] = Query(None, description="Start date filter (inclusive)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (inclusive)"),
    category: Optional[str] = Query(None, description="Category name filter"),
    merchant: Optional[str] = Query(None, description="Merchant name partial match"),
    direction: Optional[str] = Query(None, description="Direction: INCOME, EXPENSE, INVESTMENT"),
    min_amount: Optional[Decimal] = Query(None, ge=0, description="Minimum amount"),
    max_amount: Optional[Decimal] = Query(None, ge=0, description="Maximum amount"),
    account_id: Optional[str] = Query(None, description="Account ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Compute aggregate inflow, outflow, investment volume, and net cash flow for current filter scope."""
    params = TransactionFilterParams(
        search=search,
        start_date=start_date,
        end_date=end_date,
        category=category,
        merchant=merchant,
        direction=direction,
        min_amount=min_amount,
        max_amount=max_amount,
        account_id=account_id,
        page=1,
        page_size=1,
    )
    return await TransactionService.get_summary(db, current_user.id, params)

@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    tx_in: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new transaction for the current user."""
    tx = await TransactionService.create(db, current_user.id, tx_in)
    return TransactionOut.model_validate(tx)

@router.get("/{transaction_id}", response_model=TransactionOut)
async def get_transaction(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Fetch a specific transaction with ownership verification."""
    tx = await TransactionService.get_by_id(db, current_user.id, transaction_id)
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return TransactionOut.model_validate(tx)

@router.patch("/{transaction_id}", response_model=TransactionOut)
async def update_transaction(
    transaction_id: str,
    tx_in: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a specific transaction."""
    tx = await TransactionService.update(db, current_user.id, transaction_id, tx_in)
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return TransactionOut.model_validate(tx)

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a transaction."""
    success = await TransactionService.delete(db, current_user.id, transaction_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return None
