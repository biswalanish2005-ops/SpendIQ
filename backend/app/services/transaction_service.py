import math
import uuid
from typing import Optional
from decimal import Decimal
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_, case
from app.models.transaction import Transaction
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionFilterParams,
    TransactionOut,
    TransactionSummary,
)
from app.schemas.common import PaginatedResponse

class TransactionService:
    @staticmethod
    def _build_filter_query(user_id: str, params: TransactionFilterParams):
        """Construct the SQLAlchemy select query applying all search and filter conditions."""
        query = select(Transaction).where(Transaction.user_id == user_id)

        # Multi-field search across merchant, description, category
        if params.search:
            term = f"%{params.search.strip()}%"
            query = query.where(
                or_(
                    Transaction.merchant_name.ilike(term),
                    Transaction.description.ilike(term),
                    Transaction.category_name.ilike(term),
                )
            )

        if params.start_date:
            query = query.where(Transaction.occurred_at >= params.start_date)
        if params.end_date:
            query = query.where(Transaction.occurred_at <= params.end_date)
        if params.category:
            query = query.where(Transaction.category_name == params.category)
        if params.merchant:
            query = query.where(Transaction.merchant_name.ilike(f"%{params.merchant}%"))
        if params.direction:
            query = query.where(Transaction.direction == params.direction.upper())
        if params.min_amount is not None:
            query = query.where(Transaction.amount >= params.min_amount)
        if params.max_amount is not None:
            query = query.where(Transaction.amount <= params.max_amount)
        if params.account_id:
            query = query.where(Transaction.account_id == params.account_id)

        return query

    @staticmethod
    async def get_multi(
        db: AsyncSession,
        user_id: str,
        params: TransactionFilterParams,
    ) -> PaginatedResponse[TransactionOut]:
        """Fetch filtered, paginated transactions strictly scoped to user_id."""
        query = TransactionService._build_filter_query(user_id, params)

        # Count total matching records
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        # Dynamic sort and paginate
        sort_col_name = params.sort_by or "occurred_at"
        allowed_sort_fields = {
            "occurred_at": Transaction.occurred_at,
            "amount": Transaction.amount,
            "merchant_name": Transaction.merchant_name,
            "category_name": Transaction.category_name,
            "created_at": Transaction.created_at,
        }
        sort_column = allowed_sort_fields.get(sort_col_name, Transaction.occurred_at)
        order_fn = asc if (params.sort_order or "desc").lower() == "asc" else desc

        offset = (params.page - 1) * params.page_size
        paginated_query = query.order_by(order_fn(sort_column)).offset(offset).limit(params.page_size)
        
        result = await db.execute(paginated_query)
        transactions = result.scalars().all()

        total_pages = math.ceil(total / params.page_size) if total > 0 else 1

        return PaginatedResponse(
            items=[TransactionOut.model_validate(t) for t in transactions],
            total=total,
            page=params.page,
            page_size=params.page_size,
            total_pages=total_pages,
            has_next=params.page < total_pages,
            has_previous=params.page > 1,
        )

    @staticmethod
    async def get_summary(
        db: AsyncSession,
        user_id: str,
        params: TransactionFilterParams,
    ) -> TransactionSummary:
        """Compute aggregated inflow, outflow, investment volume, and net cash flow."""
        filtered_subq = TransactionService._build_filter_query(user_id, params).subquery()

        summary_query = select(
            func.count().label("total_count"),
            func.coalesce(
                func.sum(
                    case((filtered_subq.c.direction == "INCOME", filtered_subq.c.amount), else_=Decimal("0.00"))
                ),
                Decimal("0.00"),
            ).label("total_income"),
            func.coalesce(
                func.sum(
                    case((filtered_subq.c.direction == "EXPENSE", filtered_subq.c.amount), else_=Decimal("0.00"))
                ),
                Decimal("0.00"),
            ).label("total_expense"),
            func.coalesce(
                func.sum(
                    case((filtered_subq.c.direction == "INVESTMENT", filtered_subq.c.amount), else_=Decimal("0.00"))
                ),
                Decimal("0.00"),
            ).label("total_investment"),
        )
        result = await db.execute(summary_query)
        row = result.one()

        total_count = int(row.total_count or 0)
        total_income = Decimal(str(row.total_income or 0))
        total_expense = Decimal(str(row.total_expense or 0))
        total_investment = Decimal(str(row.total_investment or 0))
        net_cash_flow = total_income - total_expense - total_investment

        return TransactionSummary(
            total_count=total_count,
            total_income=total_income,
            total_expense=total_expense,
            total_investment=total_investment,
            net_cash_flow=net_cash_flow,
        )

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        user_id: str,
        transaction_id: str,
    ) -> Optional[Transaction]:
        """Fetch a specific transaction strictly verifying user ownership."""
        query = select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id,
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        user_id: str,
        tx_in: TransactionCreate,
    ) -> Transaction:
        """Create a normalized transaction for user."""
        transaction = Transaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            account_id=tx_in.account_id,
            category_id=tx_in.category_id,
            category_name=tx_in.category_name,
            occurred_at=tx_in.occurred_at,
            amount=tx_in.amount,
            currency=tx_in.currency,
            direction=tx_in.direction.upper(),
            merchant_name=tx_in.merchant_name,
            description=tx_in.description or "",
            source=tx_in.source,
        )
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)
        return transaction

    @staticmethod
    async def update(
        db: AsyncSession,
        user_id: str,
        transaction_id: str,
        tx_in: TransactionUpdate,
    ) -> Optional[Transaction]:
        """Update transaction fields while enforcing user scoping."""
        transaction = await TransactionService.get_by_id(db, user_id, transaction_id)
        if not transaction:
            return None

        update_data = tx_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "direction" and value:
                setattr(transaction, field, value.upper())
            else:
                setattr(transaction, field, value)

        await db.commit()
        await db.refresh(transaction)
        return transaction

    @staticmethod
    async def delete(
        db: AsyncSession,
        user_id: str,
        transaction_id: str,
    ) -> bool:
        """Delete transaction verifying user ownership."""
        transaction = await TransactionService.get_by_id(db, user_id, transaction_id)
        if not transaction:
            return False

        await db.delete(transaction)
        await db.commit()
        return True
