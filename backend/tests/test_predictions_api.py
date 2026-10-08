import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.forecast import ForecastRun, ForecastPoint

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
async def test_prediction_api_flow(client: AsyncClient, test_db_session: AsyncSession):
    """Verify predictive forecasting API endpoints and DB persistence."""
    # 1. Register User & Obtain Token
    reg_payload = {
        "email": "ml_tester@spendiq.ai",
        "password": "SecurePassword123!",
        "full_name": "ML Tester",
        "currency": "USD",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    user_id = reg_res.json()["user"]["id"]

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "ml_tester@spendiq.ai", "password": "SecurePassword123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Seed Accounts, Categories, and Historical Transactions across 4 months
    account = Account(
        id=str(uuid.uuid4()),
        user_id=user_id,
        name="Primary Checking",
        type="CHECKING",
        balance=Decimal("10000.00"),
        currency="USD",
    )
    test_db_session.add(account)

    categories = [
        Category(id=str(uuid.uuid4()), name="Housing", is_system=True),
        Category(id=str(uuid.uuid4()), name="Groceries", is_system=True),
        Category(id=str(uuid.uuid4()), name="Shopping", is_system=True),
    ]
    test_db_session.add_all(categories)
    await test_db_session.flush()

    now = datetime.now(timezone.utc)
    txs = []
    # Seed 4 monthly periods
    for month_offset in range(3, -1, -1):
        dt = now - timedelta(days=month_offset * 30)
        # Income
        txs.append(
            Transaction(
                id=str(uuid.uuid4()),
                user_id=user_id,
                account_id=account.id,
                category_name="Salary",
                occurred_at=dt.replace(day=1),
                amount=Decimal("6000.00"),
                currency="USD",
                direction="INCOME",
                description="Salary",
            )
        )
        # Housing expense
        txs.append(
            Transaction(
                id=str(uuid.uuid4()),
                user_id=user_id,
                account_id=account.id,
                category_id=categories[0].id,
                category_name="Housing",
                occurred_at=dt.replace(day=2),
                amount=Decimal("1500.00"),
                currency="USD",
                direction="EXPENSE",
                description="Rent",
            )
        )
        # Groceries expense
        txs.append(
            Transaction(
                id=str(uuid.uuid4()),
                user_id=user_id,
                account_id=account.id,
                category_id=categories[1].id,
                category_name="Groceries",
                occurred_at=dt.replace(day=15),
                amount=Decimal("500.00") + Decimal(month_offset * 20),
                currency="USD",
                direction="EXPENSE",
                description="Supermarket",
            )
        )

    test_db_session.add_all(txs)
    await test_db_session.commit()

    # 3. GET /api/v1/predictions/spending
    spend_res = await client.get("/api/v1/predictions/spending?horizon_months=3", headers=headers)
    assert spend_res.status_code == 200
    spend_data = spend_res.json()

    assert "run" in spend_data
    assert spend_data["run"]["model_name"] == "Holt-Winters Linear Trend"
    assert spend_data["projected_next_month"] > 0
    assert spend_data["next_month_lower_bound"] <= spend_data["projected_next_month"]
    assert spend_data["next_month_upper_bound"] >= spend_data["projected_next_month"]
    assert len(spend_data["timeline"]) > 0
    assert len(spend_data["drivers"]) > 0
    assert len(spend_data["category_forecasts"]) > 0
    assert spend_data["savings_forecast"] is not None

    # 4. Verify DB Persistence of ForecastRun and ForecastPoints
    run_q = select(ForecastRun).where(ForecastRun.user_id == user_id)
    run_records = (await test_db_session.execute(run_q)).scalars().all()
    assert len(run_records) >= 1

    pt_q = select(ForecastPoint).where(ForecastPoint.run_id == run_records[0].id)
    points = (await test_db_session.execute(pt_q)).scalars().all()
    assert len(points) == 3  # 3-month horizon

    # 5. GET /api/v1/predictions/drivers
    drivers_res = await client.get("/api/v1/predictions/drivers", headers=headers)
    assert drivers_res.status_code == 200
    drivers_data = drivers_res.json()
    assert isinstance(drivers_data, list)
    assert len(drivers_data) > 0
    assert "dollar_variance" in drivers_data[0]
    assert "explanation" in drivers_data[0]

    # 6. GET /api/v1/predictions/categories
    cat_res = await client.get("/api/v1/predictions/categories", headers=headers)
    assert cat_res.status_code == 200
    cat_data = cat_res.json()
    assert isinstance(cat_data, list)
    assert len(cat_data) > 0
    assert "projected_spend" in cat_data[0]

    # 7. POST /api/v1/predictions/recompute
    recompute_res = await client.post("/api/v1/predictions/recompute?horizon_months=3", headers=headers)
    assert recompute_res.status_code == 200
    assert recompute_res.json()["projected_next_month"] > 0
