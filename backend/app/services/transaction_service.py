from sqlalchemy import case, desc, func, select
from sqlalchemy.orm import Session

from backend.app.models.transaction import Transaction


def make_json_safe(features: dict) -> dict:
    """
    Convert NaN and infinite numeric values to None so the
    feature dictionary can be stored as valid PostgreSQL JSON.
    """

    import math

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

    @staticmethod
    def get_recent_transactions(
        db: Session,
        limit: int = 10,
    ) -> list[Transaction]:
        """
        Return only the most recent transactions.

        IMPORTANT:
        Never load the entire 529k-row transaction table
        for the dashboard.
        """

        statement = (
            select(Transaction)
            .order_by(
                desc(Transaction.created_at),
                desc(Transaction.id),
            )
            .limit(limit)
        )

        return list(
            db.scalars(statement).all()
        )

    @staticmethod
    def get_transactions_paginated(
        db: Session,
        page: int = 1,
        limit: int = 50,
    ) -> tuple[list[Transaction], int]:
        """
        Return one page of transactions and the total
        transaction count.

        The database performs pagination so all transactions
        are never loaded into Python at once.
        """

        if page < 1:
            page = 1

        if limit < 1:
            limit = 50

        if limit > 100:
            limit = 100

        offset = (page - 1) * limit

        statement = (
            select(Transaction)
            .order_by(
                desc(Transaction.created_at),
                desc(Transaction.id),
            )
            .offset(offset)
            .limit(limit)
        )

        transactions = list(
            db.scalars(statement).all()
        )

        total_statement = select(
            func.count(Transaction.id)
        )

        total = db.execute(
            total_statement
        ).scalar_one()

        return transactions, int(total)

    @staticmethod
    def search_transactions(
        db: Session,
        query: str,
        limit: int = 50,
    ) -> list[Transaction]:
        """
        Search transactions by transaction ID directly in PostgreSQL.

        This allows Risk Analysis to search the complete transaction
        history without loading all transactions into the browser.
        """

        query = query.strip()

        if not query:
            return []

        if limit < 1:
            limit = 50

        if limit > 100:
            limit = 100

        statement = (
            select(Transaction)
            .where(
                Transaction.transaction_id.ilike(
                    f"%{query}%"
                )
            )
            .order_by(
                desc(Transaction.created_at),
                desc(Transaction.id),
            )
            .limit(limit)
        )

        return list(
            db.scalars(statement).all()
        )

    @staticmethod
    def get_risk_alerts(
        db: Session,
        page: int = 1,
        limit: int = 50,
    ) -> tuple[list[Transaction], int]:
        """
        Return paginated HIGH and CRITICAL transactions.

        The database calculates the total alert count so the
        frontend does not need to load all high-risk transactions.
        """

        if page < 1:
            page = 1

        if limit < 1:
            limit = 50

        if limit > 100:
            limit = 100

        offset = (page - 1) * limit

        alert_filter = (
            (Transaction.risk_level == "HIGH")
            | (Transaction.risk_level == "CRITICAL")
        )

        statement = (
            select(Transaction)
            .where(alert_filter)
            .order_by(
                desc(Transaction.risk_score),
                desc(Transaction.created_at),
                desc(Transaction.id),
            )
            .offset(offset)
            .limit(limit)
        )

        transactions = list(
            db.scalars(statement).all()
        )

        total_statement = select(
            func.count(Transaction.id)
        ).where(alert_filter)

        total = db.execute(
            total_statement
        ).scalar_one()

        return transactions, int(total)

    @staticmethod
    def get_average_risk_score(
        db: Session,
    ) -> float:
        """
        Calculate the average risk score across all transactions
        directly in PostgreSQL.
        """

        statement = select(
            func.avg(Transaction.risk_score)
        )

        average = db.execute(statement).scalar()

        return float(average or 0)

    @staticmethod
    def get_risk_summary(
        db: Session,
    ) -> dict[str, int]:
        """
        Calculate dashboard risk counts directly inside PostgreSQL.

        This avoids loading hundreds of thousands of rows and their
        large model_features JSON objects into Python.
        """

        statement = select(
            func.count(Transaction.id).label(
                "total_transactions"
            ),

            func.sum(
                case(
                    (
                        Transaction.risk_level == "CRITICAL",
                        1,
                    ),
                    else_=0,
                )
            ).label("critical_count"),

            func.sum(
                case(
                    (
                        Transaction.risk_level == "HIGH",
                        1,
                    ),
                    else_=0,
                )
            ).label("high_count"),

            func.sum(
                case(
                    (
                        Transaction.risk_level == "MEDIUM",
                        1,
                    ),
                    else_=0,
                )
            ).label("medium_count"),

            func.sum(
                case(
                    (
                        Transaction.risk_level == "LOW",
                        1,
                    ),
                    else_=0,
                )
            ).label("low_count"),
        ).select_from(Transaction)

        result = db.execute(
            statement
        ).mappings().one()

        return {
            "total_transactions": int(
                result["total_transactions"] or 0
            ),
            "critical_count": int(
                result["critical_count"] or 0
            ),
            "high_count": int(
                result["high_count"] or 0
            ),
            "medium_count": int(
                result["medium_count"] or 0
            ),
            "low_count": int(
                result["low_count"] or 0
            ),
        }

    @staticmethod
    def get_risk_analytics(
        db: Session,
    ) -> dict:
        """
        Return database-wide statistics for Risk Analytics.
        """

        risk_distribution_statement = (
            select(
                Transaction.risk_level,
                func.count(Transaction.id),
            )
            .group_by(Transaction.risk_level)
        )

        risk_distribution = {
            risk_level: int(count)
            for risk_level, count in db.execute(
                risk_distribution_statement
            ).all()
        }

        fraud_statement = select(
            func.count(Transaction.id)
        ).where(
            Transaction.actual_is_fraud.is_(True)
        )

        fraud_count = db.execute(
            fraud_statement
        ).scalar_one()

        total_statement = select(
            func.count(Transaction.id)
        )

        total_count = db.execute(
            total_statement
        ).scalar_one()

        legitimate_count = total_count - fraud_count

        average_risk = db.execute(
            select(func.avg(Transaction.risk_score))
        ).scalar()

        return {
            "total_transactions": int(total_count),
            "fraud_count": int(fraud_count),
            "legitimate_count": int(legitimate_count),
            "average_risk_score": round(
                float(average_risk or 0),
                2,
            ),
            "risk_distribution": {
                "CRITICAL": risk_distribution.get("CRITICAL", 0),
                "HIGH": risk_distribution.get("HIGH", 0),
                "MEDIUM": risk_distribution.get("MEDIUM", 0),
                "LOW": risk_distribution.get("LOW", 0),
            },
        }

    @staticmethod
    def get_risk_score_distribution(
        db: Session,
    ) -> list[dict]:
        """
        Return database-wide risk score distribution.
        """

        score_bucket = case(
            (Transaction.risk_score < 10, "0-10"),
            (Transaction.risk_score < 20, "10-20"),
            (Transaction.risk_score < 30, "20-30"),
            (Transaction.risk_score < 40, "30-40"),
            (Transaction.risk_score < 50, "40-50"),
            (Transaction.risk_score < 60, "50-60"),
            (Transaction.risk_score < 70, "60-70"),
            (Transaction.risk_score < 80, "70-80"),
            (Transaction.risk_score < 90, "80-90"),
            else_="90-100",
        )

        statement = (
            select(
                score_bucket.label("score_range"),
                func.count(Transaction.id).label("count"),
            )
            .group_by(score_bucket)
        )

        rows = db.execute(statement).all()

        order = [
            "0-10",
            "10-20",
            "20-30",
            "30-40",
            "40-50",
            "50-60",
            "60-70",
            "70-80",
            "80-90",
            "90-100",
        ]

        counts = {
            score_range: int(count)
            for score_range, count in rows
        }

        return [
            {
                "score_range": score_range,
                "count": counts.get(score_range, 0),
            }
            for score_range in order
        ]