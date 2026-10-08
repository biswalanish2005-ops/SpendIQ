import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models import User, Transaction, Category
from app.analytics.semantics import calculate_variance, calculate_semantic_status
from app.analytics.category_analytics import CategoryAnalytics

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

def test_zero_division_safeguard():
    """Verify clean handling of zero previous or zero current amounts without ZeroDivisionError."""
    # Zero to Zero
    diff, pct, direction = calculate_variance(Decimal("0.00"), Decimal("0.00"))
    assert diff == Decimal("0.00")
    assert pct == Decimal("0.0")
    assert direction == "NEUTRAL"

    # From 0 to positive amount
    diff, pct, direction = calculate_variance(Decimal("150.00"), Decimal("0.00"))
    assert diff == Decimal("150.00")
    assert pct == Decimal("100.0")
    assert direction == "INCREASE"

    # From positive amount to 0
    diff, pct, direction = calculate_variance(Decimal("0.00"), Decimal("200.00"))
    assert diff == Decimal("-200.00")
    assert pct == Decimal("-100.0")
    assert direction == "DECREASE"

def test_semantic_status_assignment():
    """
    CRITICAL FINANCIAL INTELLIGENCE TEST:
    Spending increase is CONCERNING; spending decrease is IMPROVING.
    Savings increase is IMPROVING; savings decrease is CONCERNING.
    """
    # Spending +15% -> Concerning
    stat, imp, lbl = calculate_semantic_status("SPENDING", Decimal("15.0"))
    assert stat == "CONCERNING"
    assert imp == "NEGATIVE"
    assert lbl == "Concerning"

    # Spending -10% -> Improving
    stat, imp, lbl = calculate_semantic_status("SPENDING", Decimal("-10.0"))
    assert stat == "IMPROVING"
    assert imp == "POSITIVE"
    assert lbl == "Improving"

    # Savings +12% -> Improving
    stat, imp, lbl = calculate_semantic_status("SAVINGS", Decimal("12.0"))
    assert stat == "IMPROVING"
    assert imp == "POSITIVE"
    assert lbl == "Improving"

    # Savings -8% -> Concerning
    stat, imp, lbl = calculate_semantic_status("SAVINGS", Decimal("-8.0"))
    assert stat == "CONCERNING"
    assert imp == "NEGATIVE"
    assert lbl == "Concerning"

    # Negligible change (+0.3%) -> Stable
    stat, imp, lbl = calculate_semantic_status("SPENDING", Decimal("0.3"))
    assert stat == "STABLE"
    assert imp == "NEUTRAL"
    assert lbl == "Stable"

@pytest.mark.asyncio
async def test_category_aggregates_match_raw_transactions(test_db_session: AsyncSession):
    """Verify that category breakdowns sum precisely to total expense spending."""
    user = User(
        id=str(uuid.uuid4()),
        email="cat_tester@spendiq.ai",
        hashed_password="hash",
        full_name="Category Tester",
    )
    test_db_session.add(user)
    await test_db_session.flush()

    # Create Categories
    c_fixed = Category(id=str(uuid.uuid4()), user_id=user.id, name="Housing", group="Fixed")
    c_disc = Category(id=str(uuid.uuid4()), user_id=user.id, name="Dining", group="Discretionary")
    test_db_session.add_all([c_fixed, c_disc])
    await test_db_session.flush()

    # Add raw expenses
    now = datetime.now(timezone.utc)
    tx1 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Housing",
        occurred_at=now,
        amount=Decimal("1500.00"),
        direction="EXPENSE",
        merchant_name="Landlord Co",
    )
    tx2 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Dining",
        occurred_at=now,
        amount=Decimal("250.00"),
        direction="EXPENSE",
        merchant_name="Bistro Paris",
    )
    tx3 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Dining",
        occurred_at=now,
        amount=Decimal("50.00"),
        direction="EXPENSE",
        merchant_name="Cafe Central",
    )
    # Income transaction (should NOT be in spending breakdown)
    tx_inc = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Salary",
        occurred_at=now,
        amount=Decimal("5000.00"),
        direction="INCOME",
        merchant_name="Employer",
    )
    test_db_session.add_all([tx1, tx2, tx3, tx_inc])
    await test_db_session.commit()

    breakdown = await CategoryAnalytics.get_breakdown(test_db_session, user.id)
    assert breakdown.total_spending == Decimal("1800.00")
    assert breakdown.fixed_amount == Decimal("1500.00")
    assert breakdown.discretionary_amount == Decimal("300.00")
    assert breakdown.fixed_amount + breakdown.discretionary_amount == breakdown.total_spending
    assert len(breakdown.categories) == 2

    # Check Dining total = 250 + 50 = 300
    dining_cat = next(c for c in breakdown.categories if c.category_name == "Dining")
    assert dining_cat.amount == Decimal("300.00")
    assert dining_cat.transaction_count == 2
    assert dining_cat.percentage == Decimal("16.7")

@pytest.mark.asyncio
async def test_analytics_api_endpoints(client: AsyncClient):
    """Verify overview, trend, categories, merchants, and velocity analytics endpoints."""
    # Register user
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "analytics_user@spendiq.ai", "password": "Password123!", "full_name": "Analytics User"},
    )
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    # Add transactions
    now = datetime.now(timezone.utc)
    await client.post(
        "/api/v1/transactions",
        json={
            "occurred_at": now.isoformat(),
            "amount": "6000.00",
            "direction": "INCOME",
            "category_name": "Salary",
            "merchant_name": "Company Corp",
        },
        headers=headers,
    )
    await client.post(
        "/api/v1/transactions",
        json={
            "occurred_at": now.isoformat(),
            "amount": "2000.00",
            "direction": "EXPENSE",
            "category_name": "Housing",
            "merchant_name": "Apartment Complex",
        },
        headers=headers,
    )

    # 1. Test Overview
    overview_res = await client.get("/api/v1/analytics/overview", headers=headers)
    assert overview_res.status_code == 200
    overview_data = overview_res.json()
    assert "spending" in overview_data
    assert "income" in overview_data
    assert "savings" in overview_data
    assert overview_data["spending"]["current"] == "2000.00"
    assert overview_data["income"]["current"] == "6000.00"
    assert overview_data["savings"]["current"] == "4000.00"

    # 2. Test Spending Trend
    trend_res = await client.get("/api/v1/analytics/spending/trend", headers=headers)
    assert trend_res.status_code == 200
    trend_data = trend_res.json()
    assert len(trend_data["points"]) > 0
    assert "historical_baseline" in trend_data

    # 3. Test Spending Categories
    cat_res = await client.get("/api/v1/analytics/spending/categories", headers=headers)
    assert cat_res.status_code == 200
    cat_data = cat_res.json()
    assert cat_data["total_spending"] == "2000.00"
    assert len(cat_data["categories"]) == 1

    # 4. Test Top Merchants
    merch_res = await client.get("/api/v1/analytics/spending/merchants", headers=headers)
    assert merch_res.status_code == 200
    merch_data = merch_res.json()
    assert len(merch_data) == 1
    assert merch_data[0]["merchant_name"] == "Apartment Complex"

    # 5. Test Spending Velocity
    vel_res = await client.get("/api/v1/analytics/spending/velocity", headers=headers)
    assert vel_res.status_code == 200
    vel_data = vel_res.json()
    assert "daily_velocity" in vel_data
    assert "cumulative_comparison" in vel_data
    assert len(vel_data["daily_velocity"]) == 30
