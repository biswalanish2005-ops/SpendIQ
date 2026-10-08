import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.insight import AIInsight
from app.models.transaction import Transaction
from app.analytics.cash_flow import CashFlowAnalytics
from app.analytics.savings import SavingsAnalytics
from app.analytics.investments import InvestmentAnalytics
from app.analytics.time_series import TimeSeriesAnalytics
from app.services.anomaly_service import AnomalyService
from app.schemas.insights import (
    InsightItem,
    InsightSummary,
)


class AIInsightsService:
    @staticmethod
    def _pack_explanation(
        summary: str,
        evidence: List[str],
        metric_value: str,
        status: str,
        impact: str,
        recommendation: Optional[str],
        navigation_link: str,
        action_label: str,
    ) -> str:
        """Serialize structured insight details into the model's explanation field."""
        payload = {
            "summary": summary,
            "evidence": evidence,
            "metric_value": metric_value,
            "status": status,
            "impact": impact,
            "recommendation": recommendation,
            "navigation_link": navigation_link,
            "action_label": action_label,
        }
        return json.dumps(payload)

    @staticmethod
    def _unpack_insight(model: AIInsight) -> InsightItem:
        """Convert a database AIInsight model into a rich InsightItem schema."""
        summary = model.explanation
        evidence: List[str] = []
        metric_value = model.metric_ref or ""
        status = "STABLE"
        impact = "NEUTRAL"
        recommendation: Optional[str] = None
        navigation_link = "/analytics"
        action_label = "View Analytics"

        try:
            data = json.loads(model.explanation)
            if isinstance(data, dict):
                summary = data.get("summary", model.explanation)
                evidence = data.get("evidence", [])
                metric_value = data.get("metric_value", model.metric_ref or "")
                status = data.get("status", "STABLE")
                impact = data.get("impact", "NEUTRAL")
                recommendation = data.get("recommendation")
                navigation_link = data.get("navigation_link", "/analytics")
                action_label = data.get("action_label", "View Analytics")
        except (json.JSONDecodeError, TypeError):
            # Gracefully handle legacy plain-text explanations from seed data
            summary = model.explanation
            if "spending" in model.category.lower():
                navigation_link = "/analytics"
                action_label = "View Spending Analytics"
                status = "CONCERNING"
                impact = "NEGATIVE"
                metric_value = "$3,750.00"
            elif "savings" in model.category.lower():
                navigation_link = "/savings"
                action_label = "View Savings Trajectory"
                status = "IMPROVING"
                impact = "POSITIVE"
                metric_value = "$1,850.00"
            elif "forecast" in model.category.lower():
                navigation_link = "/predictions"
                action_label = "Inspect ML Forecast"
                status = "IMPROVING"
                impact = "POSITIVE"
                metric_value = "$3,580.00"

        return InsightItem(
            id=model.id,
            category=model.category,
            headline=model.headline,
            summary=summary,
            evidence=evidence,
            metric_value=metric_value,
            status=status,
            impact=impact,
            action_state=model.status,
            recommendation=recommendation,
            navigation_link=navigation_link,
            action_label=action_label,
            confidence_score=model.confidence_score,
            created_at=model.created_at,
        )

    @classmethod
    async def generate_grounded_insights(
        cls,
        db: AsyncSession,
        user_id: str,
    ) -> List[InsightItem]:
        """
        Synthesizes live, verified analytical facts across cash flow,
        savings benchmark, emergency runway, investment cadence, ML forecasts,
        and statistical anomalies into grounded AI insight cards.
        """
        # Fetch verified analytical metrics from each dedicated subsystem
        cash_flow = await CashFlowAnalytics.get_overview(db, user_id)
        savings_data = await SavingsAnalytics.get_savings_intelligence(db, user_id)
        invest_data = await InvestmentAnalytics.get_investment_intelligence(db, user_id)
        trend_data = await TimeSeriesAnalytics.get_monthly_spending_trend(db, user_id, months_back=6)
        anomaly_service = AnomalyService()
        detected_anomalies = await anomaly_service.get_anomalies(db, user_id, status="DETECTED", limit=3)


        generated_specs: List[Dict[str, Any]] = []

        # 1. Spending Momentum & Baseline Insight
        current_spend = float(cash_flow.spending.current)
        baseline_spend = float(trend_data.historical_baseline)
        spend_change = float(cash_flow.spending.change_percent)
        spend_diff = current_spend - baseline_spend


        if spend_diff <= 0:
            spend_headline = "Monthly Spending Pacing Below Historical Baseline"
            spend_status = "IMPROVING"
            spend_impact = "POSITIVE"
            spend_summary = (
                f"Current month spending of ${current_spend:,.2f} is ${abs(spend_diff):,.2f} below your "
                f"6-month historical baseline of ${baseline_spend:,.2f}, indicating disciplined outflow control."
            )
            spend_rec = "Keep non-essential spending within current thresholds to maximize capital accumulation."
        else:
            spend_headline = "Monthly Outflows Exceed 6-Month Baseline"
            spend_status = "CONCERNING"
            spend_impact = "NEGATIVE"
            spend_summary = (
                f"Current month expenditures of ${current_spend:,.2f} are ${spend_diff:,.2f} (+{spend_change:.1f}% MoM) "
                f"above your historical monthly baseline of ${baseline_spend:,.2f}."
            )
            spend_rec = "Review recent discretionary transactions in Dining and Shopping to re-align with monthly targets."

        generated_specs.append({
            "category": "SPENDING",
            "headline": spend_headline,
            "summary": spend_summary,
            "evidence": [
                f"Current month spend: ${current_spend:,.2f}",
                f"6-month historical baseline: ${baseline_spend:,.2f} ({spend_diff:+,.2f} variance)",
                f"Month-over-Month change: {spend_change:+.1f}%",
            ],
            "metric_value": f"${current_spend:,.2f}",
            "status": spend_status,
            "impact": spend_impact,
            "recommendation": spend_rec,
            "navigation_link": "/analytics",
            "action_label": "View Spending Analytics",
            "confidence_score": 0.98,
        })

        # 2. Savings Trajectory & 20% Benchmark Rule
        current_savings_rate = savings_data.current_savings_rate
        current_savings_amt = savings_data.current_savings_amount
        benchmark_diff = current_savings_rate - 20.0

        if current_savings_rate >= 20.0:
            save_headline = f"Savings Rate ({current_savings_rate:.1f}%) Ahead of 20% Benchmark"
            save_status = "IMPROVING"
            save_impact = "POSITIVE"
            save_summary = (
                f"Your net monthly savings reached ${current_savings_amt:,.2f}, yielding a savings rate of "
                f"{current_savings_rate:.1f}%. This exceeds the recommended 20.0% financial benchmark by +{benchmark_diff:.1f}%."
            )
            save_rec = "Maintain this savings trajectory to accelerate your emergency reserve and wealth-building targets."
        else:
            save_headline = f"Savings Rate ({current_savings_rate:.1f}%) Below 20% Target"
            save_status = "CONCERNING"
            save_impact = "NEGATIVE"
            save_summary = (
                f"Current savings rate of {current_savings_rate:.1f}% (${current_savings_amt:,.2f}) trails the "
                f"standard 20.0% target by {abs(benchmark_diff):.1f}%."
            )
            save_rec = "Identify opportunities to trim variable subscriptions and divert surplus into savings."

        generated_specs.append({
            "category": "SAVINGS",
            "headline": save_headline,
            "summary": save_summary,
            "evidence": [
                f"Net monthly savings: ${current_savings_amt:,.2f}",
                f"Current savings rate: {current_savings_rate:.1f}% of gross income",
                f"20% Rule target benchmark: 20.0% ({benchmark_diff:+.1f}% variance)",
                f"6-month average savings rate: {savings_data.average_savings_rate_6m:.1f}%",
            ],
            "metric_value": f"{current_savings_rate:.1f}%",
            "status": save_status,
            "impact": save_impact,
            "recommendation": save_rec,
            "navigation_link": "/savings",
            "action_label": "View Savings Trajectory",
            "confidence_score": 0.99,
        })

        # 3. Emergency Fund Runway Buffer
        ef = savings_data.emergency_fund
        if ef.months_of_coverage >= 6.0:
            ef_headline = f"Emergency Reserve Buffer Fully Funded ({ef.months_of_coverage:.1f} Months)"
            ef_status = "IMPROVING"
            ef_impact = "POSITIVE"
            ef_summary = (
                f"Liquid cash holdings of ${ef.liquid_balance:,.2f} provide {ef.months_of_coverage:.1f} months "
                f"of runway at your average monthly burn rate of ${ef.monthly_burn_rate:,.2f}/mo, exceeding the 6-month safety threshold."
            )
            ef_rec = "With emergency reserves secure, consider channeling incremental surplus into dollar-cost averaging investments."
        elif ef.months_of_coverage >= 3.0:
            ef_headline = f"Emergency Fund Adequate ({ef.months_of_coverage:.1f} Months Coverage)"
            ef_status = "STABLE"
            ef_impact = "NEUTRAL"
            ef_summary = (
                f"Liquid reserves total ${ef.liquid_balance:,.2f}, covering {ef.months_of_coverage:.1f} months "
                f"of living expenses. You have reached {ef.funding_percentage:.1f}% of the 6-month recommended buffer."
            )
            ef_rec = "Continue regular deposits into high-yield savings until the 6-month ($" + f"{ef.target_reserve_amount:,.2f}) milestone is reached."
        else:
            ef_headline = f"Emergency Fund Needs Attention ({ef.months_of_coverage:.1f} Months)"
            ef_status = "ATTENTION_REQUIRED"
            ef_impact = "NEGATIVE"
            ef_summary = (
                f"Current cash cushion of ${ef.liquid_balance:,.2f} covers only {ef.months_of_coverage:.1f} months "
                f"of expenses, below the prudent minimum 3-month threshold."
            )
            ef_rec = "Prioritize building liquid cash reserves before committing to additional discretionary or illiquid assets."

        generated_specs.append({
            "category": "FINANCIAL_HEALTH",
            "headline": ef_headline,
            "summary": ef_summary,
            "evidence": [
                f"Total liquid reserves: ${ef.liquid_balance:,.2f}",
                f"Average monthly expense burn: ${ef.monthly_burn_rate:,.2f}/mo",
                f"Runway coverage: {ef.months_of_coverage:.1f} months (Goal: 6 months)",
                f"Target funding percentage: {ef.funding_percentage:.1f}%",
            ],
            "metric_value": f"{ef.months_of_coverage:.1f} Mo",
            "status": ef_status,
            "impact": ef_impact,
            "recommendation": ef_rec,
            "navigation_link": "/savings",
            "action_label": "Inspect Emergency Runway",
            "confidence_score": 0.98,
        })

        # 4. Investment Cadence & Regularity
        inv_contrib = invest_data.current_monthly_contribution
        inv_score = invest_data.consistency_score
        inv_share = invest_data.income_share_percentage
        inv_portfolio = invest_data.total_portfolio_balance

        generated_specs.append({
            "category": "INVESTMENTS",
            "headline": f"Regular Investment Cadence ({inv_score:.0f}% Consistency Score)",
            "summary": (
                f"Monthly portfolio contributions stand at ${inv_contrib:,.2f} ({inv_share:.1f}% of gross income) "
                f"with a {inv_score:.0f}% deposit regularity score across evaluated cycles. Total portfolio: ${inv_portfolio:,.2f}."
            ),
            "evidence": [
                f"Monthly investment deposit: ${inv_contrib:,.2f}",
                f"Income allocation share: {inv_share:.1f}% of payroll",
                f"Deposit consistency index: {inv_score:.0f}%",
                f"Tracked portfolio assets: ${inv_portfolio:,.2f}",
            ],
            "metric_value": f"${inv_contrib:,.2f}",
            "status": "IMPROVING" if inv_score >= 80 else "STABLE",
            "impact": "POSITIVE",
            "recommendation": "Maintain recurring monthly deposits into broad index funds to reinforce compound growth.",
            "navigation_link": "/investments",
            "action_label": "View Investment Cadence",
            "confidence_score": 0.96,
        })

        # 5. Statistical Anomaly & Outlier Signal
        if detected_anomalies:
            top_outlier = detected_anomalies[0]
            outlier_amt = float(top_outlier.amount)
            expected_val = float(top_outlier.expected_value)
            dev_factor = float(top_outlier.deviation_factor)

            generated_specs.append({
                "category": "ANOMALIES",
                "headline": f"Unusual Outlier Flagged: {top_outlier.merchant_name} (${outlier_amt:,.2f})",
                "summary": (
                    f"A transaction of ${outlier_amt:,.2f} with {top_outlier.merchant_name} was detected at "
                    f"{dev_factor:.1f}x the historical median (${expected_val:,.2f}) in {top_outlier.category_name}."
                ),
                "evidence": [
                    f"Merchant: {top_outlier.merchant_name} ({top_outlier.category_name})",
                    f"Transaction amount: ${outlier_amt:,.2f} vs expected ${expected_val:,.2f}",
                    f"Deviation factor: {dev_factor:.1f}x category norm",
                    f"Anomaly score: {top_outlier.anomaly_score:.2f} ({top_outlier.severity} severity)",
                ],
                "metric_value": f"${outlier_amt:,.2f}",
                "status": "ATTENTION_REQUIRED" if top_outlier.severity == "HIGH" else "CONCERNING",
                "impact": "NEGATIVE",
                "recommendation": "Review the flagged transaction to verify legitimate business renewals or dispute unauthorized charges.",
                "navigation_link": "/anomalies",
                "action_label": "Review Flagged Anomalies",
                "confidence_score": 0.93,
            })
        else:
            generated_specs.append({
                "category": "ANOMALIES",
                "headline": "Zero Spending Anomalies Detected",
                "summary": "All recent transaction amounts remain within standard statistical deviation thresholds across all categories.",
                "evidence": [
                    "0 unacknowledged anomaly flags",
                    "All transactions within 3.0x category median limits",
                ],
                "metric_value": "$0.00",
                "status": "STABLE",
                "impact": "POSITIVE",
                "recommendation": "Transaction telemetry is stable; no merchant disputes or outlier investigations needed.",
                "navigation_link": "/anomalies",
                "action_label": "Open Anomaly Monitor",
                "confidence_score": 0.99,
            })

        # 6. Forward-Looking ML Spending Forecast
        proj_savings = savings_data.projected_next_month_savings
        proj_rate = savings_data.projected_next_month_rate
        proj_spend = float(savings_data.trajectory[-1].expenses)

        generated_specs.append({
            "category": "FORECAST",
            "headline": f"Next Month Spending Forecast: ${proj_spend:,.2f}",
            "summary": (
                f"The Double Exponential Smoothing model projects next month's spending at ${proj_spend:,.2f}, "
                f"enabling an estimated ${proj_savings:,.2f} in net savings ({proj_rate:.1f}% savings rate)."
            ),
            "evidence": [
                f"Projected total spend: ${proj_spend:,.2f}",
                f"Projected net savings: ${proj_savings:,.2f}",
                f"Projected savings rate: {proj_rate:.1f}%",
                "Model: Holt-Winters with additive trend and historical burn smoothing",
            ],
            "metric_value": f"${proj_spend:,.2f}",
            "status": "IMPROVING" if proj_rate >= 20.0 else "STABLE",
            "impact": "POSITIVE" if proj_rate >= 20.0 else "NEUTRAL",
            "recommendation": "Schedule upcoming non-recurring payments to coincide with projected surplus liquidity windows.",
            "navigation_link": "/predictions",
            "action_label": "Inspect ML Forecast Horizon",
            "confidence_score": 0.90,
        })

        # Synchronize generated specifications into database for durable user action states
        # First, query existing insights for user
        q_existing = select(AIInsight).where(AIInsight.user_id == user_id)
        res_existing = await db.execute(q_existing)
        existing_insights = {ins.category: ins for ins in res_existing.scalars().all()}

        synced_items: List[InsightItem] = []

        for spec in generated_specs:
            cat = spec["category"]
            packed_exp = cls._pack_explanation(
                summary=spec["summary"],
                evidence=spec["evidence"],
                metric_value=spec["metric_value"],
                status=spec["status"],
                impact=spec["impact"],
                recommendation=spec["recommendation"],
                navigation_link=spec["navigation_link"],
                action_label=spec["action_label"],
            )

            if cat in existing_insights:
                # Update existing record while preserving user's action state (ACTIVE, DISMISSED, ACTED_UPON)
                ins = existing_insights[cat]
                ins.headline = spec["headline"]
                ins.explanation = packed_exp
                ins.metric_ref = spec["metric_value"]
                ins.confidence_score = spec["confidence_score"]
                synced_items.append(cls._unpack_insight(ins))
            else:
                # Create new insight
                new_id = str(uuid.uuid4())
                ins = AIInsight(
                    id=new_id,
                    user_id=user_id,
                    category=cat,
                    headline=spec["headline"],
                    explanation=packed_exp,
                    metric_ref=spec["metric_value"],
                    confidence_score=spec["confidence_score"],
                    status="ACTIVE",
                    created_at=datetime.now(timezone.utc),
                )
                db.add(ins)
                synced_items.append(cls._unpack_insight(ins))

        await db.commit()
        return synced_items

    @classmethod
    async def get_insights(
        cls,
        db: AsyncSession,
        user_id: str,
        category: Optional[str] = None,
        status: Optional[str] = None,
        action_state: Optional[str] = None,
    ) -> List[InsightItem]:
        """Query insights with filtering by category, status, and action state."""
        q = select(AIInsight).where(AIInsight.user_id == user_id)

        if category and category.upper() != "ALL":
            q = q.where(AIInsight.category == category.upper())

        if action_state and action_state.upper() != "ALL":
            q = q.where(AIInsight.status == action_state.upper())

        q = q.order_by(AIInsight.created_at.desc())
        res = await db.execute(q)
        models = res.scalars().all()

        # If no insights exist yet, generate them on the fly
        if not models:
            unpacked = await cls.generate_grounded_insights(db, user_id)
            # Re-filter if necessary
            if category and category.upper() != "ALL":
                unpacked = [u for u in unpacked if u.category == category.upper()]
            if action_state and action_state.upper() != "ALL":
                unpacked = [u for u in unpacked if u.action_state == action_state.upper()]
            if status and status.upper() != "ALL":
                unpacked = [u for u in unpacked if u.status == status.upper()]
            return unpacked

        items = [cls._unpack_insight(m) for m in models]

        if status and status.upper() != "ALL":
            items = [item for item in items if item.status == status.upper()]

        return items

    @classmethod
    async def update_insight_status(
        cls,
        db: AsyncSession,
        user_id: str,
        insight_id: str,
        new_status: str,
    ) -> Optional[InsightItem]:
        """Update an insight's user action state ('ACTIVE', 'DISMISSED', 'ACTED_UPON')."""
        q = select(AIInsight).where(
            AIInsight.id == insight_id,
            AIInsight.user_id == user_id,
        )
        res = await db.execute(q)
        model = res.scalar_one_or_none()

        if not model:
            return None

        model.status = new_status.upper()
        await db.commit()
        await db.refresh(model)

        return cls._unpack_insight(model)

    @classmethod
    async def get_insight_summary(
        cls,
        db: AsyncSession,
        user_id: str,
    ) -> InsightSummary:
        """Compute aggregate counts and intelligence confidence metrics."""
        # Ensure insights are generated if empty
        q = select(AIInsight).where(AIInsight.user_id == user_id)
        res = await db.execute(q)
        models = res.scalars().all()

        if not models:
            items = await cls.generate_grounded_insights(db, user_id)
        else:
            items = [cls._unpack_insight(m) for m in models]

        total = len(items)
        active_count = sum(1 for i in items if i.action_state == "ACTIVE")
        acted_upon_count = sum(1 for i in items if i.action_state == "ACTED_UPON")
        improving_count = sum(1 for i in items if i.status == "IMPROVING" and i.action_state == "ACTIVE")
        concerning_count = sum(1 for i in items if i.status == "CONCERNING" and i.action_state == "ACTIVE")
        attention_count = sum(1 for i in items if i.status == "ATTENTION_REQUIRED" and i.action_state == "ACTIVE")
        avg_conf = (
            round((sum(i.confidence_score for i in items) / total) * 100.0, 1)
            if total > 0
            else 95.0
        )

        return InsightSummary(
            total_insights=total,
            active_count=active_count,
            acted_upon_count=acted_upon_count,
            improving_count=improving_count,
            concerning_count=concerning_count,
            attention_count=attention_count,
            average_confidence=avg_conf,
        )
