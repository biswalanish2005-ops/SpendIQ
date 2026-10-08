#!/usr/bin/env bash
# ==============================================================================
# SpendIQ Backend Development Startup Script
# ==============================================================================
set -e

echo "=== [SpendIQ] Starting Development Server ==="
export ENVIRONMENT=development

# Run migrations
python scripts/migrate.py head

# Start with hot-reload
exec uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
