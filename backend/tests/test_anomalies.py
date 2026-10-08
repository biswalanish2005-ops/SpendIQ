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
from app.models.anomaly import Anomaly
from app.ml.anomaly_detection import StatisticalAnomalyDetector

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


def test_statistical_anomaly_detector():
    detector = StatisticalAnomalyDetector()

    # Normal transactions in Groceries and Shopping
    txs = [
        {"id": "1", "amount": 40.0, "category_name": "Groceries", "merchant_name": "Trader Joe's"},
        {"id": "2", "amount": 45.0, "category_name": "Groceries", "merchant_name": "Whole Foods"},
        {"id": "3", "amount": 50.0, "category_name": "Groceries", "merchant_name": "Safeway"},
        {"id": "4", "amount": 42.0, "category_name": "Groceries", "merchant_name": "Trader Joe's"},
        {"id": "5", "amount": 35.0, "category_name": "Shopping", "merchant_name": "Amazon"},
        {"id": "6", "amount": 40.0, "category_name": "Shopping", "merchant_name": "Target"},
    ]

    baselines = detector.compute_category_baselines(txs)
    assert "Groceries" in baselines
    assert baselines["Groceries"]["median"] > 0

    # Normal transaction -> returns None
    normal_tx = {"id": "7", "amount": 44.0, "category_name": "Groceries", "merchant_name": "Trader Joe's"}
    assert detector.evaluate_transaction(normal_tx, baselines) is None

    # Massive outlier -> returns candidate with HIGH severity
    anomalous_tx = {
        "id": "8",
        "amount": 450.0,
        "category_name": "Shopping",
        "merchant_name": "Luxury Electronics",
    }
    result = detector.evaluate_transaction(anomalous_tx, baselines)
    assert result is not None
    assert result["severity"] == "HIGH"
    assert result["anomaly_score"] >= 0.80
    assert result["deviation_factor"] >= 5.0
    assert "fraud" not in result["explanation"].lower()
    assert "unusual" in result["explanation"].lower() or "higher than" in result["explanation"].lower()


@pytest.mark.asyncio
async def test_anomaly_api_flow(client: AsyncClient, test_db_session: AsyncSession):
    # 1. Register User
    reg_payload = {
        "email": "anomaly_tester@spendiq.ai",
        "password": "SecurePassword123!",
        "full_name": "Anomaly Tester",
        "currency": "USD",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    user_id = reg_res.json()["user"]["id"]
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Seed Account & Categories
    account = Account(
        id=str(uuid.uuid4()),
        user_id=user_id,
        name="Checking",
        type="CHECKING",
        balance=Decimal("5000.00"),
        currency="USD",
    )
    test_db_session.add(account)

    category = Category(id=str(uuid.uuid4()), name="Dining Out", is_system=True)
    test_db_session.add(category)
    await test_db_session.flush()

    now = datetime.now(timezone.utc)
    # Seed 10 normal dining transactions ($25 - $35)
    tx_list = []
    for i in range(10):
        tx_list.append(
            Transaction(
                id=str(uuid.uuid4()),
                user_id=user_id,
                account_id=account.id,
                category_id=category.id,
                category_name="Dining Out",
                occurred_at=now - timedelta(days=i * 2 + 1),
                amount=Decimal(f"{25 + i}.00"),
                currency="USD",
                direction="EXPENSE",
                merchant_name="Local Bistro",
                description="Dinner",
            )
        )

    # 1 uncharacteristic spike ($420.00)
    spike_id = str(uuid.uuid4())
    tx_list.append(
        Transaction(
            id=spike_id,
            user_id=user_id,
            account_id=account.id,
            category_id=category.id,
            category_name="Dining Out",
            occurred_at=now - timedelta(days=1),
            amount=Decimal("420.00"),
            currency="USD",
            direction="EXPENSE",
            merchant_name="Michelin Star Experience",
            description="Luxury dinner",
        )
    )
    test_db_session.add_all(tx_list)
    await test_db_session.commit()

    # 3. POST /api/v1/anomalies/scan
    scan_res = await client.post("/api/v1/anomalies/scan", headers=headers)
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert scan_data["anomalies_detected"] >= 1
    assert scan_data["new_anomalies_created"] >= 1

    # 4. GET /api/v1/anomalies
    list_res = await client.get("/api/v1/anomalies", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) >= 1
    anomaly = items[0]
    assert anomaly["amount"] == 420.0
    assert anomaly["severity"] == "HIGH"
    assert anomaly["status"] == "DETECTED"
    assert "Michelin Star" in anomaly["merchant_name"]
    anomaly_id = anomaly["id"]

    # 5. GET /api/v1/anomalies/summary
    sum_res = await client.get("/api/v1/anomalies/summary", headers=headers)
    assert sum_res.status_code == 200
    sum_data = sum_res.json()
    assert sum_data["total_anomalies"] >= 1
    assert sum_data["high_severity_count"] >= 1
    assert sum_data["total_anomalous_amount"] >= 420.0

    # 6. GET /api/v1/anomalies/timeline
    time_res = await client.get("/api/v1/anomalies/timeline?days=30", headers=headers)
    assert time_res.status_code == 200
    timeline = time_res.json()
    assert isinstance(timeline, list)
    assert len(timeline) > 0

    # 7. PATCH /api/v1/anomalies/{id}/status -> ACKNOWLEDGED
    patch_res = await client.patch(
        f"/api/v1/anomalies/{anomaly_id}/status",
        json={"status": "ACKNOWLEDGED"},
        headers=headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "ACKNOWLEDGED"

    # Verify summary reflects resolution
    sum_res2 = await client.get("/api/v1/anomalies/summary", headers=headers)
    assert sum_res2.json()["resolved_count"] >= 1


@pytest.mark.asyncio
async def test_user_scoping_anomaly_isolation(client: AsyncClient, test_db_session: AsyncSession):
    """Ensure user B cannot access user A's anomalies."""
    # User A
    reg_a = await client.post(
        "/api/v1/auth/register",
        json={"email": "usera@spendiq.ai", "password": "Password123!", "full_name": "User A", "currency": "USD"},
    )
    token_a = reg_a.json()["access_token"]
    user_a_id = reg_a.json()["user"]["id"]

    # User B
    reg_b = await client.post(
        "/api/v1/auth/register",
        json={"email": "userb@spendiq.ai", "password": "Password123!", "full_name": "User B", "currency": "USD"},
    )
    token_b = reg_b.json()["access_token"]

    # Seed anomaly for User A
    tx_a = Transaction(
        id=str(uuid.uuid4()),
        user_id=user_a_id,
        category_name="Shopping",
        occurred_at=datetime.now(timezone.utc),
        amount=Decimal("999.00"),
        currency="USD",
        direction="EXPENSE",
        merchant_name="Secret Store",
        description="Private purchase",
    )
    test_db_session.add(tx_a)
    await test_db_session.flush()

    anomaly_a = Anomaly(
        id=str(uuid.uuid4()),
        user_id=user_a_id,
        transaction_id=tx_a.id,
        anomaly_score=0.95,
        expected_value=Decimal("50.00"),
        deviation_factor=19.9,
        explanation="Massive deviation",
        status="DETECTED",
    )
    test_db_session.add(anomaly_a)
    await test_db_session.commit()

    # User B lists anomalies -> should be empty
    list_b = await client.get("/api/v1/anomalies", headers={"Authorization": f"Bearer {token_b}"})
    assert list_b.status_code == 200
    assert len(list_b.json()) == 0

    # User B attempts to patch User A's anomaly -> 404
    patch_b = await client.patch(
        f"/api/v1/anomalies/{anomaly_a.id}/status",
        json={"status": "DISMISSED"},
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert patch_b.status_code == 404
