import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.db.base import Base
from app.db.session import get_db

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
async def test_health_endpoint(client: AsyncClient):
    """Verify system health check returns 200 OK."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data

@pytest.mark.asyncio
async def test_auth_flow(client: AsyncClient):
    """Verify user registration, login, and profile fetching."""
    # 1. Register User
    reg_payload = {
        "email": "tester@spendiq.ai",
        "password": "SecurePassword123!",
        "full_name": "Test Engineer",
        "currency": "USD",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201, reg_res.text
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "tester@spendiq.ai"

    access_token = reg_data["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 2. Get Me
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "tester@spendiq.ai"

    # 3. Login with correct credentials
    login_payload = {
        "email": "tester@spendiq.ai",
        "password": "SecurePassword123!",
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Login with bad password -> 401
    bad_login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "tester@spendiq.ai", "password": "WrongPassword!"},
    )
    assert bad_login_res.status_code == 401

@pytest.mark.asyncio
async def test_protected_routes_reject_unauthenticated(client: AsyncClient):
    """Verify protected endpoints reject requests without valid Bearer tokens."""
    res1 = await client.get("/api/v1/transactions")
    assert res1.status_code == 401

    res2 = await client.get("/api/v1/accounts")
    assert res2.status_code == 401

    res3 = await client.get(
        "/api/v1/transactions",
        headers={"Authorization": "Bearer invalid_or_forged_token"},
    )
    assert res3.status_code == 401

@pytest.mark.asyncio
async def test_transaction_crud_and_filtering(client: AsyncClient):
    """Verify transaction creation, retrieval, filtering, updating, and deletion."""
    # Register user and get token
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "txuser@spendiq.ai", "password": "Password1234!", "full_name": "Tx User"},
    )
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    # Create transaction
    tx_payload = {
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "amount": "149.99",
        "currency": "USD",
        "direction": "EXPENSE",
        "category_name": "Electronics",
        "merchant_name": "Best Buy Audio",
        "description": "Noise cancelling headphones",
        "source": "MANUAL",
    }
    create_res = await client.post("/api/v1/transactions", json=tx_payload, headers=headers)
    assert create_res.status_code == 201, create_res.text
    created_tx = create_res.json()
    assert created_tx["merchant_name"] == "Best Buy Audio"
    assert created_tx["amount"] == "149.99"
    tx_id = created_tx["id"]

    # Filter query: match merchant partial
    search_res = await client.get(
        "/api/v1/transactions?merchant=Best",
        headers=headers,
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["total"] == 1
    assert len(search_data["items"]) == 1

    # Filter query: no match
    no_match_res = await client.get(
        "/api/v1/transactions?merchant=Target",
        headers=headers,
    )
    assert no_match_res.status_code == 200
    assert no_match_res.json()["total"] == 0

    # Update transaction
    update_res = await client.patch(
        f"/api/v1/transactions/{tx_id}",
        json={"merchant_name": "Best Buy Flagship", "amount": "139.99"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["merchant_name"] == "Best Buy Flagship"
    assert update_res.json()["amount"] == "139.99"

    # Delete transaction
    del_res = await client.delete(f"/api/v1/transactions/{tx_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify deleted
    get_del = await client.get(f"/api/v1/transactions/{tx_id}", headers=headers)
    assert get_del.status_code == 404

@pytest.mark.asyncio
async def test_user_scoping_strict_isolation(client: AsyncClient):
    """
    CRITICAL SECURITY & DATA PRIVACY TEST:
    Verify that User B can never read or mutate User A's financial transactions.
    """
    # Register User A
    user_a_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "usera@spendiq.ai", "password": "Password1234!", "full_name": "User A"},
    )
    headers_a = {"Authorization": f"Bearer {user_a_res.json()['access_token']}"}

    # Register User B
    user_b_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "userb@spendiq.ai", "password": "Password1234!", "full_name": "User B"},
    )
    headers_b = {"Authorization": f"Bearer {user_b_res.json()['access_token']}"}

    # User A creates a transaction
    tx_payload = {
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "amount": "999.00",
        "currency": "USD",
        "direction": "EXPENSE",
        "category_name": "Private Expense",
        "merchant_name": "Confidential Store",
        "description": "User A confidential record",
    }
    tx_a = await client.post("/api/v1/transactions", json=tx_payload, headers=headers_a)
    assert tx_a.status_code == 201
    tx_a_id = tx_a.json()["id"]

    # User B tries to retrieve User A's transaction directly -> MUST return 404 Not Found
    leak_res = await client.get(f"/api/v1/transactions/{tx_a_id}", headers=headers_b)
    assert leak_res.status_code == 404

    # User B lists transactions -> MUST contain 0 items
    list_b_res = await client.get("/api/v1/transactions", headers=headers_b)
    assert list_b_res.status_code == 200
    assert list_b_res.json()["total"] == 0

    # User B tries to delete User A's transaction -> MUST return 404 Not Found
    del_leak_res = await client.delete(f"/api/v1/transactions/{tx_a_id}", headers=headers_b)
    assert del_leak_res.status_code == 404
