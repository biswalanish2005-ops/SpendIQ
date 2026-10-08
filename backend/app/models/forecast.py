import uuid
from datetime import datetime, date, timezone
from decimal import Decimal
from sqlalchemy import String, Integer, DateTime, Date, Numeric, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class ForecastRun(Base):
    __tablename__ = "forecast_runs"

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
    target_metric: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="TOTAL_SPENDING",  # TOTAL_SPENDING, CATEGORY_SPENDING, SAVINGS_RATE
    )
    horizon_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=30,
    )
    model_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Holt-Winters",
    )
    model_version: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="1.0.0",
    )
    metrics_json: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="{}",  # stores MAPE, RMSE, fit parameters
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="forecast_runs")
    points = relationship("ForecastPoint", back_populates="run", cascade="all, delete-orphan")


class ForecastPoint(Base):
    __tablename__ = "forecast_points"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    run_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("forecast_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    period_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )
    predicted_value: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    lower_bound: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    upper_bound: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    run = relationship("ForecastRun", back_populates="points")
