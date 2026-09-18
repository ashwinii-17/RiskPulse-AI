import math
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from backend.app.models.transaction import Transaction

def make_json_safe(features: dict) -> dict:
    """
    Convert NaN and infinite numeric values to None so the
    feature dictionary can be stored as valid PostgreSQL JSON.
    """

    safe_features = {}

    for key, value in features.items():
        if isinstance(value, float):
            if math.isnan(value) or math.isinf(value):
                safe_features[key] = None
            else:
                safe_features[key] = value
        else:
            safe_features[key] = value

    return safe_features

class TransactionService:
    """Handles persistence and retrieval of RiskPulse transactions."""

    @staticmethod
    def create_transaction(
        db: Session,
        transaction_id: str,
        transaction_amount: float,
        fraud_probability: float,
        risk_score: float,
        risk_level: str,
        model_features: dict,
        source_row_id: int | None = None,
        actual_is_fraud: bool | None = None,
    ) -> Transaction:
        transaction = Transaction(
            source_row_id=source_row_id,
            actual_is_fraud=actual_is_fraud,
            model_features=make_json_safe(model_features),
            transaction_id=transaction_id,
            transaction_amount=transaction_amount,
            fraud_probability=fraud_probability,
            risk_score=risk_score,
            risk_level=risk_level,
        )

        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        return transaction
        transaction = Transaction(
            transaction_id=transaction_id,
            transaction_amount=transaction_amount,
            fraud_probability=fraud_probability,
            risk_score=risk_score,
            risk_level=risk_level,
        )

        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        return transaction

    @staticmethod
    def get_recent_transactions(db: Session) -> list[Transaction]:
        statement = (
            select(Transaction)
            .order_by(desc(Transaction.created_at))
        )
        return list(db.scalars(statement).all())

    
    @staticmethod
    def get_risk_summary(db: Session) -> dict[str, int]:
        """Return aggregate transaction counts by risk level."""

        transactions = db.scalars(
            select(Transaction)
        ).all()

        summary = {
            "total_transactions": len(transactions),
            "critical_count": 0,
            "high_count": 0,
            "medium_count": 0,
            "low_count": 0,
        }

        for transaction in transactions:
            level = transaction.risk_level.upper()

            if level == "CRITICAL":
                summary["critical_count"] += 1
            elif level == "HIGH":
                summary["high_count"] += 1
            elif level == "MEDIUM":
                summary["medium_count"] += 1
            elif level == "LOW":
                summary["low_count"] += 1

        return summary