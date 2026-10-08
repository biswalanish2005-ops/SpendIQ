from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    group: str = Field("Discretionary", description="Fixed, Discretionary, Income, Savings & Investments")
    icon: str = "Tag"

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: str
    user_id: Optional[str] = None
    is_system: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
