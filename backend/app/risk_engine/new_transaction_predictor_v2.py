from pathlib import Path

import pandas as pd
import xgboost as xgb


class NewTransactionPredictorV2:
    FEATURES = [
        "TransactionAmt",
        "TransactionDT",
        "card1",
        "card2",
        "card3",
        "card5",
        "addr1",
        "addr2",
        "dist1",
        "dist2",
    ]

    def __init__(self) -> None:
        project_root = Path(__file__).resolve().parents[3]

        model_path = (
            project_root
            / "backend"
            / "ml"
            / "artifacts"
            / "new_transaction_xgboost_model_v2.json"
        )

        if not model_path.exists():
            raise FileNotFoundError(
                f"New transaction V2 model not found: {model_path}"
            )

        self.model = xgb.Booster()
        self.model.load_model(str(model_path))

        if self.model.feature_names != self.FEATURES:
            raise ValueError(
                "V2 model feature contract does not match "
                "the application feature contract."
            )

    def predict_probability(
        self,
        transaction_features: dict[str, float],
    ) -> float:
        missing_features = [
            feature
            for feature in self.FEATURES
            if feature not in transaction_features
        ]

        if missing_features:
            raise ValueError(
                "Missing required transaction features: "
                + ", ".join(missing_features)
            )

        values = {
            feature: transaction_features[feature]
            for feature in self.FEATURES
        }

        dataframe = pd.DataFrame(
            [values],
            columns=self.FEATURES,
        )

        dataframe = dataframe.apply(
            pd.to_numeric,
            errors="raise",
        )

        prediction = self.model.predict(
            xgb.DMatrix(dataframe)
        )

        return float(prediction[0])

    @staticmethod
    def classify_risk(risk_score: float) -> str:
        if risk_score >= 75:
            return "CRITICAL"

        if risk_score >= 50:
            return "HIGH"

        if risk_score >= 25:
            return "MEDIUM"

        return "LOW"


new_transaction_predictor_v2 = NewTransactionPredictorV2()