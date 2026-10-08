import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryOut

router = APIRouter()

@router.get("", response_model=List[CategoryOut])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve system-wide default categories and user-specific custom categories."""
    result = await db.execute(
        select(Category)
        .where(or_(Category.user_id == current_user.id, Category.user_id.is_(None)))
        .order_by(Category.group, Category.name)
    )
    categories = result.scalars().all()
    return [CategoryOut.model_validate(c) for c in categories]

@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a user custom category."""
    category = Category(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=category_in.name,
        group=category_in.group,
        icon=category_in.icon,
        is_system=False,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return CategoryOut.model_validate(category)
