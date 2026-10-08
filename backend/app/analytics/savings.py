from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.transaction import Transaction
from app.models.account import Account
from app.schemas.savings_investments import (
    MonthlySavingsPoint,
    EmergencyFundDetails,
    SavingsIntelligenceResponse,
)


class SavingsAnalytics:
    @staticmethod
    async def get_savings_intelligence(
        db: AsyncSession,
        user_id: str,
        reference_date: Optional[datetime] = None,
        months_back: int = 6,
    ) -> SavingsIntelligenceResponse:
        """
        Calculates savings rate, historical trajectory against 20% benchmark,
        emergency fund runway and liquid reserve metrics, and next-month projection.
        """
        # Determine anchor reference date from latest transaction or system now
        if not reference_date:
            latest_tx_query = select(func.max(Transaction.occurred_at)).where(Transaction.user_id == user_id)
            latest_res = await db.execute(latest_tx_query)
            latest_date = latest_res.scalar_one_or_none()
            anchor_date = latest_date if latest_date else datetime.now(timezone.utc)
        else:
            anchor_date = reference_date

        anchor_year = anchor_date.year
        anchor_month = anchor_date.month

        # Build consecutive monthly intervals
        trajectory: List[MonthlySavingsPoint] = []
        historical_expenses: List[float] = []
        historical_savings_rates: List[float] = []

        for offset in range(months_back - 1, -1, -1):
            total_month_idx = anchor_year * 12 + (anchor_month - 1) - offset
            y = total_month_idx // 12
            m = (total_month_idx % 12) + 1

            m_start = datetime(y, m, 1, 0, 0, 0, tzinfo=timezone.utc)
            if m == 12:
                m_end = datetime(y + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
            else:
                m_end = datetime(y, m + 1, 1, 0, 0, 0, tzinfo=timezone.utc)

            # Query income
            q_income = (
                select(func.coalesce(func.sum(Transaction.amount), Decimal("0.00")))
                .where(
                    Transaction.user_id == user_id,
                    Transaction.direction == "INCOME",
                    Transaction.occurred_at >= m_start,
                    Transaction.occurred_at < m_end,
                )
            )
            res_income = await db.execute(q_income)
            income = float(res_income.scalar_one())

            # Query expenses
            q_expense = (
                select(func.coalesce(func.sum(Transaction.amount), Decimal("0.00")))
                .where(
                    Transaction.user_id == user_id,
                    Transaction.direction == "EXPENSE",
                    Transaction.occurred_at >= m_start,
                    Transaction.occurred_at < m_end,
                )
            )
            res_expense = await db.execute(q_expense)
            expenses = float(res_expense.scalar_one())

            savings = round(income - expenses, 2)
            savings_rate = round((savings / income) * 100.0, 1) if income > 0 else 0.0

            if expenses > 0:
                historical_expenses.append(expenses)
            if income > 0:
                historical_savings_rates.append(savings_rate)

            trajectory.append(
                MonthlySavingsPoint(
                    period_date=m_start.strftime("%Y-%m-%d"),
                    period_label=m_start.strftime("%b %Y"),
                    income=income,
                    expenses=expenses,
                    savings_amount=savings,
                    savings_rate=savings_rate,
                    target_benchmark_rate=20.0,
                    is_projected=False,
                )
            )

        # Current vs Previous month calculations
        curr_point = trajectory[-1]
        prev_point = trajectory[-2] if len(trajectory) >= 2 else curr_point

        current_savings_amount = curr_point.savings_amount
        current_savings_rate = curr_point.savings_rate
        mom_change_rate = round(curr_point.savings_rate - prev_point.savings_rate, 1)

        # Semantic status: Savings rate increase is IMPROVING (Positive)
        if mom_change_rate > 0.5:
            direction = "INCREASE"
            financial_impact = "POSITIVE"
            status = "IMPROVING"
        elif mom_change_rate < -0.5:
            direction = "DECREASE"
            financial_impact = "NEGATIVE"
            status = "CONCERNING"
        else:
            direction = "STABLE"
            financial_impact = "NEUTRAL"
            status = "STABLE"

        avg_savings_rate_6m = (
            round(sum(historical_savings_rates) / len(historical_savings_rates), 1)
            if historical_savings_rates
            else 0.0
        )

        # Emergency Fund Reserve calculations
        q_accounts = select(Account).where(
            Account.user_id == user_id,
            Account.is_active == True,
            Account.type.in_(["CHECKING", "SAVINGS"]),
        )
        res_accounts = await db.execute(q_accounts)
        liquid_accounts = res_accounts.scalars().all()
        liquid_balance = round(sum(float(acc.balance) for acc in liquid_accounts if acc.balance > 0), 2)

        # 6-month average monthly expense burn rate
        monthly_burn_rate = (
            round(sum(historical_expenses) / len(historical_expenses), 2)
            if historical_expenses
            else 3600.0
        )
        if monthly_burn_rate <= 0:
            monthly_burn_rate = 3600.0

        months_of_coverage = round(liquid_balance / monthly_burn_rate, 1)
        target_reserve_amount = round(monthly_burn_rate * 6, 2)
        funding_percentage = round((liquid_balance / target_reserve_amount) * 100.0, 1) if target_reserve_amount > 0 else 100.0

        if months_of_coverage >= 6.0:
            ef_status = "EXCELLENT"
        elif months_of_coverage >= 3.0:
            ef_status = "ADEQUATE"
        else:
            ef_status = "NEEDS_ATTENTION"

        emergency_fund = EmergencyFundDetails(
            liquid_balance=liquid_balance,
            monthly_burn_rate=monthly_burn_rate,
            months_of_coverage=months_of_coverage,
            recommended_months=6,
            target_reserve_amount=target_reserve_amount,
            funding_percentage=funding_percentage,
            status=ef_status,
        )

        # Projections for next month
        next_month_idx = anchor_year * 12 + (anchor_month - 1) + 1
        ny = next_month_idx // 12
        nm = (next_month_idx % 12) + 1
        next_date = datetime(ny, nm, 1, 0, 0, 0, tzinfo=timezone.utc)

        # Projected income (recent 3 months average or latest)
        recent_incomes = [p.income for p in trajectory[-3:] if p.income > 0]
        proj_income = round(sum(recent_incomes) / len(recent_incomes), 2) if recent_incomes else curr_point.income
        proj_expenses = round(monthly_burn_rate, 2)
        projected_next_month_savings = round(proj_income - proj_expenses, 2)
        projected_next_month_rate = round((projected_next_month_savings / proj_income) * 100.0, 1) if proj_income > 0 else 0.0

        # Add projection point to trajectory for chart visualization
        trajectory.append(
            MonthlySavingsPoint(
                period_date=next_date.strftime("%Y-%m-%d"),
                period_label=next_date.strftime("%b %Y") + " (Est)",
                income=proj_income,
                expenses=proj_expenses,
                savings_amount=projected_next_month_savings,
                savings_rate=projected_next_month_rate,
                target_benchmark_rate=20.0,
                is_projected=True,
            )
        )

        return SavingsIntelligenceResponse(
            current_savings_amount=current_savings_amount,
            current_savings_rate=current_savings_rate,
            mom_change_rate=mom_change_rate,
            direction=direction,
            financial_impact=financial_impact,
            status=status,
            average_savings_rate_6m=avg_savings_rate_6m,
            projected_next_month_savings=projected_next_month_savings,
            projected_next_month_rate=projected_next_month_rate,
            emergency_fund=emergency_fund,
            trajectory=trajectory,
        )
