from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.transaction import Transaction
from app.models.account import Account
from app.schemas.savings_investments import (
    MonthlyInvestmentPoint,
    AssetAllocationItem,
    InvestmentIntelligenceResponse,
)


class InvestmentAnalytics:
    @staticmethod
    async def get_investment_intelligence(
        db: AsyncSession,
        user_id: str,
        reference_date: Optional[datetime] = None,
        months_back: int = 6,
    ) -> InvestmentIntelligenceResponse:
        """
        Calculates investment contribution cadence, income allocation percentage,
        consistency index score, portfolio asset distribution, and next-month projection.
        """
        # Determine anchor reference date
        if not reference_date:
            latest_tx_query = select(func.max(Transaction.occurred_at)).where(Transaction.user_id == user_id)
            latest_res = await db.execute(latest_tx_query)
            latest_date = latest_res.scalar_one_or_none()
            anchor_date = latest_date if latest_date else datetime.now(timezone.utc)
        else:
            anchor_date = reference_date

        anchor_year = anchor_date.year
        anchor_month = anchor_date.month

        cadence: List[MonthlyInvestmentPoint] = []
        cumulative_invested = 0.0
        historical_contributions: List[float] = []

        for offset in range(months_back - 1, -1, -1):
            total_month_idx = anchor_year * 12 + (anchor_month - 1) - offset
            y = total_month_idx // 12
            m = (total_month_idx % 12) + 1

            m_start = datetime(y, m, 1, 0, 0, 0, tzinfo=timezone.utc)
            if m == 12:
                m_end = datetime(y + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
            else:
                m_end = datetime(y, m + 1, 1, 0, 0, 0, tzinfo=timezone.utc)

            # Query investment contributions
            q_invest = (
                select(func.coalesce(func.sum(Transaction.amount), Decimal("0.00")))
                .where(
                    Transaction.user_id == user_id,
                    Transaction.direction == "INVESTMENT",
                    Transaction.occurred_at >= m_start,
                    Transaction.occurred_at < m_end,
                )
            )
            res_invest = await db.execute(q_invest)
            contribution = float(res_invest.scalar_one())

            # Query monthly income for share percentage
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

            cumulative_invested += contribution
            income_share = round((contribution / income) * 100.0, 1) if income > 0 else 0.0

            if contribution > 0:
                historical_contributions.append(contribution)

            cadence.append(
                MonthlyInvestmentPoint(
                    period_date=m_start.strftime("%Y-%m-%d"),
                    period_label=m_start.strftime("%b %Y"),
                    contribution_amount=round(contribution, 2),
                    income_share_pct=income_share,
                    cumulative_invested=round(cumulative_invested, 2),
                    is_projected=False,
                )
            )

        # Current vs Previous month calculations
        curr_point = cadence[-1]
        prev_point = cadence[-2] if len(cadence) >= 2 else curr_point

        current_monthly_contribution = curr_point.contribution_amount
        income_share_percentage = curr_point.income_share_pct

        if prev_point.contribution_amount > 0:
            mom_change_percentage = round(
                ((curr_point.contribution_amount - prev_point.contribution_amount) / prev_point.contribution_amount)
                * 100.0,
                1,
            )
        else:
            mom_change_percentage = 100.0 if curr_point.contribution_amount > 0 else 0.0

        # Semantic status: Investment contribution increase is IMPROVING (Positive)
        if mom_change_percentage > 0.5:
            direction = "INCREASE"
            financial_impact = "POSITIVE"
            status = "IMPROVING"
        elif mom_change_percentage < -0.5:
            direction = "DECREASE"
            financial_impact = "NEGATIVE"
            status = "CONCERNING"
        else:
            direction = "STABLE"
            financial_impact = "NEUTRAL"
            status = "STABLE"

        # Consistency scoring: percentage of historical months with active contributions (0 - 100)
        active_months = sum(1 for p in cadence if p.contribution_amount > 0)
        consistency_score = round((active_months / len(cadence)) * 100.0, 1) if cadence else 0.0

        # Query all active accounts for asset allocation and portfolio balance
        q_accounts = select(Account).where(
            Account.user_id == user_id,
            Account.is_active == True,
        )
        res_accounts = await db.execute(q_accounts)
        accounts = res_accounts.scalars().all()

        total_portfolio_balance = round(
            sum(float(acc.balance) for acc in accounts if acc.type == "INVESTMENT" and acc.balance > 0),
            2,
        )

        total_positive_assets = sum(float(acc.balance) for acc in accounts if acc.balance > 0)
        allocations: List[AssetAllocationItem] = []

        for acc in accounts:
            bal = float(acc.balance)
            if bal > 0:
                pct = round((bal / total_positive_assets) * 100.0, 1) if total_positive_assets > 0 else 0.0
                allocations.append(
                    AssetAllocationItem(
                        name=acc.name,
                        account_type=acc.type,
                        institution=acc.institution_name,
                        balance=round(bal, 2),
                        percentage=pct,
                    )
                )

        # Sort allocations by balance descending
        allocations.sort(key=lambda x: x.balance, reverse=True)

        # Next month projection
        next_month_idx = anchor_year * 12 + (anchor_month - 1) + 1
        ny = next_month_idx // 12
        nm = (next_month_idx % 12) + 1
        next_date = datetime(ny, nm, 1, 0, 0, 0, tzinfo=timezone.utc)

        # Projected contribution based on recent non-zero contributions or current
        recent_contribs = [p.contribution_amount for p in cadence[-3:] if p.contribution_amount > 0]
        proj_contrib = (
            round(sum(recent_contribs) / len(recent_contribs), 2)
            if recent_contribs
            else curr_point.contribution_amount
        )

        # Add projection point to cadence
        cadence.append(
            MonthlyInvestmentPoint(
                period_date=next_date.strftime("%Y-%m-%d"),
                period_label=next_date.strftime("%b %Y") + " (Est)",
                contribution_amount=proj_contrib,
                income_share_pct=curr_point.income_share_pct,
                cumulative_invested=round(cumulative_invested + proj_contrib, 2),
                is_projected=True,
            )
        )

        return InvestmentIntelligenceResponse(
            current_monthly_contribution=current_monthly_contribution,
            income_share_percentage=income_share_percentage,
            mom_change_percentage=mom_change_percentage,
            direction=direction,
            financial_impact=financial_impact,
            status=status,
            consistency_score=consistency_score,
            total_portfolio_balance=total_portfolio_balance,
            projected_next_month_contribution=proj_contrib,
            allocations=allocations,
            cadence=cadence,
        )
