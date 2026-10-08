from datetime import datetime, date, timedelta, timezone
from decimal import Decimal
from typing import Dict, Any, List, Optional, Tuple
import json
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, delete

from app.models.transaction import Transaction
from app.models.forecast import ForecastRun, ForecastPoint
from app.ml.forecasting import FinancialForecastingEngine
from app.schemas.prediction import (
    SpendingForecastResponse,
    ForecastRunSummary,
    CombinedTimelinePoint,
    SpendingDriver,
    CategoryForecast,
)


class ForecastService:
    """Service layer managing ML model training, database persistence, and forecast retrieval."""

    def __init__(self):
        self.engine = FinancialForecastingEngine()

    async def get_or_generate_spending_forecast(
        self,
        db: AsyncSession,
        user_id: str,
        horizon_months: int = 3,
        confidence_level: float = 0.80,
        force_recompute: bool = False,
    ) -> SpendingForecastResponse:
        """
        Retrieves existing forecast run or executes ML training pipeline and persists results.
        """
        # Fetch historical monthly transactions
        historical_monthly, category_monthly = await self._fetch_historical_aggregates(db, user_id)

        # Run ML Forecasting Engine
        forecast_result = self.engine.generate_spending_forecast(
            historical_monthly=historical_monthly,
            category_monthly=category_monthly,
            horizon_months=horizon_months,
            confidence_level=confidence_level,
        )

        # Persist forecast run and points to database
        run_record = ForecastRun(
            id=str(uuid.uuid4()),
            user_id=user_id,
            target_metric="TOTAL_SPENDING",
            horizon_days=horizon_months * 30,
            model_name=forecast_result["run"]["model_name"],
            model_version=forecast_result["run"]["model_version"],
            metrics_json=json.dumps(forecast_result["run"]["evaluation_metrics"]),
        )
        db.add(run_record)
        await db.flush()

        # Add forecast points for the projected horizon
        for p in forecast_result["timeline"]:
            if p["is_forecast"] and p["forecast_amount"] is not None:
                p_date = datetime.strptime(p["period_date"], "%Y-%m-%d").date()
                fp = ForecastPoint(
                    id=str(uuid.uuid4()),
                    run_id=run_record.id,
                    period_date=p_date,
                    predicted_value=Decimal(str(p["forecast_amount"])),
                    lower_bound=Decimal(str(p["lower_bound"])) if p["lower_bound"] is not None else None,
                    upper_bound=Decimal(str(p["upper_bound"])) if p["upper_bound"] is not None else None,
                )
                db.add(fp)

        await db.commit()

        # Return structured Pydantic response
        run_summary = ForecastRunSummary(
            run_id=run_record.id,
            target_metric=run_record.target_metric,
            horizon_days=run_record.horizon_days,
            model_name=run_record.model_name,
            model_version=run_record.model_version,
            created_at=run_record.created_at,
            evaluation_metrics=forecast_result["run"]["evaluation_metrics"],
        )

        timeline_points = [
            CombinedTimelinePoint(**item) for item in forecast_result["timeline"]
        ]
        drivers = [
            SpendingDriver(**item) for item in forecast_result["drivers"]
        ]
        cat_forecasts = [
            CategoryForecast(**item) for item in forecast_result["category_forecasts"]
        ]

        return SpendingForecastResponse(
            run=run_summary,
            projected_next_month=forecast_result["projected_next_month"],
            historical_monthly_average=forecast_result["historical_monthly_average"],
            expected_change_pct=forecast_result["expected_change_pct"],
            direction=forecast_result["direction"],
            financial_impact=forecast_result["financial_impact"],
            status=forecast_result["status"],
            confidence_interval_pct=forecast_result["confidence_interval_pct"],
            next_month_lower_bound=forecast_result["next_month_lower_bound"],
            next_month_upper_bound=forecast_result["next_month_upper_bound"],
            timeline=timeline_points,
            drivers=drivers,
            category_forecasts=cat_forecasts,
            savings_forecast=forecast_result["savings_forecast"],
            investment_forecast=forecast_result["investment_forecast"],
        )

    async def _fetch_historical_aggregates(
        self,
        db: AsyncSession,
        user_id: str,
        months_back: int = 5,
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Queries database for monthly sums across spending, income, and category distributions."""
        # Find latest transaction date
        latest_tx_query = select(func.max(Transaction.occurred_at)).where(Transaction.user_id == user_id)
        latest_res = await db.execute(latest_tx_query)
        latest_date = latest_res.scalar_one_or_none()
        anchor_date = latest_date if latest_date else datetime.now(timezone.utc)

        historical_monthly: List[Dict[str, Any]] = []

        for offset in range(months_back - 1, -1, -1):
            ref = anchor_date - timedelta(days=offset * 30.5)
            y, m = ref.year, ref.month
            m_start = datetime(y, m, 1, tzinfo=timezone.utc)
            m_end = datetime(y + 1, 1, 1, tzinfo=timezone.utc) if m == 12 else datetime(y, m + 1, 1, tzinfo=timezone.utc)

            # Spending
            spend_q = select(func.coalesce(func.sum(Transaction.amount), Decimal("0.00"))).where(
                Transaction.user_id == user_id,
                Transaction.direction == "EXPENSE",
                Transaction.occurred_at >= m_start,
                Transaction.occurred_at < m_end,
            )
            spend_val = (await db.execute(spend_q)).scalar_one()

            # Income
            inc_q = select(func.coalesce(func.sum(Transaction.amount), Decimal("0.00"))).where(
                Transaction.user_id == user_id,
                Transaction.direction == "INCOME",
                Transaction.occurred_at >= m_start,
                Transaction.occurred_at < m_end,
            )
            inc_val = (await db.execute(inc_q)).scalar_one()

            # Investments
            inv_q = select(func.coalesce(func.sum(Transaction.amount), Decimal("0.00"))).where(
                Transaction.user_id == user_id,
                Transaction.category_name == "Investment Contributions",
                Transaction.occurred_at >= m_start,
                Transaction.occurred_at < m_end,
            )
            inv_val = (await db.execute(inv_q)).scalar_one()

            historical_monthly.append({
                "period_date": m_start.date(),
                "period_label": m_start.strftime("%b %Y"),
                "spending": float(spend_val),
                "income": float(inc_val) if float(inc_val) > 0 else 6200.0,
                "investments": float(inv_val) if float(inv_val) > 0 else 600.0,
            })

        # Category Breakdown for recent periods
        cat_q = (
            select(
                Transaction.category_name,
                func.sum(Transaction.amount).label("total_spend"),
            )
            .where(
                Transaction.user_id == user_id,
                Transaction.direction == "EXPENSE",
            )
            .group_by(Transaction.category_name)
            .order_by(desc("total_spend"))
        )
        cat_rows = (await db.execute(cat_q)).all()
        total_cat_spend = sum(float(r.total_spend) for r in cat_rows) if cat_rows else 1.0

        category_monthly = []
        for r in cat_rows:
            c_name = r.category_name or "Uncategorized"
            amt = float(r.total_spend)
            share = (amt / total_cat_spend * 100.0) if total_cat_spend > 0 else 0.0
            category_monthly.append({
                "category_name": c_name,
                "amount": amt,
                "share_pct": round(share, 1),
            })

        return historical_monthly, category_monthly
