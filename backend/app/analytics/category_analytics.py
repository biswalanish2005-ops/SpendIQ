from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.transaction import Transaction
from app.models.category import Category
from app.analytics.semantics import calculate_variance
from app.schemas.analytics import CategoryAggregate, CategoryBreakdownResponse

class CategoryAnalytics:
    @staticmethod
    async def get_breakdown(
        db: AsyncSession,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        account_id: Optional[str] = None,
    ) -> CategoryBreakdownResponse:
        """
        Calculate category aggregates, wallet share, and fixed vs discretionary ratio.
        """
        # Query Category mapping for group classification
        cat_map_res = await db.execute(select(Category))
        categories_db = cat_map_res.scalars().all()
        cat_group_map = {c.name: c.group for c in categories_db}

        # Base query for expense transactions
        base_filters = [
            Transaction.user_id == user_id,
            Transaction.direction == "EXPENSE",
        ]
        if start_date:
            base_filters.append(Transaction.occurred_at >= start_date)
        if end_date:
            base_filters.append(Transaction.occurred_at < end_date)
        if account_id:
            base_filters.append(Transaction.account_id == account_id)

        # Aggregate by category
        agg_query = (
            select(
                Transaction.category_name,
                func.sum(Transaction.amount).label("total_amount"),
                func.count(Transaction.id).label("tx_count"),
            )
            .where(*base_filters)
            .group_by(Transaction.category_name)
            .order_by(func.sum(Transaction.amount).desc())
        )
        result = await db.execute(agg_query)
        rows = result.all()

        total_spending = sum((Decimal(str(r.total_amount)) for r in rows), Decimal("0.00"))

        categories: List[CategoryAggregate] = []
        fixed_amount = Decimal("0.00")
        discretionary_amount = Decimal("0.00")

        for r in rows:
            amt = Decimal(str(r.total_amount))
            pct = round((amt / total_spending) * Decimal("100"), 1) if total_spending > 0 else Decimal("0.0")
            grp = cat_group_map.get(r.category_name, "Discretionary")

            if grp == "Fixed":
                fixed_amount += amt
            else:
                discretionary_amount += amt

            categories.append(
                CategoryAggregate(
                    category_name=r.category_name,
                    group=grp,
                    amount=amt,
                    percentage=pct,
                    transaction_count=r.tx_count,
                    change_percent=None,
                )
            )

        discretionary_ratio = (
            round((discretionary_amount / total_spending) * Decimal("100"), 1)
            if total_spending > 0
            else Decimal("0.0")
        )

        return CategoryBreakdownResponse(
            total_spending=total_spending,
            categories=categories,
            fixed_amount=fixed_amount,
            discretionary_amount=discretionary_amount,
            discretionary_ratio=discretionary_ratio,
        )
