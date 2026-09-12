from __future__ import annotations

import pandas as pd
import xgboost as xgb

from backend.app.core.config import settings
from backend.ml.model.model_loader import model_loader


class FraudPredictor:
    """Runs fraud-risk inference using the trained RiskPulse XGBoost model."""

    def __init__(self) -> None:
        self.model = model_loader.load()

    def predict_probability(self, features: pd.DataFrame) -> float:
        """
        Predict the probability that a transaction is fraudulent.

        The input DataFrame must contain exactly the features expected
        by the trained XGBoost model.
        """

        expected_features = self.model.feature_names

        if expected_features is None:
            raise ValueError("Model feature names are unavailable.")

        if len(expected_features) != settings.model_feature_count:
            raise ValueError(
                "Model feature count does not match RiskPulse configuration."
            )

        missing_features = [
            feature
            for feature in expected_features
            if feature not in features.columns
        ]

        if missing_features:
            raise ValueError(
                f"Missing model features: {missing_features[:10]}"
            )

        extra_features = [
            feature
            for feature in features.columns
            if feature not in expected_features
        ]

        if extra_features:
            raise ValueError(
                f"Unexpected input features: {extra_features[:10]}"
            )

        ordered_features = features[expected_features]

        matrix = xgb.DMatrix(
            ordered_features,
            feature_names=expected_features,
        )

        probability = float(self.model.predict(matrix)[0])

        return probability

    def predict_risk_score(self, features: pd.DataFrame) -> float:
        """Convert fraud probability into a 0–100 RiskPulse score."""

        probability = self.predict_probability(features)

        return round(probability * 100, 2)

    def classify_risk(self, risk_score: float) -> str:
        """Classify a 0–100 risk score into a RiskPulse risk level."""

        if risk_score >= settings.model_risk_threshold_high:
            return "CRITICAL"

        if risk_score >= settings.model_risk_threshold_medium:
            return "HIGH"

        if risk_score >= settings.model_risk_threshold_low:
            return "MEDIUM"

        return "LOW"


fraud_predictor = FraudPredictor()