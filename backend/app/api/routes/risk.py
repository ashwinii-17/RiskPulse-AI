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


# =========================================================
# RISK PREDICTION
# =========================================================

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

            probability = (
                fraud_predictor.predict_probability(
                    features
                )
            )

            risk_score = round(
                probability * 100,
                2,
            )

            risk_level = (
                fraud_predictor.classify_risk(
                    risk_score
                )
            )

            ood_result = None

        elif feature_count == 10:

            probability = (
                new_transaction_predictor_v2
                .predict_probability(
                    request.features
                )
            )

            risk_score = round(
                probability * 100,
                2,
            )

            risk_level = (
                new_transaction_predictor_v2
                .classify_risk(
                    risk_score
                )
            )

            ood_result = ood_validator.validate(
                request.features
            )

            print(
                "OOD RESULT:",
                ood_result,
            )

        else:

            raise ValueError(
                "Unsupported transaction feature count: "
                f"{feature_count}. Expected 10 or 432."
            )

        if request.persist_result:

            TransactionService.create_transaction(
                db=db,
                transaction_id=request.transaction_id,
                transaction_amount=(
                    request.transaction_amount
                ),
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

        message = str(exc)

        if "already exists" in message.lower():

            raise HTTPException(
                status_code=409,
                detail=message,
            ) from exc

        raise HTTPException(
            status_code=422,
            detail=message,
        ) from exc

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Risk prediction failed.",
        ) from exc


# =========================================================
# NEW TRANSACTION ANALYSIS
# =========================================================

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

        transaction_id = (
            transaction_data.pop(
                "transaction_id",
                None,
            )
        )

        transaction_amount = (
            transaction_data.pop(
                "transaction_amount",
            )
        )

        transaction_data["TransactionAmt"] = (
            transaction_amount
        )

        missing_features = [
            feature
            for feature in (
                new_transaction_predictor_v2.FEATURES
            )
            if feature not in transaction_data
        ]

        if missing_features:

            raise ValueError(
                "Missing required transaction features: "
                + ", ".join(missing_features)
            )

        probability = (
            new_transaction_predictor_v2
            .predict_probability(
                transaction_data
            )
        )

        risk_score = round(
            probability * 100,
            2,
        )

        risk_level = (
            new_transaction_predictor_v2
            .classify_risk(
                risk_score
            )
        )

        ood_result = ood_validator.validate(
            transaction_data
        )

        print(
            "OOD RESULT:",
            ood_result,
        )

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
            detail=(
                "New transaction risk analysis failed."
            ),
        ) from exc


# =========================================================
# TRANSACTIONS
# =========================================================

@router.get(
    "/transactions",
    response_model=dict,
)
def get_transactions(
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    Return paginated transaction history.

    The database handles pagination so the frontend
    never loads all 529k transactions at once.
    """

    transactions, total = (
        TransactionService.get_transactions_paginated(
            db=db,
            page=page,
            limit=limit,
        )
    )

    safe_limit = min(
        max(limit, 1),
        100,
    )

    return {
        "transactions": [
            TransactionResponse.model_validate(
                transaction
            )
            for transaction in transactions
        ],
        "total": int(total),
        "page": page,
        "limit": safe_limit,
        "total_pages": (
            (total + safe_limit - 1)
            // safe_limit
            if total
            else 0
        ),
    }


# =========================================================
# TRANSACTION SEARCH
# =========================================================

@router.get(
    "/transactions/search",
    response_model=list[TransactionResponse],
)
def search_transactions(
    query: str,
    limit: int = 50,
    db: Session = Depends(get_db),
) -> list[TransactionResponse]:

    transactions = (
        TransactionService.search_transactions(
            db=db,
            query=query,
            limit=limit,
        )
    )

    return [
        TransactionResponse.model_validate(
            transaction
        )
        for transaction in transactions
    ]


# =========================================================
# RISK ALERTS
# =========================================================

@router.get(
    "/transactions/alerts",
    response_model=dict,
)
def get_risk_alerts(
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    Return paginated HIGH and CRITICAL transactions.
    """

    transactions, total = (
        TransactionService.get_risk_alerts(
            db=db,
            page=page,
            limit=limit,
        )
    )

    safe_limit = min(
        max(limit, 1),
        100,
    )

    return {
        "transactions": [
            TransactionResponse.model_validate(
                transaction
            )
            for transaction in transactions
        ],
        "total": int(total),
        "page": page,
        "limit": safe_limit,
        "total_pages": (
            (total + safe_limit - 1)
            // safe_limit
            if total
            else 0
        ),
    }


# =========================================================
# RISK SUMMARY
# =========================================================

@router.get("/summary")
def get_risk_summary(
    db: Session = Depends(get_db),
) -> dict[str, int]:
    """Return aggregate risk metrics for the dashboard."""

    return TransactionService.get_risk_summary(
        db
    )


# =========================================================
# RISK STATISTICS / ANALYTICS
# =========================================================

@router.get("/analytics")
def get_risk_analytics(
    db: Session = Depends(get_db),
) -> dict:
    """
    Return database-wide statistics for
    the Risk Statistics page.
    """

    return TransactionService.get_risk_analytics(
        db
    )


# =========================================================
# RISK SCORE DISTRIBUTION
# =========================================================

@router.get("/risk-score-distribution")
def get_risk_score_distribution(
    db: Session = Depends(get_db),
) -> list[dict]:
    """
    Return database-wide risk score distribution.
    """

    return TransactionService.get_risk_score_distribution(
        db
    )


# =========================================================
# AVERAGE RISK SCORE
# =========================================================

@router.get("/average-risk-score")
def get_average_risk_score(
    db: Session = Depends(get_db),
) -> dict[str, float]:
    """
    Return the average risk score across
    all transactions.
    """

    average = (
        TransactionService.get_average_risk_score(
            db
        )
    )

    return {
        "average_risk_score": round(
            average,
            2,
        )
    }


# =========================================================
# MODEL SCHEMA
# =========================================================

@router.get("/model-schema")
def get_model_schema() -> dict[str, object]:
    """Return the available RiskPulse model contracts."""

    original_features = (
        fraud_predictor.model.feature_names
    )

    if original_features is None:

        raise HTTPException(
            status_code=500,
            detail=(
                "Original model feature names "
                "are unavailable."
            ),
        )

    return {
        "models": {

            "historical": {
                "model": "XGBoost",
                "feature_count": len(
                    original_features
                ),
                "features": original_features,
            },

            "new_transaction": {
                "model": "XGBoost V2",
                "feature_count": len(
                    new_transaction_predictor_v2.FEATURES
                ),
                "features": (
                    new_transaction_predictor_v2.FEATURES
                ),
            },

        }
    }