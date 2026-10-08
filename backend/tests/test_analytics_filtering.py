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
async def test_analytics_account_filtering(client: AsyncClient, test_db_session: AsyncSession):
    """Verify that analytics endpoints accurately isolate metrics when filtered by account_id."""
    # Register user
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "analytics_filter_tester@spendiq.ai",
            "password": "Password123!",
            "full_name": "Analytics Filter Tester",
        },
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_res = await client.get("/api/v1/auth/me", headers=headers)
    user_id = me_res.json()["id"]

    # Create 2 accounts
    acc_checking = Account(
        id=str(uuid.uuid4()),
        user_id=user_id,
        name="Chase Checking",
        type="CHECKING",
        institution_name="Chase",
        balance=Decimal("5000.00"),
    )
    acc_credit = Account(
        id=str(uuid.uuid4()),
        user_id=user_id,
        name="Amex Card",
        type="CREDIT",
        institution_name="American Express",
        balance=Decimal("1200.00"),
    )
    test_db_session.add_all([acc_checking, acc_credit])

    now = datetime.now(timezone.utc)
    # Checking transactions: $4000 income, $1000 rent
    t_inc = Transaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        account_id=acc_checking.id,
        occurred_at=now,
        amount=Decimal("4000.00"),
        currency="USD",
        direction="INCOME",
        category_name="Salary",
        merchant_name="Employer",
        source="MANUAL",
    )
    t_rent = Transaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        account_id=acc_checking.id,
        occurred_at=now,
        amount=Decimal("1000.00"),
        currency="USD",
        direction="EXPENSE",
        category_name="Housing",
        merchant_name="Landlord LLC",
        source="MANUAL",
    )

    # Credit card transactions: $250 dining, $150 shopping
    t_dining = Transaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        account_id=acc_credit.id,
        occurred_at=now,
        amount=Decimal("250.00"),
        currency="USD",
        direction="EXPENSE",
        category_name="Dining",
        merchant_name="City Diner",
        source="MANUAL",
    )
    t_shop = Transaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        account_id=acc_credit.id,
        occurred_at=now,
        amount=Decimal("150.00"),
        currency="USD",
        direction="EXPENSE",
        category_name="Shopping",
        merchant_name="Apple Store",
        source="MANUAL",
    )
    test_db_session.add_all([t_inc, t_rent, t_dining, t_shop])
    await test_db_session.commit()

    # 1. Total Overview (unfiltered)
    res_all = await client.get("/api/v1/analytics/overview", headers=headers)
    assert res_all.status_code == 200
    all_data = res_all.json()
    assert float(all_data["income"]["current"]) == 4000.00
    assert float(all_data["spending"]["current"]) == 1400.00  # 1000 + 250 + 150

    # 2. Overview filtered by checking account
    res_chk = await client.get(f"/api/v1/analytics/overview?account_id={acc_checking.id}", headers=headers)
    assert res_chk.status_code == 200
    chk_data = res_chk.json()
    assert float(chk_data["income"]["current"]) == 4000.00
    assert float(chk_data["spending"]["current"]) == 1000.00

    # 3. Overview filtered by credit card account
    res_crd = await client.get(f"/api/v1/analytics/overview?account_id={acc_credit.id}", headers=headers)
    assert res_crd.status_code == 200
    crd_data = res_crd.json()
    assert float(crd_data["income"]["current"]) == 0.00
    assert float(crd_data["spending"]["current"]) == 400.00  # 250 + 150

    # 4. Category breakdown filtered by credit card
    res_cat = await client.get(f"/api/v1/analytics/spending/categories?account_id={acc_credit.id}", headers=headers)
    assert res_cat.status_code == 200
    cat_data = res_cat.json()
    cat_names = [c["category_name"] for c in cat_data["categories"]]
    assert "Dining" in cat_names
    assert "Shopping" in cat_names
    assert "Housing" not in cat_names  # Housing was on checking!

    # 5. Top merchants filtered by credit card
    res_mch = await client.get(f"/api/v1/analytics/spending/merchants?account_id={acc_credit.id}", headers=headers)
    assert res_mch.status_code == 200
    mch_data = res_mch.json()
    mch_names = [m["merchant_name"] for m in mch_data]
    assert "City Diner" in mch_names
    assert "Apple Store" in mch_names
    assert "Landlord LLC" not in mch_names
