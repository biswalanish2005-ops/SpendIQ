import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="SPENDING_ACCELERATION",  # SPENDING_ACCELERATION, SAVINGS_OPPORTUNITY, FORECAST_DIVERGENCE, ANOMALY_CLUSTER
    )
    headline: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    explanation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    metric_ref: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="",  # Explicit reference linking to verified metric or series
    )
    confidence_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.95,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="ACTIVE",  # ACTIVE, DISMISSED, ACTED_UPON
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="insights")
