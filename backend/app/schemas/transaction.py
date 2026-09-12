from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    source_row_id: int | None

    transaction_id: str

    transaction_amount: float

    fraud_probability: float = Field(
        ge=0.0,
        le=1.0,
    )

    risk_score: float = Field(
        ge=0.0,
        le=100.0,
    )

    risk_level: str

    actual_is_fraud: bool | None

    model_features: dict[str, object]

    created_at: datetime