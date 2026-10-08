# AI Financial Intelligence Platform — Documentation Pack

This folder contains the implementation-ready documentation set for the AI/ML-driven dark fintech dashboard.

## Documents

1. `01_PRD.md` — Product Requirements Document
2. `02_SRS.md` — Software Requirements Specification
3. `03_BACKEND_IMPLEMENTATION.md` — Backend architecture, data contracts, ML/AI implementation, API examples, and build tasks
4. `04_USER_WORKFLOW.md` — End-to-end user journeys, scenarios, failure flows, and acceptance paths
5. `05_UI_UX_SPECIFICATION.md` — Dark fintech design system, visualization rules, page inventory, responsive behavior, and component-level UX requirements

## Reference stack

- Frontend: React + TypeScript
- Charts: Recharts
- Styling: Tailwind CSS + semantic design tokens
- Backend: FastAPI + Python
- Database: PostgreSQL
- ORM: SQLAlchemy
- Validation: Pydantic
- Async/cache: Redis + worker process
- ML: pandas + NumPy + scikit-learn/statsmodels-compatible forecasting
- AI: provider adapter with structured grounding and schema validation

## Implementation order

1. Read PRD and SRS together.
2. Build database and backend contracts.
3. Build deterministic analytics and chart data endpoints.
4. Build the dark UI system and core dashboard.
5. Add forecasting and anomaly pipelines.
6. Add grounded AI insights and assistant.
7. Run workflow and UI/UX acceptance tests.
8. Harden performance, security, accessibility, and observability.
