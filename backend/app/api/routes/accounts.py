import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.account import Account
from app.schemas.account import AccountCreate, AccountOut

router = APIRouter()

@router.get("", response_model=List[AccountOut])
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve all financial accounts for current user."""
    result = await db.execute(
        select(Account).where(Account.user_id == current_user.id).order_by(Account.name)
    )
    accounts = result.scalars().all()
    return [AccountOut.model_validate(a) for a in accounts]

@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_in: AccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new account for the current user."""
    account = Account(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=account_in.name,
        type=account_in.type.upper(),
        institution_name=account_in.institution_name,
        currency=account_in.currency,
        balance=account_in.balance,
        is_active=True,
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return AccountOut.model_validate(account)
