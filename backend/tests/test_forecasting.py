import pytest
from datetime import date
from decimal import Decimal
from app.ml.forecasting import (
    MovingAverageBaseline,
    HoltWintersForecaster,
    FinancialForecastingEngine,
)


def test_moving_average_baseline():
    baseline = MovingAverageBaseline(window=3)
    series = [2000.0, 2100.0, 2050.0, 2200.0, 2300.0]
    preds, mae, rmse = baseline.fit_predict(series, horizon=2)
    assert len(preds) == 2
    # Moving average of last 3: (2050 + 2200 + 2300) / 3 = 2183.33
    assert abs(preds[0] - 2183.33) < 0.1
    assert mae > 0.0
    assert rmse >= mae


def test_holt_winters_forecaster():
    forecaster = HoltWintersForecaster()
    # Upward trending spending series
    series = [2000.0, 2150.0, 2300.0, 2500.0, 2700.0]
    forecaster.fit(series)
    
    assert forecaster.best_alpha is not None
    assert forecaster.best_beta is not None
    assert forecaster.mae >= 0.0
    assert forecaster.rmse >= 0.0
    
    # Check predictions and intervals
    forecasts = forecaster.predict(horizon=3, confidence_level=0.80)
    assert len(forecasts) == 3
    
    # Monotonic trend should project higher next month
    assert forecasts[0]["predicted_value"] > 2500.0
    # Lower bound must be less than prediction, upper bound must be greater
    for f in forecasts:
        assert f["lower_bound"] <= f["predicted_value"]
        assert f["upper_bound"] >= f["predicted_value"]


def test_financial_forecasting_engine_end_to_end():
    engine = FinancialForecastingEngine()
    historical_monthly = [
        {"period_date": date(2026, 5, 1), "period_label": "May 2026", "spending": 2400.0, "income": 6200.0, "investments": 750.0},
        {"period_date": date(2026, 6, 1), "period_label": "Jun 2026", "spending": 2450.0, "income": 6200.0, "investments": 750.0},
        {"period_date": date(2026, 7, 1), "period_label": "Jul 2026", "spending": 2500.0, "income": 6200.0, "investments": 750.0},
        {"period_date": date(2026, 8, 1), "period_label": "Aug 2026", "spending": 2600.0, "income": 6200.0, "investments": 750.0},
        {"period_date": date(2026, 9, 1), "period_label": "Sep 2026", "spending": 2950.5, "income": 6200.0, "investments": 600.0},
    ]
    category_monthly = [
        {"category_name": "Housing", "amount": 1850.0, "share_pct": 62.7},
        {"category_name": "Groceries", "amount": 420.0, "share_pct": 14.2},
        {"category_name": "Shopping", "amount": 480.0, "share_pct": 16.3},
        {"category_name": "Utilities", "amount": 145.5, "share_pct": 4.9},
        {"category_name": "Dining Out", "amount": 55.0, "share_pct": 1.9},
    ]

    result = engine.generate_spending_forecast(
        historical_monthly=historical_monthly,
        category_monthly=category_monthly,
        horizon_months=3,
        confidence_level=0.80,
    )

    assert result["run"]["model_name"] == "Holt-Winters Linear Trend"
    assert result["projected_next_month"] > 0
    assert result["next_month_lower_bound"] <= result["projected_next_month"]
    assert result["next_month_upper_bound"] >= result["projected_next_month"]
    assert len(result["timeline"]) == 8  # 5 historical + 3 horizon
    assert len(result["drivers"]) > 0
    assert len(result["category_forecasts"]) == 5
    assert result["savings_forecast"] is not None
    assert result["run"]["evaluation_metrics"]["baseline_mae"] > 0
