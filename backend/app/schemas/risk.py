from pydantic import BaseModel, Field


class RiskPredictionRequest(BaseModel):
    transaction_id: str = Field(
        min_length=1,
        max_length=100,
        description="Unique transaction identifier.",
    )

    transaction_amount: float = Field(
        gt=0,
        description="Transaction amount.",
    )

    features: dict[str, object] = Field(
        description="The 432 model features required for fraud prediction.",
    )
    persist_result: bool = Field(
        default=True,
        description="Whether to persist the prediction in the transaction database.",
    )

class RiskPredictionResponse(BaseModel):
    transaction_id: str
    fraud_probability: float = Field(
        ge=0.0,
        le=1.0,
    )
    risk_score: float = Field(
        ge=0.0,
        le=100.0,
    )
    risk_level: str