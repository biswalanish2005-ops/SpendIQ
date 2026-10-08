from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: Optional[str] = None
    data: T
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool
