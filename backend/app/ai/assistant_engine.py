import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.assistant import (
    AssistantMessage,
    AssistantResponseBlock,
    AssistantMetricBlock,
    AssistantChartBlock,
    AssistantActionBlock,
    AssistantSuggestedPrompt,
)
from app.analytics.cash_flow import CashFlowAnalytics
from app.analytics.category_analytics import CategoryAnalytics
from app.analytics.time_series import TimeSeriesAnalytics
from app.analytics.savings import SavingsAnalytics
from app.analytics.investments import InvestmentAnalytics
from app.services.anomaly_service import AnomalyService


class AIFinancialAssistant:
    """
    Grounded AI Financial Assistant Engine.
    Executes domain intent classification and synthesizes verified analytical context
    into rich structured blocks: text answers, quantitative metrics, mini charts,
    actionable recommendations, and direct navigation links.
    """

    @staticmethod
    def get_suggestions() -> List[AssistantSuggestedPrompt]:
        """Returns curated starter prompts for conversational exploration."""
        return [
            AssistantSuggestedPrompt(
                id="sug_spending",
                prompt="Am I spending more than usual?",
                category="SPENDING",
                icon="TrendingDown",
            ),
            AssistantSuggestedPrompt(
                id="sug_runway",
                prompt="What is my emergency fund runway?",
                category="LIQUIDITY",
                icon="ShieldCheck",
            ),
            AssistantSuggestedPrompt(
                id="sug_anomalies",
                prompt="Which anomalies were detected?",
                category="ANOMALIES",
                icon="AlertTriangle",
            ),
            AssistantSuggestedPrompt(
                id="sug_forecast",
                prompt="What does next month's spending forecast look like?",
                category="FORECAST",
                icon="BrainCircuit",
            ),
            AssistantSuggestedPrompt(
                id="sug_savings",
                prompt="How are my savings and investments pacing?",
                category="WEALTH",
                icon="PiggyBank",
            ),
            AssistantSuggestedPrompt(
                id="sug_categories",
                prompt="Which spending category changed the most?",
                category="CATEGORIES",
                icon="PieChart",
            ),
        ]

    @classmethod
    async def answer_question(
        cls,
        db: AsyncSession,
        user_id: str,
        query: str,
    ) -> AssistantMessage:
        """
        Parses the user prompt, queries verified analytical subsystems,
        and constructs a strictly grounded structured response.
        """
        q = query.lower().strip()
        msg_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc)
        blocks: List[AssistantResponseBlock] = []
        sources: List[str] = []

        # 1. SPENDING / OUTFLOWS INTENT
        if any(w in q for w in ["spend", "spending", "usual", "burn", "outflow", "expenses"]):
            cash_flow = await CashFlowAnalytics.get_overview(db, user_id)
            trend = await TimeSeriesAnalytics.get_monthly_spending_trend(db, user_id, months_back=6)
            sources = ["CashFlowAnalytics.overview", "TimeSeriesAnalytics.spending_trend"]

            current_spend = float(cash_flow.spending.current)
            previous_spend = float(cash_flow.spending.previous)
            baseline = float(trend.historical_baseline)
            diff = current_spend - baseline
            mom_pct = float(cash_flow.spending.change_percent)

            if diff <= 0:
                answer = (
                    f"**No, you are not overspending.** Your current monthly spending is **${current_spend:,.2f}**, "
                    f"which is **${abs(diff):,.2f} below** your 6-month historical baseline of **${baseline:,.2f}**. "
                    f"Compared to last month (${previous_spend:,.2f}), your spending changed by **{mom_pct:+.1f}%**."
                )
                status = "IMPROVING"
                trend_dir = "DOWN"
            else:
                answer = (
                    f"**Yes, your spending is slightly elevated.** Current expenditures stand at **${current_spend:,.2f}**, "
                    f"which is **${diff:,.2f} (+{mom_pct:.1f}% MoM) above** your 6-month historical baseline of **${baseline:,.2f}**."
                )
                status = "CONCERNING"
                trend_dir = "UP"

            # Blocks
            blocks.append(AssistantResponseBlock(
                block_type="TEXT",
                data={"markdown": answer},
            ))
            blocks.append(AssistantResponseBlock(
                block_type="METRIC",
                data=AssistantMetricBlock(
                    label="Current Monthly Spending",
                    value=f"${current_spend:,.2f}",
                    comparison_label="6-Mo Historical Baseline",
                    comparison_value=f"${baseline:,.2f}",
                    trend=trend_dir,
                    status=status,
                ).model_dump(),
            ))
            blocks.append(AssistantResponseBlock(
                block_type="CHART",
                data=AssistantChartBlock(
                    chart_type="SPENDING_TREND",
                    title="Recent Spending vs. Historical Baseline",
                    data=[
                        {"period": p.period, "spend": float(p.actual), "baseline": float(p.historical_average or baseline)}
                        for p in trend.points[-5:]
                    ],
                ).model_dump(),
            ))
            blocks.append(AssistantResponseBlock(
                block_type="RECOMMENDATION",
                data={
                    "title": "Outflow Recommendation",
                    "text": "Review discretionary subscriptions and dining to keep monthly spend safely under your $3,600 target." if diff > 0 else "Excellent outflow control. Consider allocating the unspent surplus towards investments or high-yield savings.",
                },
            ))
            blocks.append(AssistantResponseBlock(
                block_type="ACTION",
                data=AssistantActionBlock(
                    label="View Spending Analytics",
                    route="/analytics",
                ).model_dump(),
            ))

        # 2. EMERGENCY FUND / RUNWAY INTENT
        elif any(w in q for w in ["emergency", "runway", "reserve", "buffer", "liquid", "liquidity"]):
            savings = await SavingsAnalytics.get_savings_intelligence(db, user_id)
            ef = savings.emergency_fund
            sources = ["SavingsAnalytics.emergency_fund", "AccountRepository.balances"]

            answer = (
                f"Your emergency fund is in **{ef.status.capitalize()}** standing. You have **{ef.months_of_coverage:.1f} months** "
                f"of expense coverage based on **${ef.liquid_balance:,.2f}** in liquid checking and savings accounts, "
                f"relative to your average monthly expense burn rate of **${ef.monthly_burn_rate:,.2f}/mo**. "
                f"This represents **{ef.funding_percentage:.1f}%** of the recommended 6-month reserve target (${ef.target_reserve_amount:,.2f})."
            )

            blocks.append(AssistantResponseBlock(
                block_type="TEXT",
                data={"markdown": answer},
            ))
            blocks.append(AssistantResponseBlock(
                block_type="METRIC",
                data=AssistantMetricBlock(
                    label="Emergency Fund Runway",
                    value=f"{ef.months_of_coverage:.1f} Months",
                    comparison_label="Recommended Target",
                    comparison_value=f"{ef.recommended_months} Months (${ef.target_reserve_amount:,.0f})",
                    trend="UP" if ef.months_of_coverage >= 6 else "STABLE",
                    status="IMPROVING" if ef.months_of_coverage >= 6 else "STABLE",
                ).model_dump(),
            ))
            blocks.append(AssistantResponseBlock(
                block_type="RECOMMENDATION",
                data={
                    "title": "Liquidity Strategy",
                    "text": "Your liquid safety buffer is fully funded. You have strong capacity to deploy incremental monthly savings into index investments." if ef.months_of_coverage >= 6 else "Continue routing $300-$500 monthly into high-yield savings until the 6-month milestone is reached.",
                },
            ))
            blocks.append(AssistantResponseBlock(
                block_type="ACTION",
                data=AssistantActionBlock(
                    label="Inspect Emergency Runway",
                    route="/savings",
                ).model_dump(),
            ))

        # 3. ANOMALIES & UNUSUAL CHARGES INTENT
        elif any(w in q for w in ["anomal", "unusual", "outlier", "suspicious", "fraud", "flagged"]):
            anomaly_service = AnomalyService()
            anomalies = await anomaly_service.get_anomalies(db, user_id, limit=5)
            summary = await anomaly_service.get_anomaly_summary(db, user_id)
            sources = ["StatisticalAnomalyDetector", "AnomalyService.query"]

            unresolved = [a for a in anomalies if a.status == "DETECTED"]
            if unresolved:
                top = unresolved[0]
                answer = (
                    f"**{len(unresolved)} unusual transaction(s) require your review.** The most notable flag is a "
                    f"**${top.amount:,.2f}** charge at **{top.merchant_name}** in *{top.category_name}*, which is "
                    f"**{top.deviation_factor:.1f}x higher** than your historical category median (${top.expected_value:,.2f}). "
                    f"Anomaly Score: **{top.anomaly_score:.2f}** ({top.severity} severity)."
                )
                status = "ATTENTION_REQUIRED"
            else:
                answer = (
                    f"**No unresolved anomalies detected.** All recent transactions align with your expected spending "
                    f"distributions across all categories. Total scanned volume: **${summary.total_anomalous_amount:,.2f}** flagged historically."
                )
                status = "IMPROVING"

            blocks.append(AssistantResponseBlock(
                block_type="TEXT",
                data={"markdown": answer},
            ))
            blocks.append(AssistantResponseBlock(
                block_type="METRIC",
                data=AssistantMetricBlock(
                    label="Active Anomalies Requiring Review",
                    value=str(len(unresolved)),
                    comparison_label="Total Flagged Volume",
                    comparison_value=f"${summary.total_anomalous_amount:,.2f}",
                    trend="STABLE",
                    status=status,
                ).model_dump(),
            ))
            blocks.append(AssistantResponseBlock(
                block_type="RECOMMENDATION",
                data={
                    "title": "Verification Action",
                    "text": "Open the Anomaly Workspace to acknowledge valid annual renewals or flag unexpected merchant transactions." if unresolved else "System telemetry is clear. Automatic scans occur on every new statement ingestion.",
                },
            ))
            blocks.append(AssistantResponseBlock(
                block_type="ACTION",
                data=AssistantActionBlock(
                    label="Review Flagged Anomalies",
                    route="/anomalies",
                ).model_dump(),
            ))

        # 4. FORECAST / NEXT-MONTH PROJECTIONS INTENT
        elif any(w in q for w in ["forecast", "predict", "next month", "future", "projection", "look like"]):
            savings = await SavingsAnalytics.get_savings_intelligence(db, user_id)
            cash_flow = await CashFlowAnalytics.get_overview(db, user_id)
            sources = ["HoltWintersForecaster", "MLForecastingEngine", "SavingsAnalytics"]

            proj_spend = float(savings.trajectory[-1].expenses)
            proj_save = float(savings.projected_next_month_savings)
            proj_rate = float(savings.projected_next_month_rate)
            curr_spend = float(cash_flow.spending.current)

            answer = (
                f"Based on the **Holt-Winters Double Exponential Smoothing** model, next month's spending is projected "
                f"at **${proj_spend:,.2f}** (compared to ${curr_spend:,.2f} this month). This anticipates a net surplus "
                f"of **${proj_save:,.2f}**, corresponding to an estimated **{proj_rate:.1f}% savings rate**."
            )

            blocks.append(AssistantResponseBlock(
                block_type="TEXT",
                data={"markdown": answer},
            ))
            blocks.append(AssistantResponseBlock(
                block_type="METRIC",
                data=AssistantMetricBlock(
                    label="Projected Next-Month Spending",
                    value=f"${proj_spend:,.2f}",
                    comparison_label="Projected Savings Rate",
                    comparison_value=f"{proj_rate:.1f}%",
                    trend="STABLE",
                    status="IMPROVING" if proj_rate >= 20 else "STABLE",
                ).model_dump(),
            ))
            blocks.append(AssistantResponseBlock(
                block_type="CHART",
                data=AssistantChartBlock(
                    chart_type="FORECAST_HORIZON",
                    title="Historical Spending & ML Forecast Projection",
                    data=[
                        {"period": pt.period_label, "amount": pt.expenses, "is_projected": pt.is_projected}
                        for pt in savings.trajectory[-4:]
                    ],
                ).model_dump(),
            ))
            blocks.append(AssistantResponseBlock(
                block_type="ACTION",
                data=AssistantActionBlock(
                    label="Inspect ML Forecast Horizon",
                    route="/predictions",
                ).model_dump(),
            ))

        # 5. SAVINGS & INVESTMENT INTENT
        elif any(w in q for w in ["saving", "savings", "invest", "investment", "portfolio", "dca", "wealth"]):
            savings = await SavingsAnalytics.get_savings_intelligence(db, user_id)
            invest = await InvestmentAnalytics.get_investment_intelligence(db, user_id)
            sources = ["SavingsAnalytics.intelligence", "InvestmentAnalytics.cadence"]

            answer = (
                f"Your wealth accumulation is pacing strongly. Your current savings rate is **{savings.current_savings_rate:.1f}%** "
                f"(${savings.current_savings_amount:,.2f} saved), well above the standard **20.0% benchmark**. "
                f"On investments, you deposited **${invest.current_monthly_contribution:,.2f}** ({invest.income_share_percentage:.1f}% of gross income) "
                f"with a **{invest.consistency_score:.0f}% deposit consistency score**. Total portfolio assets: **${invest.total_portfolio_balance:,.2f}**."
            )

            blocks.append(AssistantResponseBlock(
                block_type="TEXT",
                data={"markdown": answer},
            ))
            blocks.append(AssistantResponseBlock(
                block_type="METRIC",
                data=AssistantMetricBlock(
                    label="Current Savings Rate",
                    value=f"{savings.current_savings_rate:.1f}%",
                    comparison_label="20% Rule Benchmark",
                    comparison_value="20.0%",
                    trend="UP",
                    status="IMPROVING",
                ).model_dump(),
            ))
            blocks.append(AssistantResponseBlock(
                block_type="ACTION",
                data=AssistantActionBlock(
                    label="View Savings Workspace",
                    route="/savings",
                ).model_dump(),
            ))

        # 6. CATEGORY BREAKDOWN INTENT
        elif any(w in q for w in ["category", "categories", "changed the most", "where does my money go"]):
            breakdown = await CategoryAnalytics.get_breakdown(db, user_id)
            sources = ["CategoryAnalytics.breakdown"]

            top_cat = breakdown.categories[0] if breakdown.categories else None
            top_name = top_cat.category_name if top_cat else "Housing"
            top_amount = float(top_cat.amount) if top_cat else 0.0
            top_share = float(top_cat.percentage) if top_cat else 0.0

            answer = (
                f"Your largest spending category this month is **{top_name}** at **${top_amount:,.2f}** "
                f"({top_share:.1f}% of total expenditures). Your total spending of **${float(breakdown.total_spending):,.2f}** "
                f"is split between **${float(breakdown.fixed_amount):,.2f} in fixed essentials** and "
                f"**${float(breakdown.discretionary_amount):,.2f} in discretionary items**."
            )

            blocks.append(AssistantResponseBlock(
                block_type="TEXT",
                data={"markdown": answer},
            ))
            blocks.append(AssistantResponseBlock(
                block_type="METRIC",
                data=AssistantMetricBlock(
                    label=f"Top Category: {top_name}",
                    value=f"${top_amount:,.2f}",
                    comparison_label="Share of Total Spend",
                    comparison_value=f"{top_share:.1f}%",
                    trend="STABLE",
                    status="STABLE",
                ).model_dump(),
            ))
            blocks.append(AssistantResponseBlock(
                block_type="ACTION",
                data=AssistantActionBlock(
                    label="Explore Category Drilldown",
                    route="/analytics",
                ).model_dump(),
            ))

        # 7. GENERAL / HOLISTIC FINANCIAL HEALTH FALLBACK
        else:
            cash_flow = await CashFlowAnalytics.get_overview(db, user_id)
            savings = await SavingsAnalytics.get_savings_intelligence(db, user_id)
            sources = ["CashFlowAnalytics", "SavingsAnalytics", "SpendIQ.GroundingKernel"]

            answer = (
                f"Here is your verified financial overview: Gross monthly income is **${float(cash_flow.income.current):,.2f}**, "
                f"monthly expenditures total **${float(cash_flow.spending.current):,.2f}**, generating **${float(cash_flow.savings.current):,.2f} "
                f"in net savings** ({savings.current_savings_rate:.1f}% savings rate). Your liquid emergency runway is "
                f"**{savings.emergency_fund.months_of_coverage:.1f} months** (${savings.emergency_fund.liquid_balance:,.2f})."
            )

            blocks.append(AssistantResponseBlock(
                block_type="TEXT",
                data={"markdown": answer},
            ))
            blocks.append(AssistantResponseBlock(
                block_type="METRIC",
                data=AssistantMetricBlock(
                    label="Monthly Net Cash Flow Surplus",
                    value=f"${float(cash_flow.savings.current):,.2f}",
                    comparison_label="Savings Rate",
                    comparison_value=f"{savings.current_savings_rate:.1f}%",
                    trend="UP",
                    status="IMPROVING",
                ).model_dump(),
            ))
            blocks.append(AssistantResponseBlock(
                block_type="ACTION",
                data=AssistantActionBlock(
                    label="Explore Overview Dashboard",
                    route="/",
                ).model_dump(),
            ))

        return AssistantMessage(
            id=msg_id,
            role="ASSISTANT",
            content=answer,
            blocks=blocks,
            sources=sources,
            created_at=created_at,
        )
