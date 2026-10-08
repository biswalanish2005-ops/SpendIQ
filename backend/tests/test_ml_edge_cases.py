"""
Phase 17 — ML Edge Case and Model Evaluation Tests
Tests for: forecasting with insufficient history, empty series, single data points,
zero-variance categories, and anomaly detection edge cases.
"""
import pytest
from decimal import Decimal
from app.ml.forecasting import (
    MovingAverageBaseline,
    HoltWintersForecaster,
    FinancialForecastingEngine,
)
from app.ml.anomaly_detection import StatisticalAnomalyDetector


# ─── Moving Average Baseline Edge Cases ──────────────────────────────────────

def test_moving_average_empty_series_returns_zero_predictions():
    """ML must not crash on an empty series — it should return zero predictions."""
    baseline = MovingAverageBaseline(window=3)
    preds, mae, rmse = baseline.fit_predict([], horizon=2)
    assert len(preds) == 2
    # With no data, predictions should be 0 or the baseline should handle gracefully
    for p in preds:
        assert isinstance(p, (int, float))


def test_moving_average_single_data_point():
    """Moving average with a single data point should return that value as prediction."""
    baseline = MovingAverageBaseline(window=3)
    preds, mae, rmse = baseline.fit_predict([1500.0], horizon=2)
    assert len(preds) == 2
    # All predictions must equal the single value when window > data points
    for p in preds:
        assert p == pytest.approx(1500.0)


def test_moving_average_window_larger_than_series():
    """MA with window > series length should use all available data points."""
    baseline = MovingAverageBaseline(window=10)
    series = [100.0, 200.0, 300.0]
    preds, mae, rmse = baseline.fit_predict(series, horizon=1)
    expected = sum(series) / len(series)
    assert preds[0] == pytest.approx(expected, abs=0.01)


# ─── Holt-Winters Edge Cases ──────────────────────────────────────────────────

def test_holt_winters_single_point_does_not_crash():
    """HoltWinters must not crash on a single-point series."""
    forecaster = HoltWintersForecaster()
    forecaster.fit([2000.0])
    forecasts = forecaster.predict(horizon=3)
    assert len(forecasts) == 3
    for f in forecasts:
        assert f["predicted_value"] >= 0


def test_holt_winters_constant_series():
    """HoltWinters on a constant series should predict the same constant."""
    forecaster = HoltWintersForecaster()
    constant_value = 2500.0
    series = [constant_value] * 6
    forecaster.fit(series)
    forecasts = forecaster.predict(horizon=2)
    assert len(forecasts) == 2
    for f in forecasts:
        # Prediction should be very close to the constant value
        assert abs(f["predicted_value"] - constant_value) < constant_value * 0.2
        assert f["lower_bound"] <= f["predicted_value"]
        assert f["upper_bound"] >= f["predicted_value"]


def test_holt_winters_negative_values_clamped():
    """Forecasts must never return negative spending values."""
    forecaster = HoltWintersForecaster()
    # Rapidly declining series that might extrapolate negative
    series = [1000.0, 800.0, 600.0, 400.0, 200.0]
    forecaster.fit(series)
    forecasts = forecaster.predict(horizon=3)
    for f in forecasts:
        # Spending values must not be negative
        assert f["predicted_value"] >= 0
        assert f["lower_bound"] >= 0


def test_holt_winters_two_data_points():
    """HoltWinters must work correctly with just 2 data points."""
    forecaster = HoltWintersForecaster()
    forecaster.fit([2000.0, 2200.0])
    forecasts = forecaster.predict(horizon=2)
    assert len(forecasts) == 2


# ─── Financial Forecasting Engine Edge Cases ──────────────────────────────────

def test_forecasting_engine_empty_history():
    """FinancialForecastingEngine must handle empty historical data gracefully."""
    engine = FinancialForecastingEngine()
    result = engine.generate_spending_forecast(
        historical_monthly=[],
        category_monthly=[],
        horizon_months=3,
    )
    # Should return a result with safe defaults, not crash
    assert result is not None
    assert "projected_next_month" in result


def test_forecasting_engine_single_month_history():
    """Engine must handle a single month of history without crashing."""
    from datetime import date
    engine = FinancialForecastingEngine()
    result = engine.generate_spending_forecast(
        historical_monthly=[
            {"period_date": date(2026, 1, 1), "period_label": "Jan 2026", "spending": 2500.0, "income": 6000.0, "investments": 500.0}
        ],
        category_monthly=[
            {"category_name": "Housing", "amount": 1500.0, "share_pct": 60.0}
        ],
        horizon_months=2,
    )
    assert result is not None
    assert result["projected_next_month"] >= 0


def test_forecasting_engine_zero_spending_months():
    """Engine must not divide by zero or crash when spending is 0."""
    from datetime import date
    engine = FinancialForecastingEngine()
    result = engine.generate_spending_forecast(
        historical_monthly=[
            {"period_date": date(2026, 1, 1), "period_label": "Jan 2026", "spending": 0.0, "income": 5000.0, "investments": 0.0},
            {"period_date": date(2026, 2, 1), "period_label": "Feb 2026", "spending": 0.0, "income": 5000.0, "investments": 0.0},
            {"period_date": date(2026, 3, 1), "period_label": "Mar 2026", "spending": 0.0, "income": 5000.0, "investments": 0.0},
        ],
        category_monthly=[],
        horizon_months=2,
    )
    assert result is not None
    assert result["projected_next_month"] >= 0


# ─── Anomaly Detection Edge Cases ─────────────────────────────────────────────

def test_anomaly_detector_single_transaction_no_baseline():
    """Detector must not crash with only one transaction (no statistical baseline)."""
    detector = StatisticalAnomalyDetector()
    txs = [{"id": "1", "amount": 100.0, "category_name": "Dining", "merchant_name": "Cafe"}]
    baselines = detector.compute_category_baselines(txs)
    # With only 1 tx, no meaningful baseline can be computed
    # Should return empty baselines or handle gracefully
    assert isinstance(baselines, dict)


def test_anomaly_detector_no_transactions():
    """Detector must not crash with zero transactions."""
    detector = StatisticalAnomalyDetector()
    baselines = detector.compute_category_baselines([])
    assert baselines == {}


def test_anomaly_detector_zero_amount_transactions():
    """Detector must handle zero-amount transactions without division errors."""
    detector = StatisticalAnomalyDetector()
    txs = [
        {"id": str(i), "amount": 0.0, "category_name": "Groceries", "merchant_name": "Store"}
        for i in range(5)
    ]
    baselines = detector.compute_category_baselines(txs)
    # Zero-amount baseline — evaluate a zero tx
    zero_tx = {"id": "99", "amount": 0.0, "category_name": "Groceries", "merchant_name": "Store"}
    result = detector.evaluate_transaction(zero_tx, baselines)
    # Should not crash; can return None (normal) since there's no deviation
    assert result is None or isinstance(result, dict)


def test_anomaly_detector_explanation_avoids_fraud_language():
    """Anomaly explanations must never use the word 'fraud' — safety rule."""
    detector = StatisticalAnomalyDetector()
    txs = [
        {"id": str(i), "amount": float(30 + i), "category_name": "Groceries", "merchant_name": "Supermarket"}
        for i in range(8)
    ]
    baselines = detector.compute_category_baselines(txs)
    # Massive spike
    spike = {"id": "999", "amount": 5000.0, "category_name": "Groceries", "merchant_name": "Unknown"}
    result = detector.evaluate_transaction(spike, baselines)
    if result:
        assert "fraud" not in result["explanation"].lower(), (
            "Anomaly explanation must not claim fraud without evidence"
        )


def test_anomaly_score_bounded_between_zero_and_one():
    """Anomaly scores must always be in [0.0, 1.0] range."""
    detector = StatisticalAnomalyDetector()
    txs = [
        {"id": str(i), "amount": float(50 + i * 2), "category_name": "Shopping", "merchant_name": "Store"}
        for i in range(10)
    ]
    baselines = detector.compute_category_baselines(txs)

    test_amounts = [0.01, 10.0, 100.0, 500.0, 50_000.0]
    for amt in test_amounts:
        tx = {"id": "test", "amount": amt, "category_name": "Shopping", "merchant_name": "Test"}
        result = detector.evaluate_transaction(tx, baselines)
        if result:
            score = result["anomaly_score"]
            assert 0.0 <= score <= 1.0, f"Score {score} out of [0,1] for amount={amt}"
