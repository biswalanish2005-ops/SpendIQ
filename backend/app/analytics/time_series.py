from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.transaction import Transaction
from app.schemas.analytics import TimeSeriesPoint, SpendingTrendResponse

class TimeSeriesAnalytics:
    @staticmethod
    async def get_monthly_spending_trend(
        db: AsyncSession,
        user_id: str,
        months_back: int = 6,
        account_id: Optional[str] = None,
    ) -> SpendingTrendResponse:
        """
        Generate month-by-month spending time series structured for Recharts visualization.
        """
        # Find latest transaction date for anchoring
        latest_tx_query = select(func.max(Transaction.occurred_at)).where(Transaction.user_id == user_id)
        if account_id:
            latest_tx_query = latest_tx_query.where(Transaction.account_id == account_id)
        latest_res = await db.execute(latest_tx_query)
        latest_date = latest_res.scalar_one_or_none()
        anchor_date = latest_date if latest_date else datetime.now(timezone.utc)

        points: List[TimeSeriesPoint] = []
        total_historical = Decimal("0.00")
        counted_months = 0

        # Query each month
        for offset in range(months_back - 1, -1, -1):
            ref = anchor_date - timedelta(days=offset * 30.5)
            y, m = ref.year, ref.month
            m_start = datetime(y, m, 1, tzinfo=timezone.utc)
            if m == 12:
                m_end = datetime(y + 1, 1, 1, tzinfo=timezone.utc)
            else:
                m_end = datetime(y, m + 1, 1, tzinfo=timezone.utc)

            filters = [
                Transaction.user_id == user_id,
                Transaction.direction == "EXPENSE",
                Transaction.occurred_at >= m_start,
                Transaction.occurred_at < m_end,
            ]
            if account_id:
                filters.append(Transaction.account_id == account_id)

            q = (
                select(func.coalesce(func.sum(Transaction.amount), Decimal("0.00")))
                .where(*filters)
            )
            res = await db.execute(q)
            amt = Decimal(str(res.scalar_one()))

            period_label = m_start.strftime("%b")
            points.append(
                TimeSeriesPoint(
                    period=period_label,
                    date=m_start.strftime("%Y-%m-%d"),
                    actual=amt,
                    historical_average=None,  # filled below once baseline is calculated
                )
            )
            if amt > 0:
                total_historical += amt
                counted_months += 1

        baseline = round(total_historical / Decimal(max(counted_months, 1)), 2)
        if baseline == 0:
            baseline = Decimal("3600.00")

        # Assign baseline to points
        for p in points:
            p.historical_average = baseline

        return SpendingTrendResponse(
            points=points,
            historical_baseline=baseline,
            granularity="MONTHLY",
        )
