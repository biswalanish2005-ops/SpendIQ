import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models import User, Transaction, Account
from app.analytics.savings import SavingsAnalytics
from app.analytics.investments import InvestmentAnalytics

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def test_db_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
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


@pytest.fixture
async def client(test_db_session: AsyncSession):
    async def override_get_db():
        yield test_db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_savings_analytics_calculation(test_db_session: AsyncSession):
    """Verify savings rate, benchmark comparison, and emergency fund metrics."""
    user = User(
        id=str(uuid.uuid4()),
        email="savings_test@spendiq.ai",
        hashed_password="hashed_pw",
        full_name="Savings Tester",
    )
    test_db_session.add(user)

    # Add liquid accounts
    checking = Account(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="Checking",
        type="CHECKING",
        institution_name="Chase",
        balance=Decimal("5000.00"),
    )
    savings_acc = Account(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="HYSA",
        type="SAVINGS",
        institution_name="Ally",
        balance=Decimal("25000.00"),
    )
    test_db_session.add_all([checking, savings_acc])

    now = datetime.now(timezone.utc)
    # Seed current month and previous month
    tx_inc1 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Salary",
        occurred_at=now,
        amount=Decimal("6000.00"),
        direction="INCOME",
    )
    tx_exp1 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Housing",
        occurred_at=now,
        amount=Decimal("3000.00"),
        direction="EXPENSE",
    )

    prev_month_date = now - timedelta(days=32)
    tx_inc2 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Salary",
        occurred_at=prev_month_date,
        amount=Decimal("6000.00"),
        direction="INCOME",
    )
    tx_exp2 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Housing",
        occurred_at=prev_month_date,
        amount=Decimal("3600.00"),
        direction="EXPENSE",
    )
    test_db_session.add_all([tx_inc1, tx_exp1, tx_inc2, tx_exp2])
    await test_db_session.commit()

    intelligence = await SavingsAnalytics.get_savings_intelligence(test_db_session, user.id, now)

    # Current month savings = 6000 - 3000 = 3000
    assert intelligence.current_savings_amount == 3000.0
    assert intelligence.current_savings_rate == 50.0
    # Prev month savings = 6000 - 3600 = 2400 (40.0%)
    # MoM change = 50.0 - 40.0 = +10.0%
    assert intelligence.mom_change_rate == 10.0
    assert intelligence.direction == "INCREASE"
    assert intelligence.financial_impact == "POSITIVE"
    assert intelligence.status == "IMPROVING"

    # Emergency fund: liquid balance = 5000 + 25000 = 30000
    assert intelligence.emergency_fund.liquid_balance == 30000.0
    assert intelligence.emergency_fund.months_of_coverage >= 6.0
    assert intelligence.emergency_fund.status == "EXCELLENT"
    assert len(intelligence.trajectory) >= 6


@pytest.mark.asyncio
async def test_investment_analytics_calculation(test_db_session: AsyncSession):
    """Verify investment cadence, consistency score, and asset allocation breakdown."""
    user = User(
        id=str(uuid.uuid4()),
        email="invest_test@spendiq.ai",
        hashed_password="hashed_pw",
        full_name="Invest Tester",
    )
    test_db_session.add(user)

    brokerage = Account(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="Vanguard Brokerage",
        type="INVESTMENT",
        institution_name="Vanguard",
        balance=Decimal("40000.00"),
    )
    checking = Account(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="Checking",
        type="CHECKING",
        institution_name="Chase",
        balance=Decimal("10000.00"),
    )
    test_db_session.add_all([brokerage, checking])

    now = datetime.now(timezone.utc)
    # 2 months of investment contributions
    tx1 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Investment Contributions",
        occurred_at=now,
        amount=Decimal("800.00"),
        direction="INVESTMENT",
    )
    tx_inc = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Salary",
        occurred_at=now,
        amount=Decimal("8000.00"),
        direction="INCOME",
    )

    prev_month_date = now - timedelta(days=32)
    tx2 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Investment Contributions",
        occurred_at=prev_month_date,
        amount=Decimal("600.00"),
        direction="INVESTMENT",
    )
    test_db_session.add_all([tx1, tx_inc, tx2])
    await test_db_session.commit()

    intelligence = await InvestmentAnalytics.get_investment_intelligence(test_db_session, user.id, now)

    assert intelligence.current_monthly_contribution == 800.0
    assert intelligence.income_share_percentage == 10.0
    # MoM: (800 - 600) / 600 = +33.3%
    assert intelligence.mom_change_percentage == 33.3
    assert intelligence.direction == "INCREASE"
    assert intelligence.financial_impact == "POSITIVE"
    assert intelligence.status == "IMPROVING"

    # Consistency score (2 months out of 6 active)
    assert intelligence.consistency_score > 0.0
    assert intelligence.total_portfolio_balance == 40000.0
    assert len(intelligence.allocations) == 2


@pytest.mark.asyncio
async def test_savings_and_investments_api_endpoints(client: AsyncClient):
    """Verify HTTP API endpoints for /api/v1/analytics/savings and /investments."""
    # Register user
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "savings_api_user@spendiq.ai", "password": "Password123!", "full_name": "API User"},
    )
    assert reg_res.status_code == 201
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    # Test Savings endpoint
    res_savings = await client.get("/api/v1/analytics/savings", headers=headers)
    assert res_savings.status_code == 200
    data_savings = res_savings.json()
    assert "current_savings_rate" in data_savings
    assert "emergency_fund" in data_savings
    assert "trajectory" in data_savings

    # Test Investments endpoint
    res_invest = await client.get("/api/v1/analytics/investments", headers=headers)
    assert res_invest.status_code == 200
    data_invest = res_invest.json()
    assert "current_monthly_contribution" in data_invest
    assert "consistency_score" in data_invest
    assert "allocations" in data_invest
    assert "cadence" in data_invest
