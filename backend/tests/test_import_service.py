import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models import User, Transaction, Account, ImportJob
from app.services.import_service import ImportService
from app.schemas.import_job import ImportExecuteRequest, ImportExecuteRow

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
async def test_import_preview_and_deduplication(test_db_session: AsyncSession):
    """Verify CSV preview, column detection, date parsing, and duplicate matching."""
    user = User(
        id=str(uuid.uuid4()),
        email="import_tester@spendiq.ai",
        hashed_password="hashed_pw",
        full_name="Import Tester",
    )
    test_db_session.add(user)

    # Pre-existing transaction in DB for duplicate matching
    now = datetime(2026, 9, 1, 12, 0, tzinfo=timezone.utc)
    existing_tx = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        occurred_at=now,
        amount=Decimal("45.50"),
        currency="USD",
        direction="EXPENSE",
        category_name="Groceries",
        merchant_name="Whole Foods Market",
        description="Fresh produce",
        source="MANUAL",
    )
    test_db_session.add(existing_tx)
    await test_db_session.commit()

    # CSV containing 3 rows: 1 duplicate, 1 valid expense, 1 valid income
    csv_content = (
        "Date,Merchant,Amount,Category,Type\n"
        "2026-09-01,Whole Foods Market,45.50,Groceries,EXPENSE\n"
        "2026-09-02,Target,32.10,Shopping,EXPENSE\n"
        "2026-09-03,Employer Payroll,2500.00,Salary,INCOME\n"
    )

    preview = await ImportService.parse_and_preview(
        db=test_db_session,
        user_id=user.id,
        content=csv_content,
        filename="chase_statement.csv",
    )

    assert preview.total_rows == 3
    assert preview.valid_rows == 3
    assert preview.duplicate_rows == 1
    assert preview.error_rows == 0
    assert "Date" in preview.headers
    assert preview.suggested_mappings["Date"] == "occurred_at"
    assert preview.suggested_mappings["Amount"] == "amount"
    assert preview.suggested_mappings["Merchant"] == "merchant_name"

    # Row 1 must be flagged as duplicate
    assert preview.preview_rows[0].is_duplicate is True
    assert "Whole Foods Market" in (preview.preview_rows[0].duplicate_reason or "")

    # Row 2 & 3 must not be duplicates
    assert preview.preview_rows[1].is_duplicate is False
    assert preview.preview_rows[2].is_duplicate is False
    assert preview.preview_rows[2].direction == "INCOME"


@pytest.mark.asyncio
async def test_import_execute_with_skip_duplicates(test_db_session: AsyncSession):
    """Verify batch insertion skipping duplicate rows and updating Account balance."""
    user = User(
        id=str(uuid.uuid4()),
        email="import_exec_tester@spendiq.ai",
        hashed_password="hashed_pw",
        full_name="Import Exec Tester",
    )
    test_db_session.add(user)

    account = Account(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="Checking Account",
        type="CHECKING",
        institution_name="Chase",
        balance=Decimal("1000.00"),
    )
    test_db_session.add(account)
    await test_db_session.commit()

    now = datetime(2026, 9, 2, tzinfo=timezone.utc)
    rows = [
        ImportExecuteRow(
            occurred_at=now,
            amount=Decimal("50.00"),
            direction="EXPENSE",
            category_name="Dining",
            merchant_name="Chipotle",
            description="Lunch burrito",
            is_duplicate=True,  # Should be skipped!
        ),
        ImportExecuteRow(
            occurred_at=now,
            amount=Decimal("120.00"),
            direction="EXPENSE",
            category_name="Utilities",
            merchant_name="Electric Co",
            description="Monthly power bill",
            is_duplicate=False,
        ),
        ImportExecuteRow(
            occurred_at=now,
            amount=Decimal("2000.00"),
            direction="INCOME",
            category_name="Salary",
            merchant_name="Acme Corp",
            description="Paycheck",
            is_duplicate=False,
        ),
    ]

    job = await ImportService.execute_import(
        db=test_db_session,
        user_id=user.id,
        payload=ImportExecuteRequest(
            filename="statement_sept.csv",
            account_id=account.id,
            skip_duplicates=True,
            rows=rows,
        ),
    )

    assert job.total_rows == 3
    assert job.imported_rows == 2
    assert job.duplicate_rows == 1
    assert job.status == "COMPLETED"

    # Verify updated account balance: 1000 - 120 + 2000 = 2880
    await test_db_session.refresh(account)
    assert float(account.balance) == 2880.00


@pytest.mark.asyncio
async def test_import_http_endpoints(client: AsyncClient):
    """Verify HTTP API endpoints for /api/v1/import."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "import_api_tester@spendiq.ai",
            "password": "Password123!",
            "full_name": "API Import Tester",
        },
    )
    assert reg_res.status_code == 201
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    # 1. GET /api/v1/import/template
    tpl_res = await client.get("/api/v1/import/template", headers=headers)
    assert tpl_res.status_code == 200
    assert "Date,Merchant,Category,Amount,Direction" in tpl_res.text

    # 2. POST /api/v1/import/preview/raw
    csv_text = (
        "Date,Merchant,Category,Amount,Direction\n"
        "2026-09-04,Starbucks,Coffee,5.25,EXPENSE\n"
        "2026-09-05,Freelance Client,Income,800.00,INCOME\n"
    )
    prev_res = await client.post(
        "/api/v1/import/preview/raw",
        json={"csv_text": csv_text, "filename": "september.csv"},
        headers=headers,
    )
    assert prev_res.status_code == 200
    prev_data = prev_res.json()
    assert prev_data["total_rows"] == 2
    assert prev_data["valid_rows"] == 2

    # 3. POST /api/v1/import/execute
    exec_payload = {
        "filename": "september.csv",
        "skip_duplicates": True,
        "rows": [
            {
                "occurred_at": r["occurred_at"],
                "amount": r["amount"],
                "currency": "USD",
                "direction": r["direction"],
                "category_name": r["category_name"],
                "merchant_name": r["merchant_name"],
                "description": r["description"],
                "is_duplicate": r["is_duplicate"],
            }
            for r in prev_data["preview_rows"]
        ],
    }
    exec_res = await client.post(
        "/api/v1/import/execute",
        json=exec_payload,
        headers=headers,
    )
    assert exec_res.status_code == 201
    job_data = exec_res.json()
    assert job_data["imported_rows"] == 2
    assert job_data["status"] == "COMPLETED"

    # 4. GET /api/v1/import/history
    hist_res = await client.get("/api/v1/import/history", headers=headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) >= 1
    assert history[0]["filename"] == "september.csv"
