"""
database.py — SQLAlchemy database setup.
Uses SQLite by default (zero config, works on Windows with no extra installs).
Switch DATABASE_URL in .env to PostgreSQL for production.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Detect SQLite vs PostgreSQL
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# SQLite needs connect_args; PostgreSQL needs pool settings
if _is_sqlite:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},  # required for SQLite + FastAPI
    )
    # Enable WAL mode for better concurrent read performance in SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, _):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — provides a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """Create all tables if they don't exist."""
    try:
        # Must import all models so SQLAlchemy knows about them
        from app.models import asset_model, vulnerability_model, alert_model  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info(f"Database ready — {settings.DATABASE_URL.split('://')[0]}")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
