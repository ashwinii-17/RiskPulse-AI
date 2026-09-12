from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.db.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    source_row_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )

    actual_is_fraud: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
        index=True,
    )

    model_features: Mapped[dict] = mapped_column(
            JSON,
            nullable=False,
    )

    transaction_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    transaction_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    fraud_probability: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    risk_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    risk_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )