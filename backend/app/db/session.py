from collections.abc import Generator

from sqlalchemy.orm import Session, sessionmaker

from backend.app.db.database import engine


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def get_db() -> Generator[Session, None, None]:
    """Provide a database session for a request."""

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()