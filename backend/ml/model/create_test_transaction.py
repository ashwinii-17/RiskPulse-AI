from pathlib import Path
import argparse
import json

import pandas as pd

from backend.app.risk_engine.predictor import fraud_predictor


PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATASET_PATH = (
    PROJECT_ROOT.parent
    / "RiskPulse"
    / "data"
    / "final_fraud_dataset.csv"
)

OUTPUT_PATH = (
    PROJECT_ROOT
    / "backend"
    / "ml"
    / "artifacts"
    / "test_transaction.json"
)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create a RiskPulse test transaction from the preprocessed dataset."
    )

    parser.add_argument(
        "--row",
        type=int,
        required=True,
        help="Zero-based dataset row to use.",
    )

    args = parser.parse_args()

    if args.row < 0:
        raise ValueError("Row number cannot be negative.")

    print("Loading preprocessed IEEE-CIS dataset...")

    dataset = pd.read_csv(DATASET_PATH)

    if args.row >= len(dataset):
        raise ValueError(
            f"Row {args.row} does not exist. "
            f"Dataset contains {len(dataset)} rows."
        )

    expected_features = fraud_predictor.model.feature_names

    if expected_features is None:
        raise RuntimeError(
            "Model feature names are unavailable."
        )

    if len(expected_features) != 432:
        raise RuntimeError(
            f"Expected 432 model features, "
            f"found {len(expected_features)}."
        )

    row = dataset.iloc[args.row]

    features = row.drop(labels=["isFraud"]).to_dict()

    missing_features = [
        feature
        for feature in expected_features
        if feature not in features
    ]

    if missing_features:
        raise RuntimeError(
            f"Missing model features: {missing_features[:10]}"
        )

    features = {
        feature: features[feature]
        for feature in expected_features
    }

    transaction = {
        "TransactionAmt": float(features["TransactionAmt"]),
        **features,
    }

    OUTPUT_PATH.write_text(
        json.dumps(
            transaction,
            indent=2,
            allow_nan=False,
        ),
        encoding="utf-8",
    )

    print()
    print(f"Dataset rows: {len(dataset)}")
    print(f"Selected row: {args.row}")
    print(f"Model features: {len(features)}")
    print(f"Transaction amount: ₹{features['TransactionAmt']}")
    print()
    print(f"Created: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()