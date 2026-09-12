from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd

from backend.app.db.session import get_db
from backend.app.risk_engine.predictor import fraud_predictor
from backend.app.schemas.risk import (
    RiskPredictionRequest,
    RiskPredictionResponse,
)

from backend.app.schemas.transaction import TransactionResponse
from backend.app.services.transaction_service import TransactionService


router = APIRouter(
    prefix="/risk",
    tags=["Risk Analysis"],
)


@router.post(
    "/predict",
    response_model=RiskPredictionResponse,
)
def predict_risk(
    request: RiskPredictionRequest,
    db: Session = Depends(get_db),
) -> RiskPredictionResponse:
    """Predict fraud risk and persist the result."""

    try:
        features = pd.DataFrame([request.features])

        probability = fraud_predictor.predict_probability(features)
        risk_score = round(probability * 100, 2)
        risk_level = fraud_predictor.classify_risk(risk_score)

        if request.persist_result:
            TransactionService.create_transaction(
                db=db,
                transaction_id=request.transaction_id,
                transaction_amount=request.transaction_amount,
                fraud_probability=probability,
                risk_score=risk_score,
                risk_level=risk_level,
                model_features=request.features,
            )

        return RiskPredictionResponse(
            transaction_id=request.transaction_id,
            fraud_probability=round(probability, 6),
            risk_score=risk_score,
            risk_level=risk_level,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Risk prediction failed.",
        ) from exc

@router.get(
    "/transactions",
    response_model=list[TransactionResponse],
)
def get_transactions(
    db: Session = Depends(get_db),
) -> list[TransactionResponse]:
    """Return recently analyzed transactions."""

    return TransactionService.get_recent_transactions(db)

@router.get("/summary")
def get_risk_summary(
    db: Session = Depends(get_db),
) -> dict[str, int]:
    """Return aggregate risk metrics for the dashboard."""

    return TransactionService.get_risk_summary(db)

@router.get("/model-schema")
def get_model_schema() -> dict[str, object]:
    """Return the feature contract required by the fraud model."""

    expected_features = fraud_predictor.model.feature_names

    if expected_features is None:
        raise HTTPException(
            status_code=500,
            detail="Model feature names are unavailable.",
        )

    return {
        "model": "XGBoost",
        "feature_count": len(expected_features),
        "features": expected_features,
    }