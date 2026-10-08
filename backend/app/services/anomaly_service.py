from datetime import datetime, date, timedelta, timezone
from decimal import Decimal
from typing import Dict, Any, List, Optional, Tuple
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_, update
from sqlalchemy.orm import selectinload

from app.models.transaction import Transaction
from app.models.anomaly import Anomaly
from app.ml.anomaly_detection import StatisticalAnomalyDetector
from app.schemas.anomaly import (
    AnomalyItemResponse,
    AnomalySummaryResponse,
    AnomalyTimelinePoint,
    AnomalyScanResponse,
)


class AnomalyService:
    """Service layer coordinating anomaly detection, database persistence, and queries."""

    def __init__(self):
        self.detector = StatisticalAnomalyDetector()

    async def scan_and_detect_anomalies(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> AnomalyScanResponse:
        """Runs the statistical detection engine across all user expense transactions."""
        # 1. Fetch all expense transactions for the user
        tx_query = (
            select(Transaction)
            .where(
                Transaction.user_id == user_id,
                Transaction.direction == "EXPENSE",
            )
            .order_by(Transaction.occurred_at.asc())
        )
        tx_result = await db.execute(tx_query)
        transactions = tx_result.scalars().all()

        if not transactions:
            return AnomalyScanResponse(
                scanned_transactions=0,
                anomalies_detected=0,
                new_anomalies_created=0,
                message="No expense transactions available to evaluate.",
            )

        tx_dicts = [
            {
                "id": t.id,
                "amount": float(t.amount),
                "category_name": t.category_name,
                "merchant_name": t.merchant_name,
                "occurred_at": t.occurred_at,
            }
            for t in transactions
        ]

        # 2. Compute category baselines
        baselines = self.detector.compute_category_baselines(tx_dicts)

        # 3. Query existing anomaly transaction IDs to avoid duplicate inserts
        existing_q = select(Anomaly.transaction_id).where(Anomaly.user_id == user_id)
        existing_res = await db.execute(existing_q)
        existing_tx_ids = set(existing_res.scalars().all())

        new_count = 0
        detected_count = 0

        for t_dict in tx_dicts:
            candidate = self.detector.evaluate_transaction(t_dict, baselines)
            if candidate:
                detected_count += 1
                tx_id = candidate["transaction_id"]
                if tx_id not in existing_tx_ids:
                    anomaly_record = Anomaly(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        transaction_id=tx_id,
                        anomaly_score=candidate["anomaly_score"],
                        expected_value=candidate["expected_value"],
                        deviation_factor=candidate["deviation_factor"],
                        explanation=candidate["explanation"],
                        status="DETECTED",
                        detected_at=datetime.now(timezone.utc),
                    )
                    db.add(anomaly_record)
                    existing_tx_ids.add(tx_id)
                    new_count += 1

        await db.commit()

        return AnomalyScanResponse(
            scanned_transactions=len(transactions),
            anomalies_detected=detected_count,
            new_anomalies_created=new_count,
            message=f"Scan completed. Analyzed {len(transactions)} transactions; flagged {detected_count} unusual patterns ({new_count} new).",
        )

    async def get_anomalies(
        self,
        db: AsyncSession,
        user_id: str,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[AnomalyItemResponse]:
        """Retrieves list of detected anomalies with transaction details."""
        query = (
            select(Anomaly, Transaction)
            .join(Transaction, Anomaly.transaction_id == Transaction.id)
            .where(Anomaly.user_id == user_id)
        )

        if severity:
            sev_upper = severity.upper()
            if sev_upper == "HIGH":
                query = query.where(Anomaly.anomaly_score >= 0.80)
            elif sev_upper == "MEDIUM":
                query = query.where(and_(Anomaly.anomaly_score >= 0.60, Anomaly.anomaly_score < 0.80))
            elif sev_upper == "LOW":
                query = query.where(Anomaly.anomaly_score < 0.60)

        if status:
            query = query.where(Anomaly.status == status.upper())

        query = query.order_by(desc(Transaction.occurred_at)).offset(offset).limit(limit)
        result = await db.execute(query)
        rows = result.all()

        items: List[AnomalyItemResponse] = []
        for anomaly, tx in rows:
            # Map score to severity label
            score = anomaly.anomaly_score
            if score >= 0.80:
                sev = "HIGH"
            elif score >= 0.60:
                sev = "MEDIUM"
            else:
                sev = "LOW"

            items.append(
                AnomalyItemResponse(
                    id=anomaly.id,
                    transaction_id=anomaly.transaction_id,
                    amount=float(tx.amount),
                    currency=tx.currency,
                    merchant_name=tx.merchant_name,
                    category_name=tx.category_name,
                    occurred_at=tx.occurred_at,
                    anomaly_score=anomaly.anomaly_score,
                    expected_value=float(anomaly.expected_value),
                    deviation_factor=anomaly.deviation_factor,
                    severity=sev,
                    explanation=anomaly.explanation,
                    status=anomaly.status,
                    detected_at=anomaly.detected_at,
                )
            )

        return items

    async def get_anomaly_summary(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> AnomalySummaryResponse:
        """Aggregates anomaly metrics, severity distribution, and resolution stats."""
        query = (
            select(Anomaly, Transaction)
            .join(Transaction, Anomaly.transaction_id == Transaction.id)
            .where(Anomaly.user_id == user_id)
        )
        result = await db.execute(query)
        rows = result.all()

        total = len(rows)
        high = 0
        med = 0
        low = 0
        resolved = 0
        anomalous_spend = 0.0

        for anomaly, tx in rows:
            score = anomaly.anomaly_score
            if score >= 0.80:
                high += 1
            elif score >= 0.60:
                med += 1
            else:
                low += 1

            if anomaly.status in ["ACKNOWLEDGED", "DISMISSED"]:
                resolved += 1

            anomalous_spend += float(tx.amount)

        resolution_rate = round((resolved / total * 100.0), 1) if total > 0 else 100.0

        return AnomalySummaryResponse(
            total_anomalies=total,
            high_severity_count=high,
            medium_severity_count=med,
            low_severity_count=low,
            resolved_count=resolved,
            total_anomalous_amount=round(anomalous_spend, 2),
            resolution_rate=resolution_rate,
        )

    async def get_anomaly_timeline(
        self,
        db: AsyncSession,
        user_id: str,
        days: int = 90,
    ) -> List[AnomalyTimelinePoint]:
        """Builds daily timeline comparing normal expenditures vs. unusual transaction spikes."""
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=days)

        # 1. Fetch all expenses in date range
        tx_query = (
            select(Transaction)
            .where(
                Transaction.user_id == user_id,
                Transaction.direction == "EXPENSE",
                Transaction.occurred_at >= start_date,
            )
            .order_by(Transaction.occurred_at.asc())
        )
        tx_rows = (await db.execute(tx_query)).scalars().all()

        # 2. Fetch all anomaly transaction IDs
        anom_query = select(Anomaly.transaction_id).where(Anomaly.user_id == user_id)
        anom_tx_ids = set((await db.execute(anom_query)).scalars().all())

        # Group by day
        daily_map: Dict[str, Dict[str, Any]] = {}

        for tx in tx_rows:
            d_str = tx.occurred_at.strftime("%Y-%m-%d")
            if d_str not in daily_map:
                daily_map[d_str] = {
                    "normal": 0.0,
                    "anomalous": 0.0,
                    "count": 0,
                }

            amt = float(tx.amount)
            if tx.id in anom_tx_ids:
                daily_map[d_str]["anomalous"] += amt
                daily_map[d_str]["count"] += 1
            else:
                daily_map[d_str]["normal"] += amt

        # Sort chronologically
        timeline: List[AnomalyTimelinePoint] = []
        for d_key in sorted(daily_map.keys()):
            val = daily_map[d_key]
            timeline.append(
                AnomalyTimelinePoint(
                    date=d_key,
                    normal_spend=round(val["normal"], 2),
                    anomalous_spend=round(val["anomalous"], 2),
                    anomaly_count=val["count"],
                )
            )

        return timeline

    async def update_anomaly_status(
        self,
        db: AsyncSession,
        user_id: str,
        anomaly_id: str,
        new_status: str,
    ) -> Optional[AnomalyItemResponse]:
        """Updates anomaly review status (e.g. ACKNOWLEDGED, DISMISSED)."""
        query = (
            select(Anomaly, Transaction)
            .join(Transaction, Anomaly.transaction_id == Transaction.id)
            .where(Anomaly.id == anomaly_id, Anomaly.user_id == user_id)
        )
        result = await db.execute(query)
        row = result.first()
        if not row:
            return None

        anomaly, tx = row
        anomaly.status = new_status
        await db.commit()
        await db.refresh(anomaly)

        score = anomaly.anomaly_score
        sev = "HIGH" if score >= 0.80 else ("MEDIUM" if score >= 0.60 else "LOW")

        return AnomalyItemResponse(
            id=anomaly.id,
            transaction_id=anomaly.transaction_id,
            amount=float(tx.amount),
            currency=tx.currency,
            merchant_name=tx.merchant_name,
            category_name=tx.category_name,
            occurred_at=tx.occurred_at,
            anomaly_score=anomaly.anomaly_score,
            expected_value=float(anomaly.expected_value),
            deviation_factor=anomaly.deviation_factor,
            severity=sev,
            explanation=anomaly.explanation,
            status=anomaly.status,
            detected_at=anomaly.detected_at,
        )
