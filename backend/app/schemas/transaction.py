from datetime import datetime

from pydantic import BaseModel, Field


class NewTransactionRequest(BaseModel):
    """
    Preprocessed transaction payload for the dedicated
    RiskPulse V2 new-transaction model.
    """

    transaction_id: str | None = Field(
        default=None,
        max_length=100,
    )

    transaction_amount: float = Field(
        gt=0,
        description="Transaction amount in INR.",
    )

    TransactionDT: int = Field(
        ge=0,
        description="Preprocessed transaction time value.",
    )

    card1: int = Field(
        ge=0,
        description="Preprocessed card identifier feature.",
    )

    card2: float = Field(
        ge=0,
        description="Preprocessed card attribute.",
    )

    card3: float = Field(
        ge=0,
        description="Preprocessed card attribute.",
    )

    card5: float = Field(
        ge=0,
        description="Preprocessed card attribute.",
    )

    addr1: float = Field(
        ge=0,
        description="Preprocessed billing/address feature.",
    )

    addr2: float = Field(
        ge=0,
        description="Preprocessed address-region feature.",
    )

    dist1: float = Field(
        ge=0,
        description="Preprocessed distance feature.",
    )

    dist2: float = Field(
        ge=0,
        description="Preprocessed distance feature.",
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