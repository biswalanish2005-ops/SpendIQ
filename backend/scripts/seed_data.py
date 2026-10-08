import asyncio
import uuid
from datetime import datetime, date, timezone, timedelta
from decimal import Decimal
from app.core.security import get_password_hash
from sqlalchemy import select
from app.db.session import engine, AsyncSessionLocal, init_db
from app.models import (
    User,
    Account,
    Category,
    Transaction,
    ForecastRun,
    ForecastPoint,
    Anomaly,
    AIInsight,
    BudgetGoal,
)

async def seed():
    print("Initializing database tables...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if demo user already exists
        result = await session.execute(select(User).where(User.email == "demo@spendiq.ai"))
        existing_user = result.scalar_one_or_none()
        if existing_user:
            print("Demo user already exists. Database already seeded.")
            return

        print("Seeding demo user...")
        demo_user = User(
            id=str(uuid.uuid4()),
            email="demo@spendiq.ai",
            hashed_password=get_password_hash("DemoPass123!"),
            full_name="John Doe",
            currency="USD",
            is_active=True,
        )
        session.add(demo_user)
        await session.flush()

        print("Seeding accounts...")
        checking = Account(
            id=str(uuid.uuid4()),
            user_id=demo_user.id,
            name="Primary Checking",
            type="CHECKING",
            institution_name="Chase",
            balance=Decimal("4250.00"),
        )
        savings = Account(
            id=str(uuid.uuid4()),
            user_id=demo_user.id,
            name="High Yield Savings",
            type="SAVINGS",
            institution_name="Marcus",
            balance=Decimal("24500.00"),
        )
        credit = Account(
            id=str(uuid.uuid4()),
            user_id=demo_user.id,
            name="Sapphire Reserve",
            type="CREDIT_CARD",
            institution_name="Chase",
            balance=Decimal("-1120.00"),
        )
        investment = Account(
            id=str(uuid.uuid4()),
            user_id=demo_user.id,
            name="Vanguard Index Portfolio",
            type="INVESTMENT",
            institution_name="Vanguard",
            balance=Decimal("48200.00"),
        )
        session.add_all([checking, savings, credit, investment])
        await session.flush()

        print("Seeding categories...")
        categories_data = [
            ("Housing", "Fixed", "Home", True),
            ("Groceries", "Fixed", "ShoppingBag", True),
            ("Utilities", "Fixed", "Zap", True),
            ("Transportation", "Fixed", "Car", True),
            ("Healthcare", "Fixed", "HeartPulse", True),
            ("Dining Out", "Discretionary", "Utensils", False),
            ("Entertainment", "Discretionary", "Film", False),
            ("Shopping", "Discretionary", "Tag", False),
            ("Salary", "Income", "Briefcase", True),
            ("Investment Contributions", "Savings & Investments", "TrendingUp", True),
        ]
        
        category_map = {}
        for name, group, icon, is_sys in categories_data:
            cat = Category(
                id=str(uuid.uuid4()),
                user_id=demo_user.id,
                name=name,
                group=group,
                icon=icon,
                is_system=is_sys,
            )
            session.add(cat)
            category_map[name] = cat
        await session.flush()

        print("Seeding transactions (May through September 2026)...")
        now = datetime.now(timezone.utc)
        
        # Monthly base template for income and fixed expenses
        transactions = []
        for month_offset in range(4, -1, -1):
            # Calculate reference month date
            base_date = now - timedelta(days=month_offset * 30)
            
            # Monthly Salary (1st of month)
            transactions.append(
                Transaction(
                    id=str(uuid.uuid4()),
                    user_id=demo_user.id,
                    account_id=checking.id,
                    category_id=category_map["Salary"].id,
                    category_name="Salary",
                    occurred_at=base_date.replace(day=1, hour=9, minute=0),
                    amount=Decimal("6200.00"),
                    currency="USD",
                    direction="INCOME",
                    merchant_name="Acme Corp Payroll",
                    description="Bi-weekly direct deposit salary",
                    source="MANUAL",
                )
            )

            # Housing Rent (2nd of month)
            transactions.append(
                Transaction(
                    id=str(uuid.uuid4()),
                    user_id=demo_user.id,
                    account_id=checking.id,
                    category_id=category_map["Housing"].id,
                    category_name="Housing",
                    occurred_at=base_date.replace(day=2, hour=10, minute=0),
                    amount=Decimal("1850.00"),
                    currency="USD",
                    direction="EXPENSE",
                    merchant_name="Avalon Properties",
                    description="Monthly apartment lease payment",
                    source="MANUAL",
                )
            )

            # Utilities (5th of month)
            transactions.append(
                Transaction(
                    id=str(uuid.uuid4()),
                    user_id=demo_user.id,
                    account_id=checking.id,
                    category_id=category_map["Utilities"].id,
                    category_name="Utilities",
                    occurred_at=base_date.replace(day=5, hour=14, minute=0),
                    amount=Decimal("145.50"),
                    currency="USD",
                    direction="EXPENSE",
                    merchant_name="ConEdison Energy",
                    description="Electric & Gas service",
                    source="MANUAL",
                )
            )

            # Investment Contribution (10th of month)
            transactions.append(
                Transaction(
                    id=str(uuid.uuid4()),
                    user_id=demo_user.id,
                    account_id=investment.id,
                    category_id=category_map["Investment Contributions"].id,
                    category_name="Investment Contributions",
                    occurred_at=base_date.replace(day=10, hour=11, minute=0),
                    amount=Decimal("600.00") if month_offset == 0 else Decimal("750.00"),
                    currency="USD",
                    direction="INVESTMENT",
                    merchant_name="Vanguard VTSAX",
                    description="Monthly index fund auto-deposit",
                    source="MANUAL",
                )
            )

            # Recurring Groceries (multiple visits per month)
            transactions.append(
                Transaction(
                    id=str(uuid.uuid4()),
                    user_id=demo_user.id,
                    account_id=credit.id,
                    category_id=category_map["Groceries"].id,
                    category_name="Groceries",
                    occurred_at=base_date.replace(day=7, hour=17, minute=30),
                    amount=Decimal("165.20"),
                    currency="USD",
                    direction="EXPENSE",
                    merchant_name="Whole Foods Market",
                    description="Weekly groceries & organic produce",
                    source="MANUAL",
                )
            )
            transactions.append(
                Transaction(
                    id=str(uuid.uuid4()),
                    user_id=demo_user.id,
                    account_id=credit.id,
                    category_id=category_map["Groceries"].id,
                    category_name="Groceries",
                    occurred_at=base_date.replace(day=21, hour=18, minute=15),
                    amount=Decimal("194.80"),
                    currency="USD",
                    direction="EXPENSE",
                    merchant_name="Trader Joe's",
                    description="Mid-month grocery replenishment",
                    source="MANUAL",
                )
            )

            # Dining Out
            transactions.append(
                Transaction(
                    id=str(uuid.uuid4()),
                    user_id=demo_user.id,
                    account_id=credit.id,
                    category_id=category_map["Dining Out"].id,
                    category_name="Dining Out",
                    occurred_at=base_date.replace(day=14, hour=20, minute=0),
                    amount=Decimal("115.00"),
                    currency="USD",
                    direction="EXPENSE",
                    merchant_name="Osteria Morini",
                    description="Dinner with colleagues",
                    source="MANUAL",
                )
            )

        # Add anomalous transaction in current month
        anomalous_tx = Transaction(
            id=str(uuid.uuid4()),
            user_id=demo_user.id,
            account_id=credit.id,
            category_id=category_map["Shopping"].id,
            category_name="Shopping",
            occurred_at=now - timedelta(days=4),
            amount=Decimal("480.00"),
            currency="USD",
            direction="EXPENSE",
            merchant_name="JetBrains & Adobe Suite",
            description="Annual developer tool licensing renewal",
            source="MANUAL",
        )
        transactions.append(anomalous_tx)
        session.add_all(transactions)
        await session.flush()

        print("Seeding anomaly record...")
        anomaly = Anomaly(
            id=str(uuid.uuid4()),
            user_id=demo_user.id,
            transaction_id=anomalous_tx.id,
            anomaly_score=0.91,
            expected_value=Decimal("45.00"),
            deviation_factor=3.4,
            explanation="Transaction amount of $480.00 is 3.4x higher than normal shopping transactions ($45 baseline).",
            status="DETECTED",
            detected_at=now - timedelta(days=4),
        )
        session.add(anomaly)

        print("Seeding ML forecast run and prediction points...")
        forecast_run = ForecastRun(
            id=str(uuid.uuid4()),
            user_id=demo_user.id,
            target_metric="TOTAL_SPENDING",
            horizon_days=90,
            model_name="Holt-Winters Exponential Smoothing",
            model_version="1.2.0",
            metrics_json='{"mape": 4.1, "rmse": 92.5, "alpha": 0.35, "beta": 0.12}',
        )
        session.add(forecast_run)
        await session.flush()

        # Seed forecast points for Oct, Nov, Dec
        current_date = date.today()
        forecast_points = [
            ForecastPoint(
                id=str(uuid.uuid4()),
                run_id=forecast_run.id,
                period_date=date(2026, 10, 1),
                predicted_value=Decimal("3580.00"),
                lower_bound=Decimal("3350.00"),
                upper_bound=Decimal("3810.00"),
            ),
            ForecastPoint(
                id=str(uuid.uuid4()),
                run_id=forecast_run.id,
                period_date=date(2026, 11, 1),
                predicted_value=Decimal("3490.00"),
                lower_bound=Decimal("3220.00"),
                upper_bound=Decimal("3760.00"),
            ),
            ForecastPoint(
                id=str(uuid.uuid4()),
                run_id=forecast_run.id,
                period_date=date(2026, 12, 1),
                predicted_value=Decimal("3640.00"),
                lower_bound=Decimal("3340.00"),
                upper_bound=Decimal("3940.00"),
            ),
        ]
        session.add_all(forecast_points)

        print("Seeding AI Insights...")
        insights = [
            AIInsight(
                id=str(uuid.uuid4()),
                user_id=demo_user.id,
                category="SPENDING_ACCELERATION",
                headline="September Spending Exceeds 6-Month Baseline",
                explanation="Spending is currently at $3,750, which is +$150 (+4.2%) above your baseline of $3,600, primarily driven by annual software renewals.",
                metric_ref="spending.september",
                confidence_score=0.96,
                status="ACTIVE",
            ),
            AIInsight(
                id=str(uuid.uuid4()),
                user_id=demo_user.id,
                category="FORECAST_DIVERGENCE",
                headline="Projected Normalization in October",
                explanation="The Holt-Winters forecast projects spending will return toward $3,580 next month, resuming an improving trajectory.",
                metric_ref="forecast.october",
                confidence_score=0.91,
                status="ACTIVE",
            ),
            AIInsight(
                id=str(uuid.uuid4()),
                user_id=demo_user.id,
                category="SAVINGS_OPPORTUNITY",
                headline="Savings Rate Ahead of Target",
                explanation="Total savings reached $1,850 this month (+14.2% MoM), keeping you on track for your annual liquidity milestone.",
                metric_ref="savings.rate",
                confidence_score=0.98,
                status="ACTIVE",
            ),
        ]
        session.add_all(insights)

        print("Seeding budget goals...")
        budget_goals = [
            BudgetGoal(
                id=str(uuid.uuid4()),
                user_id=demo_user.id,
                category_id=category_map["Dining Out"].id,
                name="Dining Out Budget",
                target_amount=Decimal("350.00"),
                period="MONTHLY",
            ),
            BudgetGoal(
                id=str(uuid.uuid4()),
                user_id=demo_user.id,
                category_id=category_map["Groceries"].id,
                name="Groceries Target",
                target_amount=Decimal("500.00"),
                period="MONTHLY",
            ),
        ]
        session.add_all(budget_goals)

        await session.commit()
        print("Database seed completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
