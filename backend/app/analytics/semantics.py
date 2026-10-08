from decimal import Decimal
from typing import Tuple

def calculate_variance(current: Decimal, previous: Decimal) -> Tuple[Decimal, Decimal, str]:
    """
    Calculate dollar variance and percentage change with strict zero-division safeguards.
    Returns (change_amount, change_percent, direction).
    direction is 'INCREASE', 'DECREASE', or 'NEUTRAL'.
    """
    change_amount = current - previous

    if previous == Decimal("0.00") or previous == 0:
        if current == Decimal("0.00") or current == 0:
            change_percent = Decimal("0.0")
            direction = "NEUTRAL"
        elif current > 0:
            change_percent = Decimal("100.0")
            direction = "INCREASE"
        else:
            change_percent = Decimal("-100.0")
            direction = "DECREASE"
    else:
        # Standard percentage: ((current - previous) / abs(previous)) * 100
        raw_pct = (change_amount / abs(previous)) * Decimal("100")
        change_percent = round(raw_pct, 1)
        if change_amount > 0:
            direction = "INCREASE"
        elif change_amount < 0:
            direction = "DECREASE"
        else:
            direction = "NEUTRAL"

    return change_amount, change_percent, direction

def calculate_semantic_status(
    metric_type: str,
    change_percent: Decimal,
) -> Tuple[str, str, str]:
    """
    Determine semantic meaning based on financial domain logic.
    metric_type: 'SPENDING', 'SAVINGS', 'INCOME', 'INVESTMENT', 'SAVINGS_RATE'
    Returns (status, impact, status_label).
    status: 'IMPROVING', 'CONCERNING', 'STABLE', 'ATTENTION_REQUIRED'
    impact: 'POSITIVE', 'NEGATIVE', 'NEUTRAL'
    """
    # Threshold for stability: within +/- 0.5%
    if abs(change_percent) < Decimal("0.5"):
        return "STABLE", "NEUTRAL", "Stable"

    is_increase = change_percent > 0

    if metric_type == "SPENDING":
        # Spending increase is Concerning / Negative; decrease is Improving / Positive
        if is_increase:
            return "CONCERNING", "NEGATIVE", "Concerning"
        else:
            return "IMPROVING", "POSITIVE", "Improving"
    else:
        # SAVINGS, INCOME, INVESTMENT, SAVINGS_RATE
        # Increase is Improving / Positive; decrease is Concerning / Negative
        if is_increase:
            return "IMPROVING", "POSITIVE", "Improving"
        else:
            return "CONCERNING", "NEGATIVE", "Concerning"
