from uuid import uuid4

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.api.dependencies import get_current_user
from backend.app.db.session import get_db
from backend.app.risk_engine.new_transaction_predictor_v2 import (
    new_transaction_predictor_v2,
)
from backend.app.risk_engine.ood_validator import ood_validator
from backend.app.risk_engine.predictor import fraud_predictor
from backend.app.schemas.risk import (
    RiskPredictionRequest,
    RiskPredictionResponse,
)
from backend.app.schemas.transaction import (
    NewTransactionRequest,
    TransactionResponse,
)
from backend.app.services.transaction_service import TransactionService


router = APIRouter(
    prefix="/risk",
    tags=["Risk Analysis"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/predict",
    response_model=RiskPredictionResponse,
)
def predict_risk(
    request: RiskPredictionRequest,
    db: Session = Depends(get_db),
) -> RiskPredictionResponse:
    """
    Predict fraud risk using the model that matches
    the supplied feature contract.

    432 features -> Original XGBoost model
    10 features  -> New Transaction V2 XGBoost model
    """

    try:
        feature_count = len(request.features)

        if feature_count == 432:
            features = pd.DataFrame(
                [request.features]
            )

            probability = fraud_predictor.predict_probability(
                features
            )

            risk_score = round(
                probability * 100,
                2,
            )

            risk_level = fraud_predictor.classify_risk(
                risk_score
            )

            ood_result = None

        elif feature_count == 10:
            probability = (
                new_transaction_predictor_v2.predict_probability(
                    request.features
                )
            )

            risk_score = round(
                probability * 100,
                2,
            )

            risk_level = (
                new_transaction_predictor_v2.classify_risk(
                    risk_score
                )
            )

            ood_result = ood_validator.validate(
                request.features
            )

            print("OOD RESULT:", ood_result)

        else:
            raise ValueError(
                "Unsupported transaction feature count: "
                f"{feature_count}. Expected 10 or 432."
            )

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
            fraud_probability=round(
                probability,
                6,
            ),
            risk_score=risk_score,
            risk_level=risk_level,
        )

    except ValueError as exc:
        db.rollback()

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


@router.post(
    "/new-transaction",
    response_model=RiskPredictionResponse,
)
def analyze_new_transaction(
    request: NewTransactionRequest,
    db: Session = Depends(get_db),
) -> RiskPredictionResponse:
    """Analyze fraud risk for a newly submitted transaction."""

    try:
        transaction_data = request.model_dump(
            exclude_none=True
        )

        transaction_id = transaction_data.pop(
            "transaction_id",
            None,
        )

        transaction_amount = transaction_data.pop(
            "transaction_amount",
        )

        transaction_data["TransactionAmt"] = (
            transaction_amount
        )

        missing_features = [
            feature
            for feature in new_transaction_predictor_v2.FEATURES
            if feature not in transaction_data
        ]

        if missing_features:
            raise ValueError(
                "Missing required transaction features: "
                + ", ".join(missing_features)
            )

        probability = (
            new_transaction_predictor_v2.predict_probability(
                transaction_data
            )
        )

        risk_score = round(
            probability * 100,
            2,
        )

        risk_level = (
            new_transaction_predictor_v2.classify_risk(
                risk_score
            )
        )

        # Validate whether the supplied model features
        # are inside the observed training-data range.
        ood_result = ood_validator.validate(
            transaction_data
        )

        print("OOD RESULT:", ood_result)

        transaction_id = (
            transaction_id
            or f"NEW-{uuid4().hex[:12].upper()}"
        )

        TransactionService.create_transaction(
            db=db,
            transaction_id=transaction_id,
            transaction_amount=transaction_amount,
            fraud_probability=probability,
            risk_score=risk_score,
            risk_level=risk_level,
            model_features=transaction_data,
            source_row_id=None,
            actual_is_fraud=None,
        )

        return RiskPredictionResponse(
            transaction_id=transaction_id,
            fraud_probability=round(
                probability,
                6,
            ),
            risk_score=risk_score,
            risk_level=risk_level,
        )

    except ValueError as exc:
        db.rollback()

        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="New transaction risk analysis failed.",
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
    """Return the available RiskPulse model contracts."""

    original_features = fraud_predictor.model.feature_names

    if original_features is None:
        raise HTTPException(
            status_code=500,
            detail="Original model feature names are unavailable.",
        )

    return {
        "models": {
            "historical": {
                "model": "XGBoost",
                "feature_count": len(original_features),
                "features": original_features,
            },
            "new_transaction": {
                "model": "XGBoost V2",
                "feature_count": len(
                    new_transaction_predictor_v2.FEATURES
                ),
                "features": new_transaction_predictor_v2.FEATURES,
            },
        }
    }