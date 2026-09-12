from pathlib import Path

import xgboost as xgb

from backend.app.core.config import settings


class ModelLoader:
    """Loads and validates the RiskPulse fraud detection model."""

    def __init__(self, model_path: str | None = None) -> None:
        self.model_path = Path(model_path or settings.model_path)
        self._model: xgb.Booster | None = None

    def load(self) -> xgb.Booster:
        """Load the native XGBoost model once and return it."""

        if self._model is not None:
            return self._model

        if not self.model_path.exists():
            raise FileNotFoundError(
                f"RiskPulse model not found: {self.model_path}"
            )

        model = xgb.Booster()
        model.load_model(str(self.model_path))

        self._model = model
        self._validate_model()

        return self._model

    def _validate_model(self) -> None:
        """Validate the model contract required by RiskPulse."""

        if self._model is None:
            raise RuntimeError("Model failed to load.")

        feature_names = self._model.feature_names

        if feature_names is None:
            raise ValueError(
                "RiskPulse model does not contain feature names."
            )

        feature_count = len(feature_names)

        if feature_count != settings.model_feature_count:
            raise ValueError(
                "Model feature count mismatch: "
                f"expected {settings.model_feature_count}, "
                f"got {feature_count}."
            )


model_loader = ModelLoader()