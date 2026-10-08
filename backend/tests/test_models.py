import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.db.base import Base
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

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture
async def async_session():
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with session_maker() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.mark.asyncio
async def test_decimal_money_precision(async_session: AsyncSession):
    """
    CRITICAL RULE TEST:
    Verify that money amounts are stored and retrieved as exact Decimal types,
    never binary floating-point. 0.10 + 0.20 must equal exact 0.30.
    """
    user = User(
        id=str(uuid.uuid4()),
        email="precision@spendiq.ai",
        hashed_password="hash",
        full_name="Precision Tester",
    )
    async_session.add(user)
    await async_session.flush()

    # Exact decimal amounts that fail in binary float arithmetic
    amount1 = Decimal("0.10")
    amount2 = Decimal("0.20")
    expected_sum = Decimal("0.30")

    tx1 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        occurred_at=datetime.now(timezone.utc),
        amount=amount1,
        currency="USD",
        direction="EXPENSE",
        merchant_name="Micro Merchant 1",
    )
    tx2 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        occurred_at=datetime.now(timezone.utc),
        amount=amount2,
        currency="USD",
        direction="EXPENSE",
        merchant_name="Micro Merchant 2",
    )
    async_session.add_all([tx1, tx2])
    await async_session.commit()

    # Query back
    result = await async_session.execute(
        select(Transaction).where(Transaction.user_id == user.id)
    )
    transactions = result.scalars().all()
    assert len(transactions) == 2

    for tx in transactions:
        assert isinstance(tx.amount, Decimal), f"Expected Decimal, got {type(tx.amount)}"

    total = transactions[0].amount + transactions[1].amount
    assert total == expected_sum, f"Expected {expected_sum}, got {total}"
    assert str(total) == "0.30"

@pytest.mark.asyncio
async def test_foreign_key_cascade(async_session: AsyncSession):
    """
    Verify relational constraints and cascading deletes.
    Deleting a user must cascade to their transactions and accounts.
    """
    user = User(
        id=str(uuid.uuid4()),
        email="cascade@spendiq.ai",
        hashed_password="hash",
        full_name="Cascade User",
    )
    async_session.add(user)
    await async_session.flush()

    account = Account(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="Test Checking",
        type="CHECKING",
        balance=Decimal("1500.00"),
    )
    async_session.add(account)
    await async_session.flush()

    tx = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        account_id=account.id,
        occurred_at=datetime.now(timezone.utc),
        amount=Decimal("45.50"),
        merchant_name="Coffee Shop",
    )
    async_session.add(tx)
    await async_session.commit()

    # Delete the user
    await async_session.delete(user)
    await async_session.commit()

    # Verify transactions and accounts are removed
    tx_result = await async_session.execute(select(Transaction).where(Transaction.user_id == user.id))
    assert len(tx_result.scalars().all()) == 0

    acc_result = await async_session.execute(select(Account).where(Account.user_id == user.id))
    assert len(acc_result.scalars().all()) == 0

@pytest.mark.asyncio
async def test_anomaly_and_forecast_models(async_session: AsyncSession):
    """
    Verify ML Forecast and Anomaly model constraints and precision.
    """
    user = User(
        id=str(uuid.uuid4()),
        email="ml@spendiq.ai",
        hashed_password="hash",
        full_name="ML User",
    )
    async_session.add(user)
    await async_session.flush()

    tx = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        occurred_at=datetime.now(timezone.utc),
        amount=Decimal("950.00"),
        merchant_name="Luxury Watch",
    )
    async_session.add(tx)
    await async_session.flush()

    anomaly = Anomaly(
        id=str(uuid.uuid4()),
        user_id=user.id,
        transaction_id=tx.id,
        anomaly_score=0.98,
        expected_value=Decimal("50.00"),
        deviation_factor=4.5,
        explanation="Significant outlier in discretionary bucket",
    )
    async_session.add(anomaly)

    forecast_run = ForecastRun(
        id=str(uuid.uuid4()),
        user_id=user.id,
        target_metric="TOTAL_SPENDING",
        horizon_days=30,
        model_name="Holt-Winters",
    )
    async_session.add(forecast_run)
    await async_session.flush()

    forecast_point = ForecastPoint(
        id=str(uuid.uuid4()),
        run_id=forecast_run.id,
        period_date=datetime.now(timezone.utc).date(),
        predicted_value=Decimal("3500.00"),
        lower_bound=Decimal("3300.00"),
        upper_bound=Decimal("3700.00"),
    )
    async_session.add(forecast_point)
    await async_session.commit()

    # Query back and verify Decimal types on expected value and forecast points
    anom_result = await async_session.execute(select(Anomaly).where(Anomaly.id == anomaly.id))
    queried_anomaly = anom_result.scalar_one()
    assert isinstance(queried_anomaly.expected_value, Decimal)
    assert queried_anomaly.anomaly_score == 0.98

    fp_result = await async_session.execute(select(ForecastPoint).where(ForecastPoint.id == forecast_point.id))
    queried_fp = fp_result.scalar_one()
    assert isinstance(queried_fp.predicted_value, Decimal)
    assert isinstance(queried_fp.lower_bound, Decimal)
    assert isinstance(queried_fp.upper_bound, Decimal)
