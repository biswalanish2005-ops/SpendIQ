# SpendIQ — AI Financial Intelligence Platform
# Project Audit & Baseline Report (Phase 0)

**Date:** September 8, 2026  
**Status:** Completed & Verified  
**Author:** Antigravity AI Engineering  
**Scope:** Phase 0 — Project Audit, Technical Baseline, Architecture Mapping, and Migration Strategy

---

## 1. Executive Summary

SpendIQ is an enterprise-grade, dark-themed personal financial intelligence platform designed to move far beyond standard expense tracking and CRUD dashboards. Its core architectural and UX paradigm is:

$$\text{Data} \longrightarrow \text{Visualization} \longrightarrow \text{Analysis} \longrightarrow \text{Prediction} \longrightarrow \text{AI Explanation}$$

The platform answers five fundamental financial questions at every level of the user experience:
1. **What happened?** (High-density actual transactions and clear historical charts)
2. **Why it happened?** (Deterministic category, merchant, and month-over-month contribution drivers)
3. **Whether it is improving or worsening?** (Contextual semantic status indicators rather than superficial color direction)
4. **What is likely to happen next?** (Machine learning forecasting with actual vs. forecast visual distinction and prediction intervals)
5. **What does the AI recommend?** (Strictly grounded AI financial insights referencing verified metrics)

This audit establishes the baseline before initializing Phase 1 code.

---

## 2. Repository & Environmental Inspection

### 2.1 File System Audit
The repository was initiated with exhaustive documentation specifications:
- `01_PRD.md` — Product Requirements Document (866 lines)
- `02_SRS.md` — Software Requirements Specification (960 lines)
- `03_BACKEND_IMPLEMENTATION.md` — Backend Implementation Specification (1009 lines)
- `04_USER_WORKFLOW.md` — User Workflow & Experience Blueprint (826 lines)
- `05_UI_UX_SPECIFICATION.md` — UI/UX Design System & Visualization Spec (1080 lines)
- `AI_FINANCIAL_INTELLIGENCE_PHASE_IMPLEMENTATION_README.md` — 20-Phase Implementation Roadmap (3021 lines)
- `README.md` — Project Overview & Technology Stack

### 2.2 Host Environment & Toolchains
Diagnostics executed on the host system confirmed:
- **Operating System:** Windows (Shell: PowerShell)
- **Python Version:** `Python 3.13.14` (Verified)
- **Node.js Version:** `v24.13.1` (Verified)
- **npm Version:** `11.8.0` (Verified)
- **Git Version:** `2.53.0.windows.3` (Verified)
- **Docker / PostgreSQL Service:** Not running in local PATH; handled via resilient dual-mode architecture (SQLite+aiosqlite local default, PostgreSQL production target).

### 2.3 Baseline Code State
- **Pre-existing Code:** Greenfield / documentation-first state. No legacy code, technical debt, or ungrounded mock implementations exist in the repository.
- **Baseline Test Suite Status:** 0 legacy suites. Clean slate for establishing 100% compliant test suites in Vitest / React Testing Library and Pytest.
- **Preservation Directives:** All 7 core Markdown specification documents must be preserved as immutable sources of truth.

---

## 3. Architecture Blueprint

SpendIQ employs a clean, decoupled modular monolith architecture with explicit boundaries separating presentation, API routing, deterministic analytics, ML inference, and grounded AI synthesis.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    SPENDIQ PRESENTATION LAYER (React 18 / TS)           │
│                                                                         │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐  │
│  │   Navigation Rail     │  │   Top Navigation & Global Context Bar  │  │
│  │  - Overview           │  │   - Time Range Selector (1M/3M/6M/YTD) │  │
│  │  - Analytics          │  │   - Account Filter                     │  │
│  │  - Transactions       │  │   - Anomaly Alert Badge                │  │
│  │  - Predictions        │  │   - Grounded AI Assistant Drawer       │  │
│  │  - Savings            │  └────────────────────────────────────────┘  │
│  │  - Investments        │  ┌────────────────────────────────────────┐  │
│  │  - AI Insights        │  │   Visual Analytics & Storytelling      │  │
│  │  - Anomalies          │  │   - Actual (Solid) vs Forecast (Dashed)│  │
│  │  - Import / Settings  │  │   - Semantic Trend Cards (Improving)   │  │
│  └───────────────────────┘  └────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / REST / JSON
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 SPENDIQ API & SERVICE LAYER (FastAPI)                   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  FastAPI Routing Engine                                           │  │
│  │  /api/v1/auth | /api/v1/transactions | /api/v1/analytics          │  │
│  │  /api/v1/predictions | /api/v1/anomalies | /api/v1/insights       │  │
│  └──────────────────┬─────────────────────────────┬──────────────────┘  │
│                     │                             │                     │
│         ┌───────────▼────────────┐    ┌───────────▼───────────┐         │
│         │ Deterministic Engine   │    │ ML & Anomaly Pipeline │         │
│         │ - Cash Flow Metrics    │    │ - Time-Series Forecast│         │
│         │ - MoM Variances        │    │ - Prediction Intervals│         │
│         │ - Category Breakdown   │    │ - Isolation Forest    │         │
│         │ - Semantic Status Calc │    │ - Deviation Scoring   │         │
│         └───────────┬────────────┘    └───────────┬───────────┘         │
│                     │                             │                     │
│                     └──────────────┬──────────────┘                     │
│                                    ▼                                    │
│                     ┌─────────────────────────────┐                     │
│                     │ Grounded AI Synthesis Engine│                     │
│                     │ - Rule-Grounded Validation  │                     │
│                     │ - Strict Context Injection  │                     │
│                     │ - Zero Hallucinated Values  │                     │
│                     └──────────────┬──────────────┘                     │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     PERSISTENCE & DATA PIPELINE                         │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  SQLAlchemy 2.0 Async ORM                                         │  │
│  │  - Users, Transactions, ImportJobs, ForecastRuns, Anomalies       │  │
│  │  - Exact Decimal/Numeric Currency Handling                        │  │
│  │  - SQLite (Local Dev) / PostgreSQL (Staging & Production)         │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. UI/UX Design System Inventory

The application UI strictly adheres to `05_UI_UX_SPECIFICATION.md`:

### 4.1 Base Color Tokens
| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `background` | `#0B0F14` | Primary viewport backdrop |
| `surface` | `#111720` | Secondary backdrops & side navigation |
| `card` | `#151C25` | Primary content panels & metric cards |
| `cardElevated` | `#19222D` | Modals, active dropdowns, elevated states |
| `border` | `#26313D` | Structural dividers & card boundaries |
| `textPrimary` | `#F1F5F9` | Primary typography & headers |
| `textSecondary`| `#94A3B8` | Descriptive labels & timestamps |
| `textMuted` | `#64748B` | Subtle metadata & inactive labels |

### 4.2 Semantic Financial Color System
Raw directional movement is strictly decoupled from color. The financial meaning is evaluated before assigning semantic styles:

| Financial Event | Semantic Status | Color Token | Visual Indicator |
| :--- | :--- | :--- | :--- |
| Spending +15% | `CONCERNING` | `#EF4444` (Negative) | ↑ Concerning |
| Spending -10% | `IMPROVING` | `#22C55E` (Positive) | ↓ Improving |
| Savings +12% | `IMPROVING` | `#22C55E` (Positive) | ↑ Improving |
| Savings -8% | `CONCERNING` | `#EF4444` (Negative) | ↓ Concerning |
| Income +5% | `IMPROVING` | `#22C55E` (Positive) | ↑ Improving |
| Metric unchanged | `STABLE` | `#3B82F6` (Neutral) | → Stable |
| Anomalous transaction | `ATTENTION_REQUIRED` | `#F59E0B` (Warning) | ⚠ Flagged |
| AI Guidance / Insight | `INFORMATIONAL` | `#06B6D4` (Cyan) | ✦ Insight |

### 4.3 Recharts Visualization Guidelines
- **Actual Historic Data:** Solid stroke (`#3B82F6` or `#F1F5F9`), opacity 1.0.
- **Forecast Predictions:** Dashed stroke (`strokeDasharray="4 4"`), cyan (`#06B6D4`) with explicit "Forecast" badge.
- **Prediction Intervals:** Shaded area (`fill="#06B6D4"`, `fillOpacity={0.12}`) bounded by upper and lower confidence intervals.
- **Historical Average Line:** Distinct horizontal reference line with subtle muted label.
- **Tooltip Styling:** Dark elevated background (`#19222D`), border (`#26313D`), tabular numerals, and explicit delta tags.

---

## 5. API Inventory (Target Contract Specifications)

All endpoints conform to `/api/v1` namespace and require JWT Bearer authorization unless noted:

### 5.1 Authentication & User Management
- `POST /api/v1/auth/register` — Create user account & initialize default settings
- `POST /api/v1/auth/login` — Authenticate credentials & issue access + refresh JWTs
- `POST /api/v1/auth/refresh` — Issue renewed access token
- `POST /api/v1/auth/logout` — Invalidate session tokens
- `GET /api/v1/auth/me` — Retrieve active authenticated user profile

### 5.2 Transaction Management & Ingestion
- `GET /api/v1/transactions` — Filtered & paginated transaction search (category, merchant, date, amount range)
- `POST /api/v1/transactions` — Create single transaction record
- `GET /api/v1/transactions/{id}` — Retrieve specific transaction details
- `PATCH /api/v1/transactions/{id}` — Update category, tags, or description
- `DELETE /api/v1/transactions/{id}` — Soft delete / archive transaction
- `POST /api/v1/transactions/import/upload` — Upload CSV for validation, column mapping, and row preview
- `POST /api/v1/transactions/import/confirm` — Commit validated CSV rows with deduplication

### 5.3 Deterministic Analytics Engine
- `GET /api/v1/analytics/overview` — High-level cash flow KPIs (Income, Spending, Savings Rate, Net Cash Flow, MoM status)
- `GET /api/v1/analytics/spending/trend` — Daily / weekly / monthly time-series spending aggregates
- `GET /api/v1/analytics/spending/categories` — Hierarchical category breakdown and MoM variances
- `GET /api/v1/analytics/savings` — Savings trajectory, rate changes, and consistency metrics
- `GET /api/v1/analytics/investments` — Contribution cadence and income allocation percentage

### 5.4 Machine Learning Predictions & Anomalies
- `GET /api/v1/predictions/spending` — 30/60/90-day projected spending with confidence bounds and model metadata
- `GET /api/v1/predictions/drivers` — Primary feature weights and historical indicators influencing forecast
- `GET /api/v1/anomalies` — Flagged transactions with deviation scores, expected ranges, and explainability factors
- `POST /api/v1/anomalies/{id}/resolve` — User feedback acknowledging or dismissing anomaly

### 5.5 Grounded AI Insights & Assistant
- `GET /api/v1/insights` — Rule-grounded AI insights tied to specific verified metrics and charts
- `POST /api/v1/insights/chat` — Conversational financial assistant restricted to user domain context

---

## 6. Database Schema Inventory

Persistence models are built using SQLAlchemy 2.0 async declarative patterns with exact monetary precision:

1. **`User`**: `id` (UUID), `email`, `hashed_password`, `full_name`, `currency` (default USD), `created_at`, `updated_at`.
2. **`Transaction`**: `id` (UUID), `user_id` (FK), `occurred_at` (timestamptz), `amount` (Numeric 12,2), `currency`, `direction` (INCOME/EXPENSE/INVESTMENT), `category`, `merchant_name`, `description`, `external_id`, `created_at`.
3. **`ImportJob`**: `id` (UUID), `user_id` (FK), `filename`, `total_rows`, `imported_rows`, `duplicate_rows`, `status`, `created_at`.
4. **`ForecastRun`**: `id` (UUID), `user_id` (FK), `target_metric`, `horizon_days`, `model_name`, `model_version`, `created_at`.
5. **`ForecastPoint`**: `id` (UUID), `run_id` (FK), `period_date`, `predicted_value`, `lower_bound`, `upper_bound`.
6. **`Anomaly`**: `id` (UUID), `transaction_id` (FK), `user_id` (FK), `anomaly_score`, `expected_value`, `deviation_factor`, `status`, `detected_at`.
7. **`AIInsight`**: `id` (UUID), `user_id` (FK), `category`, `headline`, `explanation`, `metric_ref`, `confidence_score`, `status`, `created_at`.

---

## 7. Migration & Phased Execution Roadmap

Implementation proceeds sequentially through the defined 20 phases:

| Phase | Description | Key Focus |
| :---: | :--- | :--- |
| **0** | **Project Audit & Baseline** | **Completed — Specs analyzed, environment audited, baseline documented** |
| **1** | **Architecture, Design System & Foundation** | Vite + React + TS + Tailwind tokens + Recharts primitives + Shell layout |
| **2** | **Database & Domain Model** | SQLAlchemy models, migrations, async session management, Decimal money |
| **3** | **Backend Core API** | FastAPI routing, JWT authentication, transaction CRUD, pagination |
| **4** | **Deterministic Analytics Engine** | Cash flow, MoM comparisons, category drivers, semantic calculation |
| **5** | **Financial Overview Dashboard** | Primary narrative spending chart, KPI metric cards, recent highlights |
| **6** | **Advanced Analytics Workspace** | Category drill-downs, merchant analytics, time range filters |
| **7** | **ML Forecasting Engine** | Time-series forecasting models, horizon projection, prediction intervals |
| **8** | **Anomaly Detection Engine** | Statistical & Isolation Forest outlier detection, deviation factors |
| **9** | **Prediction Center** | Actual vs Forecast charts, scenario analysis, forecast drivers |
| **10** | **Savings & Investment Intelligence** | Savings consistency, investment contribution allocation tracking |
| **11** | **AI Insights Engine** | Deterministically grounded narrative insights tied to metrics |
| **12** | **Grounded AI Financial Assistant** | Interactive context-aware financial query interface |
| **13** | **Transactions & Import Experience** | CSV upload preview, column mapping, deduplication wizard |
| **14** | **Global Filtering & Data Sync** | Unified date/account filters, cache invalidation, live state sync |
| **15** | **Accessibility, Responsiveness & Polish** | Keyboard nav, ARIA, mobile drawer, high-DPI chart rendering |
| **16** | **Security, Reliability & Performance** | Rate limiting, CORS, query indexing, lazy loading |
| **17** | **Testing, Evaluation & Data Quality** | Comprehensive unit, integration, and E2E test suites |
| **18** | **Production Readiness & Deployment** | Production Dockerfiles, build optimization, health checks |
| **19** | **Final Product Audit & Portfolio Polish** | End-to-end user workflow validation, documentation finalization |

---

## 8. Phase 0 Completion Verification Gate

- [x] **Repository Inspected:** All 7 specifications comprehensively reviewed.
- [x] **Runtime Environment Verified:** Python 3.13.14, Node v24.13.1, npm 11.8.0.
- [x] **Zero Regressions Confirmed:** Clean-slate baseline verified; no legacy errors or broken code.
- [x] **Target Architecture Mapped:** Monolith backend + Vite React client fully mapped.
- [x] **Design Tokens & Semantic Rules Established:** Exact color tokens and semantic directions recorded.
- [x] **Migration & Phased Strategy Finalized:** 20-phase roadmap fully scheduled.

**Phase 0 is complete and verified. Ready to proceed to Phase 1.**
