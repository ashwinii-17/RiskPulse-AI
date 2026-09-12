from pathlib import Path
import json
import pandas as pd

from backend.app.db.session import SessionLocal
from backend.app.models.transaction import Transaction
from backend.app.risk_engine.predictor import fraud_predictor


DATASET_PATH = Path(
    r"C:\Users\ashwi\OneDrive\Desktop\RiskPulse\data\final_fraud_dataset.csv"
)

IMPORT_LIMIT = 100


def main() -> None:
    print("Loading real IEEE-CIS dataset...")

    df = pd.read_csv(
        DATASET_PATH,
        nrows=IMPORT_LIMIT,
    )

    if "isFraud" not in df.columns:
        raise ValueError("Dataset must contain 'isFraud'.")

    feature_df = df.drop(columns=["isFraud"])

    expected_features = fraud_predictor.model.feature_names

    if expected_features is None:
        raise ValueError("Model feature names are unavailable.")

    if feature_df.shape[1] != len(expected_features):
        raise ValueError(
            f"Feature mismatch: dataset has {feature_df.shape[1]}, "
            f"model expects {len(expected_features)}."
        )

    print(f"Loaded rows: {len(df)}")
    print(f"Model features: {feature_df.shape[1]}")

    probabilities = [
        fraud_predictor.predict_probability(
            feature_df.iloc[[row_index]]
        )
        for row_index in range(len(feature_df))
    ]
    db = SessionLocal()

    try:
        records = []

        for row_index, (index, row) in enumerate(df.iterrows()):

            probability = float(probabilities[row_index])
            risk_score = round(probability * 100, 2)
            risk_level = fraud_predictor.classify_risk(risk_score)

            model_features = json.loads(
                row.drop(labels=["isFraud"]).to_json()
            )
            transaction = Transaction(
                source_row_id=int(index),
                actual_is_fraud=bool(row["isFraud"]),
                model_features=model_features,
                transaction_id=f"IEEE-{int(index):06d}",
                transaction_amount=float(row["TransactionAmt"]),
                fraud_probability=probability,
                risk_score=risk_score,
                risk_level=risk_level,
            )

            records.append(transaction)

        db.add_all(records)
        db.commit()

        print(f"Imported transactions: {len(records)}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()