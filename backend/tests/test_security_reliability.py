"""
Phase 17 — Security and Reliability Tests
Tests for: sort_by injection prevention, request ID tracing headers,
auth edge cases, and rate-limit-resilient error responses.
"""
import pytest
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
async def test_health_contains_request_id_header(client: AsyncClient):
    """Verify X-Request-ID tracing header is present on all responses."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert "x-request-id" in response.headers
    # X-Request-ID should be non-empty
    assert len(response.headers["x-request-id"]) > 0


@pytest.mark.asyncio
async def test_health_contains_process_time_header(client: AsyncClient):
    """Verify X-Process-Time performance header is set on all responses."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert "x-process-time" in response.headers
    process_time = response.headers["x-process-time"]
    assert process_time.endswith("ms")


@pytest.mark.asyncio
async def test_client_request_id_is_echoed(client: AsyncClient):
    """Verify that a client-supplied X-Request-ID is preserved in the response."""
    custom_id = "test-req-abc123xyz"
    response = await client.get("/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers.get("x-request-id") == custom_id


@pytest.mark.asyncio
async def test_sort_by_whitelist_rejects_injection(client: AsyncClient):
    """
    SECURITY: Verify that injecting arbitrary column names via sort_by is rejected.
    Protects against column name injection attacks on the transaction listing endpoint.
    """
    # Register user first
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "sec_tester@spendiq.ai", "password": "Password123!", "full_name": "Sec Tester"},
    )
    assert reg_res.status_code == 201
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    # Attempt injection via sort_by
    malicious_values = [
        "id; DROP TABLE transactions; --",
        "hashed_password",
        "user_id",
        "(SELECT 1)",
        "1=1",
        "external_id",
    ]
    for malicious in malicious_values:
        res = await client.get(
            f"/api/v1/transactions?sort_by={malicious}",
            headers=headers,
        )
        assert res.status_code == 422, (
            f"Expected 422 for sort_by='{malicious}', got {res.status_code}"
        )


@pytest.mark.asyncio
async def test_sort_by_whitelist_allows_valid_columns(client: AsyncClient):
    """Verify that all whitelisted sort_by columns are accepted without error."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "sort_tester@spendiq.ai", "password": "Password123!", "full_name": "Sort Tester"},
    )
    assert reg_res.status_code == 201
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    allowed_columns = ["occurred_at", "amount", "merchant_name", "category_name", "created_at"]
    for col in allowed_columns:
        res = await client.get(
            f"/api/v1/transactions?sort_by={col}",
            headers=headers,
        )
        assert res.status_code == 200, (
            f"Expected 200 for sort_by='{col}', got {res.status_code}: {res.text}"
        )


@pytest.mark.asyncio
async def test_global_exception_handler_returns_request_id(client: AsyncClient):
    """Verify that 404 Not Found responses include proper structured JSON (no raw stack traces)."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "err_tester@spendiq.ai", "password": "Password123!", "full_name": "Err Tester"},
    )
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    # Fetch non-existent transaction
    res = await client.get("/api/v1/transactions/non-existent-id-000", headers=headers)
    assert res.status_code == 404
    data = res.json()
    # Should return structured error — not a raw exception traceback
    assert "detail" in data or "message" in data


@pytest.mark.asyncio
async def test_auth_refresh_token_invalid_rejected(client: AsyncClient):
    """Verify that forged or expired refresh tokens are explicitly rejected."""
    res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "forged.invalid.refresh.token"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_auth_register_duplicate_email_rejected(client: AsyncClient):
    """Verify that duplicate email registration returns 400, not 500."""
    payload = {
        "email": "dupe@spendiq.ai",
        "password": "Password123!",
        "full_name": "Dupe User",
    }
    # First registration succeeds
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Second registration with same email must fail gracefully
    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    data = res2.json()
    assert "email" in data.get("detail", "").lower() or "exists" in data.get("detail", "").lower()


@pytest.mark.asyncio
async def test_health_endpoint_enriched_fields(client: AsyncClient):
    """Verify the enriched health endpoint returns all Phase 16 fields."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert "service" in data
    assert "environment" in data
    assert "database" in data
    assert "timestamp" in data
    # Phase 16 enriched fields
    assert "version" in data
    assert "uptime_seconds" in data
    assert isinstance(data["uptime_seconds"], (int, float))


def test_production_mode_rejects_default_jwt_secret():
    """Verify that Settings raises ValueError if default JWT secret is used in production."""
    from app.core.config import Settings
    with pytest.raises(ValueError, match="Default development JWT_SECRET_KEY cannot be used"):
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET_KEY="spendiq_super_secret_jwt_key_for_development_purposes_only_32char",
        )


def test_production_mode_rejects_short_jwt_secret():
    """Verify that Settings raises ValueError if JWT secret is shorter than 32 characters in production."""
    from app.core.config import Settings
    with pytest.raises(ValueError, match="at least 32 characters"):
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET_KEY="short-secret-key",
        )


def test_production_mode_accepts_secure_secret():
    """Verify that Settings accepts valid 64-character secret in production."""
    from app.core.config import Settings
    secure_secret = "a" * 64
    s = Settings(
        ENVIRONMENT="production",
        JWT_SECRET_KEY=secure_secret,
    )
    assert s.JWT_SECRET_KEY == secure_secret
    assert s.ENVIRONMENT == "production"


def test_cors_origins_comma_separated_parsing():
    """Verify that ALLOWED_ORIGINS parses comma-separated string."""
    from app.core.config import Settings
    s = Settings(ALLOWED_ORIGINS="https://app.spendiq.ai, https://admin.spendiq.ai")
    assert s.ALLOWED_ORIGINS == ["https://app.spendiq.ai", "https://admin.spendiq.ai"]
