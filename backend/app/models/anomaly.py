import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, Float, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Anomaly(Base):
    __tablename__ = "anomalies"

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
    transaction_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    anomaly_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,  # Normalized 0.0 to 1.0 outlier score
    )
    expected_value: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,  # Baseline mean/median for this category
    )
    deviation_factor: Mapped[float] = mapped_column(
        Float,
        nullable=False,  # Multiplier relative to standard deviation
    )
    explanation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="DETECTED",  # DETECTED, ACKNOWLEDGED, DISMISSED
        index=True,
    )
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="anomalies")
    transaction = relationship("Transaction", back_populates="anomaly")
