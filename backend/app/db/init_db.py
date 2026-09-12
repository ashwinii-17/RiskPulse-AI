from backend.app.db.base import Base
from backend.app.db.database import engine
from backend.app.models import Transaction


def init_database() -> None:
    """Create all RiskPulse database tables."""

    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_database()
    print("RiskPulse database tables created successfully.")