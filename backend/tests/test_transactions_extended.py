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
async def test_transactions_search_and_sort(client: AsyncClient, test_db_session: AsyncSession):
    """Verify search across multiple fields, dynamic sorting, and summary computation."""
    # Register user
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "tx_search_tester@spendiq.ai",
            "password": "Password123!",
            "full_name": "Tx Search Tester",
        },
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch current user id
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    user_id = me_res.json()["id"]

    now = datetime.now(timezone.utc)
    t1 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        occurred_at=now - timedelta(days=2),
        amount=Decimal("50.00"),
        currency="USD",
        direction="EXPENSE",
        category_name="Transportation",
        merchant_name="Uber Technologies",
        description="Ride to airport",
        source="MANUAL",
    )
    t2 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        occurred_at=now - timedelta(days=1),
        amount=Decimal("3000.00"),
        currency="USD",
        direction="INCOME",
        category_name="Salary",
        merchant_name="TechCorp Inc",
        description="Bi-weekly payroll",
        source="MANUAL",
    )
    t3 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        occurred_at=now,
        amount=Decimal("120.00"),
        currency="USD",
        direction="EXPENSE",
        category_name="Dining",
        merchant_name="Luigi's Bistro",
        description="Team dinner celebration",
        source="MANUAL",
    )
    t4 = Transaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        occurred_at=now - timedelta(days=3),
        amount=Decimal("500.00"),
        currency="USD",
        direction="INVESTMENT",
        category_name="Index Portfolio",
        merchant_name="Vanguard",
        description="VTI recurring investment",
        source="MANUAL",
    )
    test_db_session.add_all([t1, t2, t3, t4])
    await test_db_session.commit()

    # 1. Search by merchant name
    res_s1 = await client.get("/api/v1/transactions?search=Uber", headers=headers)
    assert res_s1.status_code == 200
    items_s1 = res_s1.json()["items"]
    assert len(items_s1) == 1
    assert items_s1[0]["merchant_name"] == "Uber Technologies"

    # 2. Search by description term
    res_s2 = await client.get("/api/v1/transactions?search=dinner", headers=headers)
    assert res_s2.status_code == 200
    items_s2 = res_s2.json()["items"]
    assert len(items_s2) == 1
    assert items_s2[0]["merchant_name"] == "Luigi's Bistro"

    # 3. Dynamic sorting by amount desc
    res_sort_desc = await client.get("/api/v1/transactions?sort_by=amount&sort_order=desc", headers=headers)
    assert res_sort_desc.status_code == 200
    items_desc = res_sort_desc.json()["items"]
    assert float(items_desc[0]["amount"]) == 3000.00
    assert float(items_desc[-1]["amount"]) == 50.00

    # 4. Dynamic sorting by amount asc
    res_sort_asc = await client.get("/api/v1/transactions?sort_by=amount&sort_order=asc", headers=headers)
    assert res_sort_asc.status_code == 200
    items_asc = res_sort_asc.json()["items"]
    assert float(items_asc[0]["amount"]) == 50.00

    # 5. GET /api/v1/transactions/summary
    res_summary = await client.get("/api/v1/transactions/summary", headers=headers)
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert summary["total_count"] == 4
    assert float(summary["total_income"]) == 3000.00
    assert float(summary["total_expense"]) == 170.00  # 50 + 120
    assert float(summary["total_investment"]) == 500.00
    assert float(summary["net_cash_flow"]) == 2330.00  # 3000 - 170 - 500

    # 6. Filtered summary
    res_filter_sum = await client.get("/api/v1/transactions/summary?direction=EXPENSE", headers=headers)
    assert res_filter_sum.status_code == 200
    exp_sum = res_filter_sum.json()
    assert exp_sum["total_count"] == 2
    assert float(exp_sum["total_expense"]) == 170.00
    assert float(exp_sum["total_income"]) == 0.00
