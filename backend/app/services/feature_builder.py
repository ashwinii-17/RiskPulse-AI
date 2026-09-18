from __future__ import annotations

from typing import Any

import pandas as pd

from backend.ml.model.model_loader import model_loader


class FeatureBuilder:
    """
    Builds a model-compatible transaction feature vector.

    The model expects exactly 432 features in a fixed order.
    Analyst-provided values are inserted into their corresponding
    model features. Features not supplied by the analyst remain NaN
    and are handled by XGBoost's native missing-value support.
    """

    def __init__(self) -> None:
        self.model = model_loader.load()

    def get_expected_features(self) -> list[str]:
        """Return the exact feature names expected by the model."""

        features = self.model.feature_names

        if not features:
            raise ValueError(
                "Model feature names are unavailable."
            )

        return list(features)

    def build(
        self,
        transaction_features: dict[str, Any],
    ) -> pd.DataFrame:
        """
        Build one model input row using the analyst-provided fields.

        The resulting DataFrame always contains the exact 432 model
        features in the exact order expected by the XGBoost model.
        """

        expected_features = self.get_expected_features()

        if len(expected_features) != 432:
            raise ValueError(
                f"Expected 432 model features, "
                f"but model exposes {len(expected_features)}."
            )

        # Start with all model features as missing.
        feature_values = {
            feature: float("nan")
            for feature in expected_features
        }

        ignored_features: list[str] = []

        for feature, value in transaction_features.items():
            if value is None:
                continue

            if feature not in expected_features:
                ignored_features.append(feature)
                continue

            feature_values[feature] = value

        model_input = pd.DataFrame(
            [feature_values],
            columns=expected_features,
        )

        # Structural validation.
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