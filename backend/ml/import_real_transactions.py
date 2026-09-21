"""
RiskPulse AI — Resume-Safe Real Dataset Import

Imports final_fraud_dataset.csv into PostgreSQL without deleting
previously imported rows.

Designed for low-RAM systems.

Features:
- Resumes from the highest source_row_id already in PostgreSQL.
- Uses Python's streaming csv module instead of pandas CSV parsing.
- Processes only a small batch at a time.
- Uses the existing 432-feature XGBoost model.
- Uses the existing RiskPulse risk thresholds.
- Preserves the original isFraud label.
- Stores all 432 model features.
"""

from __future__ import annotations

from pathlib import Path
import csv
import gc
import math
import sys
import traceback

import pandas as pd
import xgboost as xgb
from sqlalchemy import text


# ============================================================================
# PROJECT ROOT
# ============================================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# ============================================================================
# RISKPULSE IMPORTS
# ============================================================================

from backend.app.db.session import SessionLocal
from backend.app.models.transaction import Transaction
from backend.app.risk_engine.predictor import fraud_predictor


# ============================================================================
# DATASET
# ============================================================================

DATASET_PATH = (
    Path(r"C:\Users\ashwi\OneDrive\Desktop\RiskPulse")
    / "data"
    / "final_fraud_dataset.csv"
)


# ============================================================================
# SETTINGS
# ============================================================================

# Keep these SMALL because the laptop has 8 GB RAM.
CSV_BATCH_SIZE = 100
DB_BATCH_SIZE = 25

EXPECTED_TOTAL_ROWS = 529_311
EXPECTED_FRAUD_ROWS = 18_390
EXPECTED_NONFRAUD_ROWS = 510_921


# ============================================================================
# HELPERS
# ============================================================================

def safe_float(value, default: float = 0.0) -> float:
    try:
        number = float(value)

        if math.isnan(number) or math.isinf(number):
            return default

        return number

    except (TypeError, ValueError):
        return default


def safe_bool(value) -> bool:
    try:
        return bool(int(float(value)))
    except (TypeError, ValueError):
        return str(value).strip().lower() in {
            "true",
            "yes",
            "1",
        }


def normalize_json_value(value):
    """
    Convert CSV values into JSON-safe Python values.
    """

    if value is None:
        return 0.0

    value = str(value).strip()

    if value == "":
        return 0.0

    try:
        number = float(value)

        if math.isnan(number) or math.isinf(number):
            return 0.0

        if number.is_integer():
            return int(number)

        return number

    except (TypeError, ValueError):
        return value


# ============================================================================
# MODEL CONTRACT
# ============================================================================

def get_expected_model_features() -> list[str]:

    expected_features = fraud_predictor.model.feature_names

    if expected_features is None:
        raise RuntimeError(
            "Model feature names are unavailable."
        )

    expected_features = list(expected_features)

    if len(expected_features) != 432:
        raise RuntimeError(
            "Unexpected model feature count: "
            f"expected 432, got {len(expected_features)}"
        )

    return expected_features


# ============================================================================
# DATABASE RESUME POSITION
# ============================================================================

def get_resume_position(db) -> int:
    """
    Return the next dataset row that needs to be imported.

    source_row_id is zero-based.

    Example:
        max source_row_id = 164999
        next row = 165000
    """

    result = db.execute(
        text(
            "SELECT MAX(source_row_id) "
            "FROM transactions"
        )
    ).scalar()

    if result is None:
        return 0

    return int(result) + 1


# ============================================================================
# MODEL PREDICTION
# ============================================================================

def predict_batch(
    rows: list[dict[str, str]],
    expected_features: list[str],
):

    model_data = {}

    for feature in expected_features:

        values = []

        for row in rows:

            value = row.get(feature, 0)

            try:
                number = float(value)

                if math.isnan(number) or math.isinf(number):
                    number = 0.0

            except (TypeError, ValueError):
                number = 0.0

            values.append(number)

        model_data[feature] = values

    X = pd.DataFrame(
        model_data,
        columns=expected_features,
    )

    matrix = xgb.DMatrix(
        X,
        feature_names=expected_features,
    )

    probabilities = fraud_predictor.model.predict(matrix)

    del matrix
    del X
    del model_data

    return probabilities


# ============================================================================
# MAIN
# ============================================================================

def main():

    print()
    print("=" * 75)
    print("RISKPULSE — RESUME-SAFE DATASET IMPORT")
    print("=" * 75)
    print()

    print(f"Dataset: {DATASET_PATH}")
    print("Model features: 432")
    print(f"CSV batch size: {CSV_BATCH_SIZE}")
    print(f"Database batch size: {DB_BATCH_SIZE}")
    print()

    # ------------------------------------------------------------------------
    # Dataset
    # ------------------------------------------------------------------------

    if not DATASET_PATH.exists():

        raise FileNotFoundError(
            f"Dataset not found:\n{DATASET_PATH}"
        )

    # ------------------------------------------------------------------------
    # Model
    # ------------------------------------------------------------------------

    expected_features = get_expected_model_features()

    print("✓ 432-feature model contract verified")

    # ------------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------------

    db = SessionLocal()

    try:

        # ====================================================================
        # FIND RESUME POSITION
        # ====================================================================

        start_row = get_resume_position(db)

        existing_count = db.query(Transaction).count()

        print()
        print(
            f"Existing database rows: {existing_count:,}"
        )

        print(
            f"Next dataset row to process: {start_row:,}"
        )

        if start_row >= EXPECTED_TOTAL_ROWS:

            print()
            print(
                "✓ All dataset rows are already present."
            )

            return

        remaining = (
            EXPECTED_TOTAL_ROWS
            - start_row
        )

        print(
            f"Remaining dataset rows: {remaining:,}"
        )

        print()

        # ====================================================================
        # STREAM CSV
        # ====================================================================

        with open(
            DATASET_PATH,
            "r",
            encoding="utf-8",
            newline="",
        ) as csv_file:

            reader = csv.DictReader(csv_file)

            if reader.fieldnames is None:

                raise RuntimeError(
                    "CSV header could not be read."
                )

            csv_columns = set(reader.fieldnames)

            missing_features = [
                feature
                for feature in expected_features
                if feature not in csv_columns
            ]

            if missing_features:

                raise RuntimeError(
                    "Dataset is missing required model features: "
                    f"{missing_features[:20]}"
                )

            if "isFraud" not in csv_columns:

                raise RuntimeError(
                    "Dataset does not contain isFraud."
                )

            if "TransactionAmt" not in csv_columns:

                raise RuntimeError(
                    "Dataset does not contain TransactionAmt."
                )

            # ================================================================
            # STREAM TO RESUME POSITION
            # ================================================================

            print(
                f"Scanning CSV until row {start_row:,}..."
            )

            for _ in range(start_row):

                next(reader, None)

            print(
                "✓ Resume position reached"
            )

            # ================================================================
            # IMPORT COUNTERS
            # ================================================================

            total_imported_this_run = 0

            actual_fraud_this_run = 0

            risk_counts = {
                "LOW": 0,
                "MEDIUM": 0,
                "HIGH": 0,
                "CRITICAL": 0,
            }

            # ================================================================
            # PROCESS STREAMING BATCHES
            # ================================================================

            while True:

                rows = []

                for _ in range(CSV_BATCH_SIZE):

                    try:
                        row = next(reader)
                    except StopIteration:
                        break

                    rows.append(row)

                if not rows:
                    break

                # ============================================================
                # PREDICT
                # ============================================================

                probabilities = predict_batch(
                    rows,
                    expected_features,
                )

                pending_records = []

                # ============================================================
                # BUILD DB RECORDS
                # ============================================================

                for local_index, row in enumerate(rows):

                    dataset_row_id = (
                        start_row
                        + total_imported_this_run
                    )

                    probability = safe_float(
                        probabilities[local_index]
                    )

                    probability = max(
                        0.0,
                        min(1.0, probability),
                    )

                    risk_score = round(
                        probability * 100.0,
                        2,
                    )

                    risk_level = (
                        fraud_predictor.classify_risk(
                            risk_score
                        )
                    )

                    actual_is_fraud = safe_bool(
                        row["isFraud"]
                    )

                    model_features = {
                        feature: normalize_json_value(
                            row.get(feature)
                        )
                        for feature in expected_features
                    }

                    record = {
                        "source_row_id": dataset_row_id,
                        "actual_is_fraud": actual_is_fraud,
                        "model_features": model_features,
                        "transaction_id": (
                            f"IEEE-REAL-{dataset_row_id:06d}"
                        ),
                        "transaction_amount": safe_float(
                            row["TransactionAmt"]
                        ),
                        "fraud_probability": probability,
                        "risk_score": risk_score,
                        "risk_level": risk_level,
                    }

                    pending_records.append(record)

                    total_imported_this_run += 1

                    if actual_is_fraud:
                        actual_fraud_this_run += 1

                    risk_counts[risk_level] += 1

                    # ========================================================
                    # SMALL DB COMMIT
                    # ========================================================

                    if len(pending_records) >= DB_BATCH_SIZE:

                        db.bulk_insert_mappings(
                            Transaction,
                            pending_records,
                        )

                        db.commit()

                        pending_records.clear()

                # ============================================================
                # REMAINING RECORDS
                # ============================================================

                if pending_records:

                    db.bulk_insert_mappings(
                        Transaction,
                        pending_records,
                    )

                    db.commit()

                    pending_records.clear()

                # ============================================================
                # MEMORY CLEANUP
                # ============================================================

                del probabilities
                del rows

                gc.collect()

                # ============================================================
                # PROGRESS
                # ============================================================

                current_position = (
                    start_row
                    + total_imported_this_run
                )

                print(
                    f"Imported this run: "
                    f"{total_imported_this_run:,} | "
                    f"Dataset position: "
                    f"{current_position:,}/"
                    f"{EXPECTED_TOTAL_ROWS:,}"
                )

                print(
                    f"LOW={risk_counts['LOW']:,} | "
                    f"MEDIUM={risk_counts['MEDIUM']:,} | "
                    f"HIGH={risk_counts['HIGH']:,} | "
                    f"CRITICAL={risk_counts['CRITICAL']:,}"
                )

        # ====================================================================
        # FINAL DATABASE COUNT
        # ====================================================================

        final_count = db.query(Transaction).count()

        print()
        print("=" * 75)
        print("IMPORT RUN FINISHED")
        print("=" * 75)

        print(
            f"Rows imported this run: "
            f"{total_imported_this_run:,}"
        )

        print(
            f"Total database rows: "
            f"{final_count:,}"
        )

        print(
            f"Expected total rows: "
            f"{EXPECTED_TOTAL_ROWS:,}"
        )

        if final_count == EXPECTED_TOTAL_ROWS:

            print()
            print(
                "✓ ALL 529,311 DATASET ROWS ARE NOW IN POSTGRESQL"
            )

        else:

            print()
            print(
                "✓ Import stopped before completion."
            )

            print(
                "You can safely run this script again."
            )

    except KeyboardInterrupt:

        db.rollback()

        print()
        print("Import interrupted.")
        print(
            "Already committed rows are safe."
        )

        raise

    except Exception:

        db.rollback()

        print()
        print("=" * 75)
        print("IMPORT FAILED")
        print("=" * 75)

        traceback.print_exc()

        raise

    finally:

        db.close()


if __name__ == "__main__":
    main()