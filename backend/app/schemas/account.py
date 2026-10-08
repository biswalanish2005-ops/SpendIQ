from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict

class AccountBase(BaseModel):
    name: str = Field(..., max_length=100)
    type: str = Field("CHECKING", description="CHECKING, SAVINGS, CREDIT_CARD, INVESTMENT")
    institution_name: str = "Manual"
    currency: str = "USD"
    balance: Decimal = Decimal("0.00")

class AccountCreate(AccountBase):
    pass

class AccountOut(AccountBase):
    id: str
    user_id: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
