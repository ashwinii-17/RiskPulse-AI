from sqlalchemy import create_engine

from backend.app.core.config import settings
from backend.app.db.base import Base
from backend.app.models import Transaction


engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)