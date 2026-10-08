import logging
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.core.config import settings
from app.api.router import api_router
from app.db.session import engine, init_db

# ─── Structured Logging Configuration ────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)-30s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
logger = logging.getLogger("spendiq.main")

# ─── Application Startup Time ────────────────────────────────────────────────
_startup_time = time.time()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SpendIQ API starting up — environment=%s", settings.ENVIRONMENT)
    await init_db()
    logger.info("Database initialized successfully")
    yield
    logger.info("SpendIQ API shutting down")
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SpendIQ AI Financial Intelligence Platform API",
    version="1.0.0",
    lifespan=lifespan,
    # Disable automatic docs exposure in production
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

# ─── CORS Middleware (Tightened) ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-ID"],
    expose_headers=["X-Request-ID", "X-Process-Time"],
)

# ─── Request Tracing Middleware ───────────────────────────────────────────────
@app.middleware("http")
async def request_tracing_middleware(request: Request, call_next):
    """Attach a unique request ID and measure processing time for every request."""
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    start_time = time.perf_counter()

    # Attach to request state for use in handlers
    request.state.request_id = request_id

    response = await call_next(request)

    process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time_ms}ms"

    # Log slow requests (> 1 second) as warnings
    if process_time_ms > 1000:
        logger.warning(
            "Slow request detected | request_id=%s method=%s path=%s duration=%sms",
            request_id, request.method, request.url.path, process_time_ms,
        )

    return response

# ─── Global Exception Handler ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(
        "Unhandled exception | request_id=%s path=%s error=%s",
        request_id, request.url.path, type(exc).__name__,
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal server error occurred",
            # Never expose raw stack traces to users; only detail in dev
            "detail": str(exc) if settings.ENVIRONMENT == "development" else "An unexpected error occurred.",
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

# ─── Health Check Endpoints ───────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """System health check endpoint verifying database connectivity and uptime."""
    db_status = "connected"
    db_error: str | None = None
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "unreachable"
        db_error = str(e) if settings.ENVIRONMENT == "development" else "database unreachable"

    uptime_seconds = round(time.time() - _startup_time, 1)

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "database_error": db_error,
        "uptime_seconds": uptime_seconds,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

# ─── API Router ───────────────────────────────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
