from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class ImportPreviewRow(BaseModel):
    row_index: int
    occurred_at: Optional[datetime] = None
    amount: Optional[Decimal] = None
    currency: str = "USD"
    direction: str = "EXPENSE"
    category_name: str = "Uncategorized"
    merchant_name: str = "Unknown Merchant"
    description: Optional[str] = ""
    is_duplicate: bool = False
    duplicate_reason: Optional[str] = None
    validation_error: Optional[str] = None
    raw_data: Dict[str, Any] = Field(default_factory=dict)


class ImportPreviewResponse(BaseModel):
    headers: List[str]
    suggested_mappings: Dict[str, str]
    preview_rows: List[ImportPreviewRow]
    total_rows: int
    valid_rows: int
    duplicate_rows: int
    error_rows: int


class ImportExecuteRow(BaseModel):
    occurred_at: datetime
    amount: Decimal = Field(..., gt=0)
    currency: str = "USD"
    direction: str = "EXPENSE"
    category_name: str = "Uncategorized"
    merchant_name: str = "Unknown Merchant"
    description: Optional[str] = ""
    is_duplicate: bool = False


class ImportExecuteRequest(BaseModel):
    filename: str = "statement.csv"
    account_id: Optional[str] = None
    skip_duplicates: bool = True
    rows: List[ImportExecuteRow]


class ImportJobOut(BaseModel):
    id: str
    user_id: str
    filename: str
    total_rows: int
    imported_rows: int
    duplicate_rows: int
    failed_rows: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
