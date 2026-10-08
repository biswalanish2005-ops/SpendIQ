from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.transaction import Transaction
from app.analytics.semantics import calculate_variance, calculate_semantic_status
from app.schemas.analytics import MetricCardAnalytics, CashFlowOverview

class CashFlowAnalytics:
    @staticmethod
    async def get_overview(
        db: AsyncSession,
        user_id: str,
        reference_date: Optional[datetime] = None,
        account_id: Optional[str] = None,
    ) -> CashFlowOverview:
        """
        Calculates deterministic cash flow metrics (Spending, Savings, Income, Investments, Savings Rate)
        for the current month relative to reference_date (or latest transaction date), comparing against previous month.
        """
        if not reference_date:
            # Find the most recent transaction date for the user to anchor analysis
            latest_tx_query = select(func.max(Transaction.occurred_at)).where(Transaction.user_id == user_id)
            if account_id:
                latest_tx_query = latest_tx_query.where(Transaction.account_id == account_id)
            latest_res = await db.execute(latest_tx_query)
            latest_date = latest_res.scalar_one_or_none()
            reference_date = latest_date if latest_date else datetime.now(timezone.utc)

        # Define current month bounds
        year = reference_date.year
        month = reference_date.month
        current_start = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
        
        # Calculate next month start for upper bound
        if month == 12:
            current_end = datetime(year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        else:
            current_end = datetime(year, month + 1, 1, 0, 0, 0, tzinfo=timezone.utc)

        # Define previous month bounds
        if month == 1:
            prev_start = datetime(year - 1, 12, 1, 0, 0, 0, tzinfo=timezone.utc)
            prev_end = current_start
        else:
            prev_start = datetime(year, month - 1, 1, 0, 0, 0, tzinfo=timezone.utc)
            prev_end = current_start

        # Helper to query sum for direction and date range
        async def sum_direction(direction: str, start: datetime, end: datetime) -> Decimal:
            filters = [
                Transaction.user_id == user_id,
                Transaction.direction == direction,
                Transaction.occurred_at >= start,
                Transaction.occurred_at < end,
            ]
            if account_id:
                filters.append(Transaction.account_id == account_id)
            q = (
                select(func.coalesce(func.sum(Transaction.amount), Decimal("0.00")))
                .where(*filters)
            )
            res = await db.execute(q)
            return Decimal(str(res.scalar_one()))

        # Current month aggregates
        curr_income = await sum_direction("INCOME", current_start, current_end)
        curr_spending = await sum_direction("EXPENSE", current_start, current_end)
        curr_investments = await sum_direction("INVESTMENT", current_start, current_end)
        curr_savings = curr_income - curr_spending

        # Previous month aggregates
        prev_income = await sum_direction("INCOME", prev_start, prev_end)
        prev_spending = await sum_direction("EXPENSE", prev_start, prev_end)
        prev_investments = await sum_direction("INVESTMENT", prev_start, prev_end)
        prev_savings = prev_income - prev_spending

        # Historical baseline: 6-month average spending
        six_months_ago = current_start - timedelta(days=180)
        hist_spend_q = (
            select(func.coalesce(func.sum(Transaction.amount), Decimal("0.00")))
            .where(
                Transaction.user_id == user_id,
                Transaction.direction == "EXPENSE",
                Transaction.occurred_at >= six_months_ago,
                Transaction.occurred_at < current_start,
            )
        )
        hist_res = await db.execute(hist_spend_q)
        hist_spend_total = Decimal(str(hist_res.scalar_one()))
        hist_spend_avg = round(hist_spend_total / Decimal("5"), 2) if hist_spend_total > 0 else Decimal("3600.00")

        # Savings Rates
        curr_savings_rate = round((curr_savings / curr_income) * Decimal("100"), 1) if curr_income > 0 else Decimal("0.0")
        prev_savings_rate = round((prev_savings / prev_income) * Decimal("100"), 1) if prev_income > 0 else Decimal("0.0")

        # Sparklines (last 5 months spending & savings)
        spend_sparkline: List[Decimal] = []
        save_sparkline: List[Decimal] = []
        for offset in range(4, -1, -1):
            m_date = current_start - timedelta(days=offset * 30)
            m_start = datetime(m_date.year, m_date.month, 1, tzinfo=timezone.utc)
            if m_date.month == 12:
                m_end = datetime(m_date.year + 1, 1, 1, tzinfo=timezone.utc)
            else:
                m_end = datetime(m_date.year, m_date.month + 1, 1, tzinfo=timezone.utc)
            s_val = await sum_direction("EXPENSE", m_start, m_end)
            i_val = await sum_direction("INCOME", m_start, m_end)
            spend_sparkline.append(s_val)
            save_sparkline.append(i_val - s_val)

        # Build Spending Metric
        sp_amt, sp_pct, sp_dir = calculate_variance(curr_spending, prev_spending)
        sp_stat, sp_imp, sp_lbl = calculate_semantic_status("SPENDING", sp_pct)
        spending_metric = MetricCardAnalytics(
            metric="SPENDING",
            label="Monthly Spending",
            current=curr_spending,
            previous=prev_spending,
            change_amount=sp_amt,
            change_percent=sp_pct,
            direction=sp_dir,
            impact=sp_imp,
            status=sp_stat,
            status_label=sp_lbl,
            historical_average=hist_spend_avg,
            sparkline=spend_sparkline,
        )

        # Build Savings Metric
        sv_amt, sv_pct, sv_dir = calculate_variance(curr_savings, prev_savings)
        sv_stat, sv_imp, sv_lbl = calculate_semantic_status("SAVINGS", sv_pct)
        savings_metric = MetricCardAnalytics(
            metric="SAVINGS",
            label="Total Saved",
            current=curr_savings,
            previous=prev_savings,
            change_amount=sv_amt,
            change_percent=sv_pct,
            direction=sv_dir,
            impact=sv_imp,
            status=sv_stat,
            status_label=sv_lbl,
            historical_average=round(curr_income - hist_spend_avg, 2) if curr_income > hist_spend_avg else None,
            sparkline=save_sparkline,
        )

        # Build Income Metric
        inc_amt, inc_pct, inc_dir = calculate_variance(curr_income, prev_income)
        inc_stat, inc_imp, inc_lbl = calculate_semantic_status("INCOME", inc_pct)
        income_metric = MetricCardAnalytics(
            metric="INCOME",
            label="Net Income",
            current=curr_income,
            previous=prev_income,
            change_amount=inc_amt,
            change_percent=inc_pct,
            direction=inc_dir,
            impact=inc_imp,
            status=inc_stat,
            status_label=inc_lbl,
            historical_average=prev_income if prev_income > 0 else curr_income,
            sparkline=[],
        )

        # Build Investments Metric
        inv_amt, inv_pct, inv_dir = calculate_variance(curr_investments, prev_investments)
        inv_stat, inv_imp, inv_lbl = calculate_semantic_status("INVESTMENT", inv_pct)
        investments_metric = MetricCardAnalytics(
            metric="INVESTMENT",
            label="Investments",
            current=curr_investments,
            previous=prev_investments,
            change_amount=inv_amt,
            change_percent=inv_pct,
            direction=inv_dir,
            impact=inv_imp,
            status=inv_stat,
            status_label=inv_lbl,
            historical_average=prev_investments if prev_investments > 0 else Decimal("750.00"),
            sparkline=[],
        )

        # Build Savings Rate Metric
        sr_amt, sr_pct, sr_dir = calculate_variance(curr_savings_rate, prev_savings_rate)
        sr_stat, sr_imp, sr_lbl = calculate_semantic_status("SAVINGS_RATE", sr_pct)
        savings_rate_metric = MetricCardAnalytics(
            metric="SAVINGS_RATE",
            label="Savings Rate",
            current=curr_savings_rate,
            previous=prev_savings_rate,
            change_amount=sr_amt,
            change_percent=sr_pct,
            direction=sr_dir,
            impact=sr_imp,
            status=sr_stat,
            status_label=sr_lbl,
            currency="%",
        )

        # Average Daily Spend
        days_in_month = reference_date.day if reference_date.day > 0 else 30
        avg_daily_spend = round(curr_spending / Decimal(days_in_month), 2)

        return CashFlowOverview(
            spending=spending_metric,
            savings=savings_metric,
            income=income_metric,
            investments=investments_metric,
            savings_rate=savings_rate_metric,
            average_daily_spend=avg_daily_spend,
            period_label=reference_date.strftime("%B %Y"),
        )
