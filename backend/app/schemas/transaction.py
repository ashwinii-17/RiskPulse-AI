from datetime import datetime

from pydantic import BaseModel, Field


class NewTransactionRequest(BaseModel):
    transaction_id: str | None = Field(
        default=None,
        max_length=100,
    )

    transaction_amount: float = Field(
        gt=0,
    )

    TransactionDT: int = Field(
        ge=0,
    )

    card1: int = Field(
        ge=0,
    )

    card2: float = Field(
        ge=0,
    )

    card3: float = Field(
        ge=0,
    )

    card5: float = Field(
        ge=0,
    )

    addr1: float = Field(
        ge=0,
    )

    addr2: float = Field(
        ge=0,
    )

    dist1: float = Field(
        ge=0,
    )

    dist2: float = Field(
        ge=0,
    )


class TransactionResponse(BaseModel):
    id: int
    transaction_id: str
    transaction_amount: float
    fraud_probability: float
    risk_score: float
    risk_level: str
    source_row_id: int | None = None
    actual_is_fraud: bool | None = None
    model_features: dict
    created_at: datetime

    model_config = {"from_attributes": True}