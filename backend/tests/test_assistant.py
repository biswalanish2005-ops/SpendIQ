import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models import User, Transaction, Account
from app.ai.assistant_engine import AIFinancialAssistant

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
async def test_assistant_intent_answers(test_db_session: AsyncSession):
    """Verify grounded assistant responses across multiple analytical domains."""
    user = User(
        id=str(uuid.uuid4()),
        email="assistant_tester@spendiq.ai",
        hashed_password="hashed_pw",
        full_name="Assistant Tester",
    )
    test_db_session.add(user)

    checking = Account(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="Primary Checking",
        type="CHECKING",
        institution_name="Chase",
        balance=Decimal("6000.00"),
    )
    savings = Account(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="High Yield Savings",
        type="SAVINGS",
        institution_name="Marcus",
        balance=Decimal("18000.00"),
    )
    brokerage = Account(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name="Taxable Brokerage",
        type="INVESTMENT",
        institution_name="Fidelity",
        balance=Decimal("25000.00"),
    )
    test_db_session.add_all([checking, savings, brokerage])

    now = datetime.now(timezone.utc)
    t_income = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Salary",
        occurred_at=now,
        amount=Decimal("5000.00"),
        direction="INCOME",
    )
    t_expense = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Groceries",
        occurred_at=now,
        amount=Decimal("1200.00"),
        direction="EXPENSE",
    )
    t_invest = Transaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        category_name="Index Fund",
        occurred_at=now,
        amount=Decimal("600.00"),
        direction="INVESTMENT",
    )
    test_db_session.add_all([t_income, t_expense, t_invest])
    await test_db_session.commit()

    # 1. Spending query
    resp_spending = await AIFinancialAssistant.answer_question(
        db=test_db_session,
        user_id=user.id,
        query="Am I spending more than usual this month?",
    )
    assert resp_spending.role == "ASSISTANT"
    assert len(resp_spending.blocks) > 0
    assert any(b.block_type == "METRIC" for b in resp_spending.blocks)
    assert any(b.block_type == "ACTION" for b in resp_spending.blocks)
    assert any("CashFlowAnalytics" in s for s in resp_spending.sources)
    action_block = next(b for b in resp_spending.blocks if b.block_type == "ACTION")
    assert action_block.data["route"] == "/analytics"

    # 2. Runway / Emergency query
    resp_runway = await AIFinancialAssistant.answer_question(
        db=test_db_session,
        user_id=user.id,
        query="What is my emergency fund runway in months?",
    )
    assert any("SavingsAnalytics" in s for s in resp_runway.sources)
    metric_runway = next(b for b in resp_runway.blocks if b.block_type == "METRIC")
    assert "Runway" in metric_runway.data["label"]
    action_runway = next(b for b in resp_runway.blocks if b.block_type == "ACTION")
    assert action_runway.data["route"] == "/savings"

    # 3. Anomalies query
    resp_anomalies = await AIFinancialAssistant.answer_question(
        db=test_db_session,
        user_id=user.id,
        query="Have any anomalous transactions been detected recently?",
    )
    assert any("AnomalyService" in s for s in resp_anomalies.sources)
    action_anomaly = next(b for b in resp_anomalies.blocks if b.block_type == "ACTION")
    assert action_anomaly.data["route"] == "/anomalies"

    # 4. Forecast query
    resp_forecast = await AIFinancialAssistant.answer_question(
        db=test_db_session,
        user_id=user.id,
        query="What does next month's forecast look like?",
    )
    assert any("TimeSeriesAnalytics" in s or "Forecast" in s for s in resp_forecast.sources)
    action_forecast = next(b for b in resp_forecast.blocks if b.block_type == "ACTION")
    assert action_forecast.data["route"] == "/predictions"

    # 5. Savings & Investment pacing
    resp_savings = await AIFinancialAssistant.answer_question(
        db=test_db_session,
        user_id=user.id,
        query="How are my savings and investments pacing?",
    )
    assert any("SavingsAnalytics" in s for s in resp_savings.sources)
    action_savings = next(b for b in resp_savings.blocks if b.block_type == "ACTION")
    assert action_savings.data["route"] == "/savings"

    # 6. Fallback grounding on unrelated query
    resp_unrelated = await AIFinancialAssistant.answer_question(
        db=test_db_session,
        user_id=user.id,
        query="Who won the UEFA Champions League in 2021?",
    )
    assert any("CashFlowAnalytics" in s for s in resp_unrelated.sources)
    assert len(resp_unrelated.blocks) >= 2


def test_assistant_suggestions():
    """Verify curated suggestion prompts."""
    suggestions = AIFinancialAssistant.get_suggestions()
    assert len(suggestions) >= 5
    for s in suggestions:
        assert s.id.startswith("sug_")
        assert len(s.prompt) > 5
        assert s.category != ""
        assert s.icon != ""


@pytest.mark.asyncio
async def test_assistant_api_endpoints(client: AsyncClient):
    """Verify HTTP API endpoints for /api/v1/assistant."""
    # Register user
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "assistant_api_user@spendiq.ai",
            "password": "Password123!",
            "full_name": "API Assistant User",
        },
    )
    assert reg_res.status_code == 201
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    # 1. GET /api/v1/assistant/suggestions
    sug_res = await client.get("/api/v1/assistant/suggestions", headers=headers)
    assert sug_res.status_code == 200
    suggestions = sug_res.json()
    assert isinstance(suggestions, list)
    assert len(suggestions) >= 5
    assert suggestions[0]["prompt"] == "Am I spending more than usual?"

    # 2. POST /api/v1/assistant/chat
    chat_res = await client.post(
        "/api/v1/assistant/chat",
        json={"query": "Am I spending more than usual?"},
        headers=headers,
    )
    assert chat_res.status_code == 200
    msg = chat_res.json()
    assert msg["role"] == "ASSISTANT"
    assert len(msg["blocks"]) > 0
    assert len(msg["sources"]) > 0
    assert any("CashFlowAnalytics" in s for s in msg["sources"])
