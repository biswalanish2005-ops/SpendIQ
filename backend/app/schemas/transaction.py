from datetime import datetime
from decimal import Decimal
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

# Allowed transaction direction values
TransactionDirection = Literal["INCOME", "EXPENSE", "INVESTMENT", "TRANSFER"]

class TransactionBase(BaseModel):
    occurred_at: datetime
    amount: Decimal = Field(..., gt=0, description="Exact monetary amount, strictly positive")
    currency: str = "USD"
    direction: TransactionDirection = Field("EXPENSE", description="INCOME, EXPENSE, INVESTMENT, or TRANSFER")
    category_name: str = "Uncategorized"
    merchant_name: str = "Unknown Merchant"
    description: Optional[str] = ""


class TransactionCreate(TransactionBase):
    account_id: Optional[str] = None
    category_id: Optional[str] = None
    source: str = "MANUAL"

class TransactionUpdate(BaseModel):
    occurred_at: Optional[datetime] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    direction: Optional[TransactionDirection] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    merchant_name: Optional[str] = None
    description: Optional[str] = None

class TransactionOut(TransactionBase):
    id: str
    user_id: str
    account_id: Optional[str] = None
    category_id: Optional[str] = None
    source: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TransactionFilterParams(BaseModel):
    search: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    category: Optional[str] = None
    merchant: Optional[str] = None
    direction: Optional[str] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    account_id: Optional[str] = None
    sort_by: Optional[str] = "occurred_at"
    sort_order: Optional[str] = "desc"
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class TransactionSummary(BaseModel):
    total_count: int
    total_income: Decimal
    total_expense: Decimal
    total_investment: Decimal
    net_cash_flow: Decimal
