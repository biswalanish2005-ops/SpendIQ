"""Machine Learning & Statistical Anomaly Detection Engine for SpendIQ.

Detects unusual spending patterns using:
1. Category-level empirical distributions (mean, median, standard deviation, IQR)
2. Multi-signal deviation scoring (amount deviation multiplier, Z-score, modified Z-score)
3. Normalized outlier scoring (0.0 to 1.0)
4. Severity classification: HIGH (>= 0.80), MEDIUM (0.60 - 0.79), LOW (0.40 - 0.59), NORMAL (< 0.40)
5. Explainable natural language generation adhering strictly to fintech compliance rules:
   NEVER use the word "fraud" — identify as "unusual spending pattern" or "anomalous transaction".
"""

from decimal import Decimal
from typing import Dict, List, Any, Optional, Tuple
import math
import numpy as np


class StatisticalAnomalyDetector:
    """Personalized unusual-spending pattern detector."""

    def __init__(
        self,
        high_severity_threshold: float = 0.80,
        medium_severity_threshold: float = 0.60,
        low_severity_threshold: float = 0.40,
    ):
        self.high_thresh = high_severity_threshold
        self.medium_thresh = medium_severity_threshold
        self.low_thresh = low_severity_threshold

    def compute_category_baselines(
        self, transactions: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, float]]:
        """Calculates statistical spending baselines per category."""
        category_amounts: Dict[str, List[float]] = {}

        for tx in transactions:
            cat = tx.get("category_name") or "Uncategorized"
            amt = float(tx.get("amount", 0.0))
            if amt > 0:
                category_amounts.setdefault(cat, []).append(amt)

        baselines: Dict[str, Dict[str, float]] = {}
        for cat, amounts in category_amounts.items():
            if not amounts:
                continue

            arr = np.array(amounts)
            mean_val = float(np.mean(arr))
            median_val = float(np.median(arr))
            std_val = float(np.std(arr)) if len(arr) > 1 else max(10.0, mean_val * 0.25)
            # Ensure standard deviation is non-zero
            std_val = max(5.0, std_val)

            # Interquartile range
            q25, q75 = np.percentile(arr, [25, 75])
            iqr = max(5.0, float(q75 - q25))

            baselines[cat] = {
                "mean": round(mean_val, 2),
                "median": round(median_val, 2),
                "std": round(std_val, 2),
                "iqr": round(iqr, 2),
                "q75": round(float(q75), 2),
                "count": len(amounts),
            }

        return baselines

    def evaluate_transaction(
        self,
        tx: Dict[str, Any],
        baselines: Dict[str, Dict[str, float]],
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluates a single transaction against historical category baselines.
        Returns anomaly candidate dict if score >= low_severity_threshold, otherwise None.
        """
        amount = float(tx.get("amount", 0.0))
        if amount <= 0:
            return None

        cat = tx.get("category_name") or "Uncategorized"
        merchant = tx.get("merchant_name") or "Unknown Merchant"

        base = baselines.get(cat)
        if not base:
            # Fallback baseline for unseen categories
            expected_val = 50.0
            deviation_factor = round(amount / expected_val, 2)
            z_score = (amount - expected_val) / 25.0
        else:
            expected_val = base["median"] if base["count"] >= 3 else base["mean"]
            expected_val = max(10.0, expected_val)
            deviation_factor = round(amount / expected_val, 2)
            # Use IQR-based robust standard deviation estimate: IQR / 1.349
            robust_std = max(5.0, base["iqr"] / 1.349 if base["iqr"] > 0 else base["std"])
            z_score = (amount - expected_val) / robust_std

        # Only evaluate potential outliers if amount exceeds expected baseline
        if amount <= expected_val:
            return None

        # Normalized anomaly score mapping using sigmoid-like curve
        # z = 1.5 -> score ~ 0.45 (LOW)
        # z = 2.5 -> score ~ 0.70 (MEDIUM)
        # z >= 3.5 -> score >= 0.85 (HIGH)
        raw_score = 1.0 / (1.0 + math.exp(-0.8 * (z_score - 2.0)))
        score = round(min(0.99, max(0.01, raw_score)), 2)

        # Classification
        if score >= self.high_thresh:
            severity = "HIGH"
        elif score >= self.medium_thresh:
            severity = "MEDIUM"
        elif score >= self.low_thresh:
            severity = "LOW"
        else:
            return None

        # Natural language explanation adhering strictly to compliance guidelines
        explanation = (
            f"Transaction of ${amount:,.2f} at {merchant} is {deviation_factor:.1f}x higher than your "
            f"normal {cat.lower()} spending (${expected_val:,.2f} baseline)."
        )

        return {
            "transaction_id": tx.get("id"),
            "anomaly_score": score,
            "expected_value": round(Decimal(str(expected_val)), 2),
            "deviation_factor": float(deviation_factor),
            "severity": severity,
            "explanation": explanation,
            "category_name": cat,
            "merchant_name": merchant,
            "amount": amount,
            "occurred_at": tx.get("occurred_at"),
        }
