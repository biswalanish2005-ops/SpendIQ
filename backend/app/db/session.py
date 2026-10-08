from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from typing import AsyncGenerator
from app.core.config import settings
from app.db.base import Base

# Build engine kwargs based on database type
_engine_kwargs: dict = {
    "echo": False,
    "future": True,
}

_connect_args: dict = {}

if "sqlite" in settings.DATABASE_URL:
    # SQLite-specific: disable thread-safety check for async usage
    _connect_args["check_same_thread"] = False
else:
    # PostgreSQL / production: enable connection health checks and recycling
    _engine_kwargs["pool_pre_ping"] = True
    _engine_kwargs["pool_recycle"] = settings.DB_POOL_RECYCLE
    _engine_kwargs["pool_timeout"] = settings.DB_POOL_TIMEOUT

engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args=_connect_args,
    **_engine_kwargs,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    """Initializes tables for local development/testing."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
