from __future__ import annotations

from typing import Any

import pandas as pd

from backend.ml.model.model_loader import model_loader


class FeatureBuilder:
    """
    Builds a model-compatible 432-feature vector from a complete,
    already-preprocessed transaction payload.

    This component does not perform preprocessing, encoding, imputation,
    or feature engineering.
    """

    def __init__(self) -> None:
        self.model = model_loader.load()

    def get_expected_features(self) -> list[str]:
        features = self.model.feature_names

        if not features:
            raise ValueError("Model feature names are unavailable.")

        return list(features)

    def build(
        self,
        transaction_features: dict[str, Any],
    ) -> pd.DataFrame:
        expected_features = self.get_expected_features()

        if len(expected_features) != 432:
            raise ValueError(
                f"Expected 432 model features, "
                f"but model exposes {len(expected_features)}."
            )

        missing_features = [
            feature
            for feature in expected_features
            if feature not in transaction_features
        ]

        if missing_features:
            raise ValueError(
                "Historical 432-feature scoring requires the complete "
                "preprocessed feature contract. Missing features: "
                + ", ".join(missing_features[:20])
                + ("..." if len(missing_features) > 20 else "")
            )

        feature_values = {
            feature: transaction_features[feature]
            for feature in expected_features
        }

        model_input = pd.DataFrame(
            [feature_values],
            columns=expected_features,
        )

        if model_input.shape != (1, 432):
            raise ValueError(
                f"Invalid model input shape: {model_input.shape}. "
                "Expected (1, 432)."
            )

        if list(model_input.columns) != expected_features:
            raise ValueError(
                "Model feature order does not match "
                "the expected 432-feature contract."
            )

        return model_input


feature_builder = FeatureBuilder()