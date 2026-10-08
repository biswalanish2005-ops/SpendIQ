"""
SpendIQ Database Migration Runner
Executes Alembic migrations programmatically against the configured DATABASE_URL.
Supports PostgreSQL (asyncpg) and SQLite (aiosqlite).
"""
import os
import sys
import logging
from pathlib import Path
from alembic.config import Config
from alembic import command

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-8s | %(message)s")
logger = logging.getLogger("spendiq.migrate")

def run_migrations(revision: str = "head"):
    # Ensure current directory is in sys.path
    backend_dir = Path(__file__).resolve().parent.parent
    os.chdir(backend_dir)
    sys.path.insert(0, str(backend_dir))

    from app.core.config import settings
    logger.info("Starting database migration to revision: %s", revision)
    logger.info("Target database: %s", settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL)

    ini_path = backend_dir / "alembic.ini"
    alembic_cfg = Config(str(ini_path))
    alembic_cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

    try:
        command.upgrade(alembic_cfg, revision)
        logger.info("Database migration completed successfully!")
    except Exception as exc:
        logger.error("Database migration failed: %s", exc, exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "head"
    run_migrations(target)
