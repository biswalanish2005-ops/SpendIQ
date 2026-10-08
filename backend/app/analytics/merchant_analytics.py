from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.transaction import Transaction
from app.schemas.analytics import MerchantAggregate

class MerchantAnalytics:
    @staticmethod
    async def get_top_merchants(
        db: AsyncSession,
        user_id: str,
        limit: int = 10,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        account_id: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[MerchantAggregate]:
        """
        Rank top merchants by total spending with average ticket and transaction frequency.
        """
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
        if category and category != "ALL":
            base_filters.append(Transaction.category_name == category)

        # Get total spending across all merchants in period for percentage calculation
        total_q = select(func.coalesce(func.sum(Transaction.amount), Decimal("0.00"))).where(*base_filters)
        total_res = await db.execute(total_q)
        total_spending = Decimal(str(total_res.scalar_one()))

        # Aggregate by merchant
        agg_q = (
            select(
                Transaction.merchant_name,
                func.sum(Transaction.amount).label("total_amount"),
                func.count(Transaction.id).label("tx_count"),
            )
            .where(*base_filters)
            .group_by(Transaction.merchant_name)
            .order_by(func.sum(Transaction.amount).desc())
            .limit(limit)
        )
        result = await db.execute(agg_q)
        rows = result.all()

        merchants: List[MerchantAggregate] = []
        for r in rows:
            amt = Decimal(str(r.total_amount))
            avg_ticket = round(amt / Decimal(r.tx_count), 2) if r.tx_count > 0 else Decimal("0.00")
            pct = round((amt / total_spending) * Decimal("100"), 1) if total_spending > 0 else Decimal("0.0")

            merchants.append(
                MerchantAggregate(
                    merchant_name=r.merchant_name,
                    amount=amt,
                    transaction_count=r.tx_count,
                    average_ticket=avg_ticket,
                    percentage=pct,
                )
            )

        return merchants
