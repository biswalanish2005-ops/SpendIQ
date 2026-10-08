from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AssistantQuestionRequest(BaseModel):
    """Payload sent by the user to ask a financial question."""
    query: str = Field(min_length=1, max_length=1000, description="User question or prompt")
    conversation_id: Optional[str] = None


class AssistantMetricBlock(BaseModel):
    """Structured quantitative comparison block."""
    label: str
    value: str
    comparison_label: Optional[str] = None
    comparison_value: Optional[str] = None
    trend: Optional[str] = None  # UP, DOWN, STABLE
    status: Optional[str] = None  # IMPROVING, CONCERNING, STABLE, ATTENTION_REQUIRED


class AssistantChartBlock(BaseModel):
    """Mini visualization payload for inline chart rendering."""
    chart_type: str  # e.g. 'SPENDING_TREND', 'CATEGORY_BREAKDOWN', 'SAVINGS_RATE', 'FORECAST'
    title: str
    data: List[Dict[str, Any]]


class AssistantActionBlock(BaseModel):
    """Direct deep-link navigation action to relevant workspace."""
    label: str
    route: str
    action_type: str = "NAVIGATE"  # NAVIGATE, FILTER, SCAN


class AssistantResponseBlock(BaseModel):
    """Typed polymorphic block rendering rich UI elements in assistant replies."""
    block_type: str = Field(description="'TEXT' | 'METRIC' | 'CHART' | 'RECOMMENDATION' | 'ACTION'")
    data: Dict[str, Any]


class AssistantMessage(BaseModel):
    """Complete assistant conversational response grounded in verified analytics."""
    id: str
    role: str = Field(description="'USER' | 'ASSISTANT'")
    content: str
    blocks: List[AssistantResponseBlock] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list, description="Verified internal analytical citations")
    created_at: datetime


class AssistantSuggestedPrompt(BaseModel):
    """Curated starter question chip."""
    id: str
    prompt: str
    category: str
    icon: str
