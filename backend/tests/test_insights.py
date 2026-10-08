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
from app.services.insights_service import AIInsightsService

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
async def test_insights_generation_and_grounding(test_db_session: AsyncSession):
    """Verify grounded insight synthesis across spending, savings, investments, and emergency fund."""
    user = User(
        id=str(uuid.uuid4()),
        email="insight_tester@spendiq.ai",
        hashed_password="hashed_pw",
        full_name="Insight Tester",
    )
    test_db_session.add(user)

    # Add accounts
    checking = Account(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="Checking",
        type="CHECKING",
        institution_name="Chase",
        balance=Decimal("5000.00"),
    )
    savings = Account(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="HYSA",
        type="SAVINGS",
        institution_name="Ally",
        balance=Decimal("20000.00"),
    )
    brokerage = Account(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="Index Portfolio",
        type="INVESTMENT",
        institution_name="Vanguard",
        balance=Decimal("35000.00"),
    )
    test_db_session.add_all([checking, savings, brokerage])

    now = datetime.now(timezone.utc)
    # Add transactions
    tx_inc = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Salary",
        occurred_at=now,
        amount=Decimal("6000.00"),
        direction="INCOME",
    )
    tx_exp = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Housing",
        occurred_at=now,
        amount=Decimal("2500.00"),
        direction="EXPENSE",
    )
    tx_inv = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Investment Contributions",
        occurred_at=now,
        amount=Decimal("700.00"),
        direction="INVESTMENT",
    )
    test_db_session.add_all([tx_inc, tx_exp, tx_inv])
    await test_db_session.commit()

    insights = await AIInsightsService.generate_grounded_insights(test_db_session, user.id)

    assert len(insights) >= 5
    categories = {ins.category for ins in insights}
    assert "SPENDING" in categories
    assert "SAVINGS" in categories
    assert "INVESTMENTS" in categories
    assert "FINANCIAL_HEALTH" in categories
    assert "FORECAST" in categories

    # Verify that evidence lists are populated with concrete facts
    for ins in insights:
        assert len(ins.evidence) > 0
        assert ins.navigation_link.startswith("/")
        assert ins.action_label != ""
        assert ins.confidence_score >= 0.80

    # Check Savings insight specifically
    savings_ins = next(i for i in insights if i.category == "SAVINGS")
    assert savings_ins.status == "IMPROVING"
    assert savings_ins.impact == "POSITIVE"
    assert "20%" in savings_ins.headline

    # Check Summary calculation
    summary = await AIInsightsService.get_insight_summary(test_db_session, user.id)
    assert summary.total_insights == len(insights)
    assert summary.active_count == len(insights)
    assert summary.average_confidence >= 80.0


@pytest.mark.asyncio
async def test_insights_filtering_and_status_update(test_db_session: AsyncSession):
    """Verify category filtering, status updates, and persistence."""
    user = User(
        id=str(uuid.uuid4()),
        email="filter_tester@spendiq.ai",
        hashed_password="hashed_pw",
        full_name="Filter Tester",
    )
    test_db_session.add(user)
    await test_db_session.commit()

    # Generate initial insights
    initial_items = await AIInsightsService.generate_grounded_insights(test_db_session, user.id)
    assert len(initial_items) > 0

    first_id = initial_items[0].id

    # Update status to ACTED_UPON
    updated = await AIInsightsService.update_insight_status(
        test_db_session,
        user.id,
        first_id,
        "ACTED_UPON",
    )
    assert updated is not None
    assert updated.action_state == "ACTED_UPON"

    # Query filtered by action_state ACTIVE
    active_items = await AIInsightsService.get_insights(
        test_db_session,
        user.id,
        action_state="ACTIVE",
    )
    assert first_id not in [i.id for i in active_items]

    # Query filtered by category
    spending_items = await AIInsightsService.get_insights(
        test_db_session,
        user.id,
        category="SPENDING",
    )
    for s in spending_items:
        assert s.category == "SPENDING"


@pytest.mark.asyncio
async def test_insights_api_endpoints(client: AsyncClient):
    """Verify HTTP API endpoints for /api/v1/insights."""
    # Register user
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "insights_api_user@spendiq.ai", "password": "Password123!", "full_name": "API Insights User"},
    )
    assert reg_res.status_code == 201
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    # Test GET /insights
    res_list = await client.get("/api/v1/insights", headers=headers)
    assert res_list.status_code == 200
    items = res_list.json()
    assert isinstance(items, list)
    assert len(items) > 0

    target_id = items[0]["id"]

    # Test GET /insights/summary
    res_summary = await client.get("/api/v1/insights/summary", headers=headers)
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert "total_insights" in summary
    assert "active_count" in summary
    assert "average_confidence" in summary

    # Test PATCH /insights/{id}/status
    res_patch = await client.patch(
        f"/api/v1/insights/{target_id}/status",
        json={"status": "DISMISSED"},
        headers=headers,
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["action_state"] == "DISMISSED"

    # Test POST /insights/generate
    res_gen = await client.post("/api/v1/insights/generate", headers=headers)
    assert res_gen.status_code == 200
    gen_items = res_gen.json()
    assert len(gen_items) >= 5
