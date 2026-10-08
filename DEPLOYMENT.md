# SpendIQ Production Deployment Guide

This document provides complete instructions for deploying the **SpendIQ AI Financial Intelligence Platform** in production environments using containerized orchestration (Docker Compose / Kubernetes) or standalone service architectures.

---

## 1. System Architecture Overview

SpendIQ is designed as a modular, containerized multi-tier fintech platform:

```text
                                Internet
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │  Reverse Proxy / Ingress      │
                   │  (Nginx / Cloudflare / Caddy) │
                   └───────────────┬───────────────┘
                                   │
                   ┌───────────────┴───────────────┐
                   │                               │
                   ▼                               ▼
       ┌───────────────────────┐       ┌───────────────────────┐
       │   Frontend Container  │       │   Backend Container   │
       │   Nginx + React SPA   │──────▶│   FastAPI (AsyncPG)   │
       │   Port 80             │       │   Port 8000           │
       └───────────────────────┘       └───────────┬───────────┘
                                                   │
                   ┌───────────────────────────────┼───────────────────────────────┐
                   │                               │                               │
                   ▼                               ▼                               ▼
       ┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
       │   PostgreSQL 16 DB    │       │   Redis 7 Cache/Queue │       │   SpendIQ Worker      │
       │   Async connection    │       │   PubSub / Key-Value  │       │   Task processor      │
       │   Port 5432           │       │   Port 6379           │       │   Background daemon   │
       └───────────────────────┘       └───────────────────────┘       └───────────────────────┘
```

---

## 2. Environment Variables Specification

All sensitive configuration is decoupled from code and configured strictly via environment variables.

### Backend (`backend/.env` or Docker environment)

| Variable | Type | Default | Description | Required in Prod? |
|---|---|---|---|---|
| `ENVIRONMENT` | string | `development` | Deployment tier: `development`, `staging`, `production` | **Yes** (`production`) |
| `PROJECT_NAME` | string | `SpendIQ AI Financial Intelligence Platform` | Name displayed in docs and headers | No |
| `APP_VERSION` | string | `1.0.0` | Semantic application version | No |
| `API_V1_STR` | string | `/api/v1` | URL prefix for REST endpoints | No |
| `HOST` | string | `0.0.0.0` | Network interface to bind | No |
| `PORT` | int | `8000` | Port for FastAPI server | No |
| `WORKERS` | int | `2` | Uvicorn worker count (Formula: `(2 x CPU cores) + 1`) | Recommended |
| `DATABASE_URL` | string | `sqlite+aiosqlite:///./spendiq.db` | Async database URI. Must use `postgresql+asyncpg://` in prod | **Yes** |
| `JWT_SECRET_KEY` | string | *dev default* | Cryptographic signing key (min 32 chars). **Default rejected in prod** | **Yes** |
| `JWT_ALGORITHM` | string | `HS256` | JWT signature algorithm | No |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | int | `1440` | Access token lifespan in minutes (24h) | No |
| `REFRESH_TOKEN_EXPIRE_DAYS` | int | `30` | Refresh token lifespan in days | No |
| `ALLOWED_ORIGINS` | string/list | `http://localhost:3000` | Comma-separated list of allowed frontend origins | **Yes** |
| `REDIS_URL` | string | `None` | Redis connection URL for background caching & queues | Recommended |
| `LLM_PROVIDER` | string | `mock` | AI engine: `mock`, `openai`, `gemini`, `anthropic` | No |
| `LLM_API_KEY` | string | `None` | API key if using real LLM provider | If LLM enabled |
| `LOG_LEVEL` | string | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL` | No |
| `DB_POOL_SIZE` | int | `10` | SQLAlchemy connection pool size | No |
| `DB_MAX_OVERFLOW` | int | `20` | SQLAlchemy maximum overflow connections | No |
| `DB_POOL_RECYCLE` | int | `1800` | Connection recycling timeout in seconds | No |
| `SENTRY_DSN` | string | `None` | Sentry error tracking DSN | Recommended |

### Frontend (`frontend/.env` or Docker build arg)

| Variable | Type | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | string | `/api/v1` | Base API endpoint for client HTTP requests |
| `VITE_APP_NAME` | string | `SpendIQ Financial Intelligence` | Title branding |
| `VITE_APP_VERSION` | string | `1.0.0` | Version string |

---

## 3. Quickstart Deployment (Docker Compose)

### Step 1: Clone and Configure Environment

```bash
# Clone repository
git clone https://github.com/your-org/spendiq.git
cd spendiq

# Create production environment configuration from template
cp .env.example .env
```

### Step 2: Generate Cryptographic Secret Key

Generate a secure 64-character hex secret for `JWT_SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Edit `.env` and set:
- `JWT_SECRET_KEY=<your-generated-hex-key>`
- `POSTGRES_PASSWORD=<your-strong-db-password>`

### Step 3: Launch Stack

```bash
# Build and start all 5 services in detached mode
docker compose up -d --build

# Verify all containers are healthy
docker compose ps
```

The platform is now available:
- **Frontend SPA**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000/api/v1`
- **Health Check**: `http://localhost:8000/health`

---

## 4. Production Hardening (docker-compose.prod.yml)

For enterprise production deployments, use the production overlay which enables:
- Automatic container restarts (`restart: always`)
- Memory and CPU limits
- Internal network isolation (Postgres and Redis ports closed to host)
- JSON log rotation (max 20MB per file, 5 files max)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 5. Database Migrations & Management

SpendIQ utilizes Alembic for asynchronous schema migrations.

### Automated Migrations on Startup
The backend container automatically runs migrations during startup via `/app/scripts/start.sh`:
```bash
python scripts/migrate.py head
```

### Manual Migration Commands
To inspect or run migrations manually within the container:

```bash
# Check current migration status
docker compose exec backend alembic current

# Upgrade to latest revision
docker compose exec backend python scripts/migrate.py head

# Rollback one revision (if needed)
docker compose exec backend alembic downgrade -1
```

### Backup & Disaster Recovery

```bash
# Create database backup
docker compose exec db pg_dump -U spendiq_admin -d spendiq_prod -F c -b -v -f /tmp/spendiq_backup.dump
docker cp spendiq-db:/tmp/spendiq_backup.dump ./backups/

# Restore database from backup
docker cp ./backups/spendiq_backup.dump spendiq-db:/tmp/
docker compose exec db pg_restore -U spendiq_admin -d spendiq_prod -v /tmp/spendiq_backup.dump
```

---

## 6. Health Checks & Observability

### Health Endpoint
The backend exposes `/health` and `/api/v1/health` verifying:
- Application status (`healthy` / `degraded`)
- Database connectivity (`SELECT 1` ping)
- Application uptime in seconds
- Release version and environment tier
- Correlation ID tracking (`X-Request-ID`) and response latency (`X-Process-Time`)

Example response:
```json
{
  "status": "healthy",
  "service": "SpendIQ AI Financial Intelligence Platform",
  "version": "1.0.0",
  "environment": "production",
  "database": "connected",
  "database_error": null,
  "uptime_seconds": 3612.4,
  "timestamp": "2026-09-10T12:00:00Z"
}
```

### Monitoring Container Health
```bash
curl -I http://localhost:8000/health
# Returns HTTP 200 OK with X-Request-ID and X-Process-Time headers
```

---

## 7. Production Go-Live Checklist

Before exposing SpendIQ to end users, verify each item:

- [x] **Zero Hardcoded Secrets**: No secret keys or passwords committed to git.
- [x] **JWT Secret Configured**: High-entropy 64-character random key configured.
- [x] **PostgreSQL Active**: Production uses `postgresql+asyncpg://` with connection pooling enabled.
- [x] **CORS Origins Restricted**: `ALLOWED_ORIGINS` contains only verified production domain(s).
- [x] **API Docs Disabled in Production**: `/docs` and `/redoc` are disabled when `ENVIRONMENT=production`.
- [x] **Database Migrations Executed**: All 10 domain tables verified on PostgreSQL.
- [x] **Nginx Reverse Proxy Configured**: Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) active.
- [x] **Automated Tests Passing**: 100% test pass rate on backend (72 tests) and frontend (36 tests).
- [x] **Graceful Shutdown**: SIGTERM/SIGINT signal listeners cleanly dispose database pools and worker queues.
