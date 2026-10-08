#!/usr/bin/env bash
# ==============================================================================
# SpendIQ Backend Production Startup Script
# ==============================================================================
set -e

echo "=== [SpendIQ] Starting Production Backend ==="
echo "Environment: ${ENVIRONMENT:-production}"
echo "Host: ${HOST:-0.0.0.0}:${PORT:-8000}"
echo "Workers: ${WORKERS:-2}"

# 1. Run database migrations to ensure schema is up-to-date
echo "=== [SpendIQ] Running Database Migrations ==="
python scripts/migrate.py head

# 2. Launch FastAPI using Uvicorn with multiple workers
echo "=== [SpendIQ] Launching Uvicorn Server ==="
exec uvicorn app.main:app \
    --host "${HOST:-0.0.0.0}" \
    --port "${PORT:-8000}" \
    --workers "${WORKERS:-2}" \
    --lifespan on \
    --access-log \
    --proxy-headers \
    --forwarded-allow-ips "*"
