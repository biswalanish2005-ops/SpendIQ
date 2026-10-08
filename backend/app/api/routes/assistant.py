from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.assistant import (
    AssistantQuestionRequest,
    AssistantMessage,
    AssistantSuggestedPrompt,
)
from app.ai.assistant_engine import AIFinancialAssistant

router = APIRouter()


@router.post("/chat", response_model=AssistantMessage)
async def chat_with_assistant(
    payload: AssistantQuestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Send a natural language prompt to the Grounded AI Financial Assistant.
    Evaluates real analytical models across cash flow, anomalies, forecasts,
    savings, and runway to formulate verified answers and rich UI blocks.
    """
    return await AIFinancialAssistant.answer_question(
        db=db,
        user_id=current_user.id,
        query=payload.query,
    )


@router.get("/suggestions", response_model=List[AssistantSuggestedPrompt])
async def get_suggestions(
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve curated suggestion prompts for initial exploration.
    """
    return AIFinancialAssistant.get_suggestions()
