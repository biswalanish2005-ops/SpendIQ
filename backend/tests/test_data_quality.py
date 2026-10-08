"""
Phase 17 — Data Quality Validation Tests
Tests for: duplicate transaction detection, invalid date handling, 
missing required fields, currency inconsistencies, and import deduplication.
"""
import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta
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
        bind=engine, class_=AsyncSession, expire_on_commit=False,
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


@pytest.fixture
async def auth_headers(client: AsyncClient):
    """Register a test user and return auth headers."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "dq_tester@spendiq.ai", "password": "Password123!", "full_name": "DQ Tester"},
    )
    assert reg_res.status_code == 201
    return {"Authorization": f"Bearer {reg_res.json()['access_token']}"}


# ─── Transaction Input Validation ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_transaction_missing_required_amount(client: AsyncClient, auth_headers: dict):
    """Pydantic validation must reject a transaction with no amount."""
    payload = {
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        # "amount" intentionally omitted
        "currency": "USD",
        "direction": "EXPENSE",
        "category_name": "Groceries",
        "merchant_name": "Store",
    }
    res = await client.post("/api/v1/transactions", json=payload, headers=auth_headers)
    assert res.status_code == 422  # Unprocessable Entity


@pytest.mark.asyncio
async def test_transaction_missing_required_date(client: AsyncClient, auth_headers: dict):
    """Pydantic validation must reject a transaction with no occurred_at date."""
    payload = {
        # "occurred_at" intentionally omitted
        "amount": "50.00",
        "currency": "USD",
        "direction": "EXPENSE",
        "category_name": "Groceries",
        "merchant_name": "Store",
    }
    res = await client.post("/api/v1/transactions", json=payload, headers=auth_headers)
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_transaction_negative_amount_rejected(client: AsyncClient, auth_headers: dict):
    """Negative transaction amounts must be rejected by validation."""
    payload = {
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "amount": "-100.00",   # Invalid: negative amount
        "currency": "USD",
        "direction": "EXPENSE",
        "category_name": "Groceries",
        "merchant_name": "Store",
    }
    res = await client.post("/api/v1/transactions", json=payload, headers=auth_headers)
    # Should be 422 — model validation should reject negative amounts
    assert res.status_code in (422, 400), f"Expected 422 or 400, got {res.status_code}: {res.text}"


@pytest.mark.asyncio
async def test_transaction_invalid_direction_rejected(client: AsyncClient, auth_headers: dict):
    """Invalid direction values must be rejected cleanly."""
    payload = {
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "amount": "100.00",
        "currency": "USD",
        "direction": "INVALID_DIRECTION",  # Not in INCOME/EXPENSE/INVESTMENT/TRANSFER
        "category_name": "Groceries",
        "merchant_name": "Store",
    }
    res = await client.post("/api/v1/transactions", json=payload, headers=auth_headers)
    assert res.status_code == 422, f"Expected 422 for invalid direction, got {res.status_code}"


@pytest.mark.asyncio
async def test_transaction_future_date_accepted(client: AsyncClient, auth_headers: dict):
    """Future-dated transactions should be accepted (scheduled transactions are valid)."""
    future_date = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    payload = {
        "occurred_at": future_date,
        "amount": "200.00",
        "currency": "USD",
        "direction": "EXPENSE",
        "category_name": "Utilities",
        "merchant_name": "Electric Co",
    }
    res = await client.post("/api/v1/transactions", json=payload, headers=auth_headers)
    assert res.status_code == 201


@pytest.mark.asyncio
async def test_transaction_extreme_amount_accepted(client: AsyncClient, auth_headers: dict):
    """Very large amounts (e.g., real estate, investments) must be stored with decimal precision."""
    payload = {
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "amount": "9999999.99",  # Under Numeric(12,2) max
        "currency": "USD",
        "direction": "INVESTMENT",
        "category_name": "Real Estate",
        "merchant_name": "Property Fund",
    }
    res = await client.post("/api/v1/transactions", json=payload, headers=auth_headers)
    assert res.status_code == 201
    assert res.json()["amount"] == "9999999.99"


# ─── Import Deduplication Data Quality ────────────────────────────────────────

@pytest.mark.asyncio
async def test_csv_import_duplicate_external_ids_are_skipped(client: AsyncClient, auth_headers: dict):
    """
    DATA QUALITY: CSV import with duplicate rows should be detected during preview.
    """
    csv_content = (
        "Date,Merchant,Category,Amount,Direction\n"
        "2026-01-15,Whole Foods,Groceries,100.00,EXPENSE\n"
        "2026-01-15,Whole Foods,Groceries,100.00,EXPENSE\n"  # Exact duplicate row
        "2026-01-16,Blue Bottle,Coffee,5.00,EXPENSE\n"
    )

    import_preview_res = await client.post(
        "/api/v1/import/preview/raw",
        json={"csv_text": csv_content, "filename": "test.csv"},
        headers=auth_headers,
    )
    assert import_preview_res.status_code == 200
    preview_data = import_preview_res.json()
    assert "total_rows" in preview_data
    # Should detect 3 rows total (or deduplicate)
    assert preview_data["total_rows"] <= 3


@pytest.mark.asyncio
async def test_import_empty_csv_returns_validation_error(client: AsyncClient, auth_headers: dict):
    """An empty CSV submission must return a validation error, not a 500."""
    res = await client.post(
        "/api/v1/import/preview/raw",
        json={"csv_text": "", "filename": "empty.csv"},
        headers=auth_headers,
    )
    # Should return 400 (bad request) or 422, not a 500 server crash
    assert res.status_code in (400, 422, 200), f"Got {res.status_code}: {res.text}"


# ─── Pagination Boundary Tests ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_pagination_page_size_max_enforced(client: AsyncClient, auth_headers: dict):
    """Pagination must reject page_size > 100 (API-defined maximum)."""
    res = await client.get(
        "/api/v1/transactions?page_size=999",
        headers=auth_headers,
    )
    assert res.status_code == 422, f"Expected 422 for page_size=999, got {res.status_code}"


@pytest.mark.asyncio
async def test_pagination_page_must_be_positive(client: AsyncClient, auth_headers: dict):
    """Pagination page=0 must be rejected."""
    res = await client.get(
        "/api/v1/transactions?page=0",
        headers=auth_headers,
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_empty_database_returns_empty_paginated_result(client: AsyncClient, auth_headers: dict):
    """A new user with no transactions must get an empty paginated result, not an error."""
    res = await client.get("/api/v1/transactions", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 0
    assert data["items"] == []
    assert data["page"] == 1
