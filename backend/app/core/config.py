from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    app_name: str = "RiskPulse AI"
    app_version: str = "1.0.0"
    environment: str = "development"

    database_url: str = (
        "postgresql://postgres:postgres@localhost:5432/riskpulse"
    )

    redis_url: str = "redis://localhost:6379/0"

    model_path: str = str(
        PROJECT_ROOT / "backend" / "ml" / "artifacts"
        / "riskpulse_xgboost_model.json"
    )

    model_feature_count: int = 432

    model_risk_threshold_low: float = 30.0
    model_risk_threshold_medium: float = 60.0
    model_risk_threshold_high: float = 80.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()