from pathlib import Path

import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATA_PATH = Path(
    r"C:\Users\ashwi\OneDrive\Desktop\RiskPulse\data\final_fraud_dataset.csv"
)

MODEL_PATH = (
    PROJECT_ROOT
    / "backend"
    / "ml"
    / "artifacts"
    / "new_transaction_xgboost_model.json"
)


# ---------------------------------------------------------
# FEATURES
# ---------------------------------------------------------

FEATURES = [
    "TransactionAmt",
    "TransactionDT",
    "ProductCD",
    "card1",
    "card2",
    "card3",
    "card5",
    "card6",
    "addr1",
    "addr2",
    "dist1",
    "dist2",
    "P_emaildomain",
    "R_emaildomain",
]

TARGET = "isFraud"


# ---------------------------------------------------------
# LOAD DATA
# ---------------------------------------------------------

print("Loading dataset...")

df = pd.read_csv(DATA_PATH, usecols=FEATURES + [TARGET])

print(f"Dataset shape: {df.shape}")


# ---------------------------------------------------------
# PREPARE DATA
# ---------------------------------------------------------

X = df[FEATURES].copy()
y = df[TARGET].astype(int)

# The processed dataset should already be numeric.
# Missing values, if present, are handled natively by XGBoost.
X = X.apply(pd.to_numeric, errors="coerce")

print(f"Features: {len(FEATURES)}")
print(f"Fraud cases: {y.sum()}")
print(f"Normal cases: {(y == 0).sum()}")


# ---------------------------------------------------------
# TRAIN / TEST SPLIT
# ---------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)


# ---------------------------------------------------------
# CLASS IMBALANCE
# ---------------------------------------------------------

negative = (y_train == 0).sum()
positive = (y_train == 1).sum()

scale_pos_weight = negative / positive

print(f"scale_pos_weight: {scale_pos_weight:.4f}")


# ---------------------------------------------------------
# TRAIN XGBOOST
# ---------------------------------------------------------

print("\nTraining new-transaction XGBoost model...")

model = xgb.XGBClassifier(
    n_estimators=400,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=scale_pos_weight,
    objective="binary:logistic",
    eval_metric="aucpr",
    tree_method="hist",
    random_state=42,
    n_jobs=-1,
)


model.fit(
    X_train,
    y_train,
)


# ---------------------------------------------------------
# EVALUATION
# ---------------------------------------------------------

print("\nEvaluating model...")

probabilities = model.predict_proba(X_test)[:, 1]
predictions = (probabilities >= 0.5).astype(int)

auc = roc_auc_score(y_test, probabilities)

print(f"\nROC-AUC: {auc:.4f}")

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        predictions,
        digits=4,
        zero_division=0,
    )
)


# ---------------------------------------------------------
# SAVE MODEL
# ---------------------------------------------------------

MODEL_PATH.parent.mkdir(
    parents=True,
    exist_ok=True,
)

model.get_booster().save_model(
    str(MODEL_PATH)
)

print("\nModel saved successfully:")
print(MODEL_PATH)


# ---------------------------------------------------------
# VERIFY MODEL
# ---------------------------------------------------------

loaded_model = xgb.Booster()

loaded_model.load_model(
    str(MODEL_PATH)
)

print("\nModel verification:")
print(f"Feature count: {len(loaded_model.feature_names)}")
print(f"First feature: {loaded_model.feature_names[0]}")
print(f"Last feature: {loaded_model.feature_names[-1]}")

assert len(loaded_model.feature_names) == len(FEATURES)
assert loaded_model.feature_names == FEATURES

print("\nMODEL VERIFICATION PASSED.")