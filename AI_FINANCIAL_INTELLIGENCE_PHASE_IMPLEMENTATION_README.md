# AI Financial Intelligence Platform
# Phase-Wise Implementation Plan for Antigravity

> **Purpose:** This README is the execution roadmap for implementing the AI/ML Financial Intelligence Platform.
>
> **Use this file together with:**
> - `01_PRD.md`
> - `02_SRS.md`
> - `03_BACKEND_IMPLEMENTATION.md`
> - `04_USER_WORKFLOW.md`
> - `05_UI_UX_SPECIFICATION.md`

---

## 1. Project Mission

Build a production-style financial intelligence platform that helps a user understand:

```text
WHAT HAPPENED
      ↓
WHY IT HAPPENED
      ↓
IS IT IMPROVING OR WORSENING
      ↓
WHAT IS LIKELY TO HAPPEN NEXT
      ↓
WHAT SHOULD THE USER CONSIDER
```

The product must feel like an advanced fintech analytics platform.

It must NOT feel like:

- a basic expense tracker
- a CRUD application
- a generic admin dashboard
- a collection of disconnected cards
- a chatbot with financial data beside it

The core product language is:

```text
DATA
  +
VISUALIZATION
  +
ANALYSIS
  +
PREDICTION
  +
AI EXPLANATION
```

The primary rule is:

> **Show the data first. Explain the data second.**

---

# 2. Antigravity Execution Rules

Antigravity must implement the project incrementally.

Do not attempt to build the whole platform in one pass.

Each phase must:

1. Inspect the existing code before modifying it.
2. Preserve working functionality.
3. Implement only the scope assigned to the current phase.
4. Run automated tests.
5. Run the application.
6. Check browser console errors.
7. Check API errors.
8. Check responsive behavior.
9. Check accessibility.
10. Check dark-theme consistency.
11. Review changed files.
12. Document completed work.
13. Document unresolved issues.
14. Only proceed when the phase is stable.

---

# 3. Source-of-Truth Hierarchy

When making implementation decisions, use this priority:

```text
1. Project Vision
2. PRD
3. SRS
4. Backend Implementation Specification
5. User Workflow Specification
6. UI/UX Specification
7. Existing project constraints
8. Implementation convenience
```

Do not simplify the product merely because a simpler implementation is easier.

---

# 4. Reference Technology Stack

## Frontend

```text
React
TypeScript
Vite
Tailwind CSS
Recharts
React Router
TanStack Query
Zod
React Hook Form
```

## Backend

```text
Python
FastAPI
Pydantic
SQLAlchemy
Alembic
PostgreSQL
```

## Background Processing

```text
Redis
Celery or equivalent task queue
```

## ML / Analytics

```text
Python
Pandas
NumPy
Scikit-learn
Statsmodels where appropriate
```

## Testing

```text
Vitest
React Testing Library
Pytest
API integration tests
End-to-end tests
```

---

# 5. Global Design Rules

The entire application is dark-themed.

## Base Colors

```text
Background       #0B0F14
Secondary        #111720
Card             #151C25
Elevated Card    #19222D
Border           #26313D
Primary Text     #F1F5F9
Secondary Text   #94A3B8
Muted Text       #64748B
```

## Semantic Colors

```text
Positive         #22C55E
Negative         #EF4444
Warning          #F59E0B
Neutral          #3B82F6
AI / Information #06B6D4
```

Do not introduce arbitrary colors.

Do not use white dashboard panels.

Do not make every component glow.

Do not use color alone to communicate meaning.

Pair color with:

```text
↑
↓
→
Improving
Concerning
Stable
Attention Required
```

---

# 6. Intelligent Color Semantics

Never implement:

```text
increase = green
decrease = red
```

Instead determine financial meaning.

Examples:

```text
Spending +15%       → Negative / Concerning
Spending -10%       → Positive / Improving

Savings +15%        → Positive / Improving
Savings -10%        → Negative / Concerning

Income +10%         → Positive / Improving
Income -10%         → Negative / Concerning

Investment +20%     → Positive / Improving
Investment -20%     → Negative / Concerning
```

Prefer backend semantic metadata such as:

```json
{
  "change": 15.2,
  "direction": "INCREASE",
  "financialImpact": "NEGATIVE",
  "status": "CONCERNING"
}
```

---

# 7. Prediction Visualization Rules

Predicted values must never visually look identical to actual values.

## Actual

```text
solid line
full opacity
```

## Forecast

```text
dashed line
reduced opacity
forecast badge
forecast label
```

## Prediction Language

Use:

```text
Estimated next-month spending
Expected spending
Forecast
Estimated range
Prediction interval
```

Do not communicate predictions as guaranteed facts.

Only show confidence intervals when the model actually produces them.

Never invent a confidence percentage.

---

# 8. Visualization-First Rule

Whenever meaningful numerical information changes:

```text
SHOW THE CHANGE GRAPHICALLY.
```

Whenever a comparison exists:

```text
SHOW THE COMPARISON GRAPHICALLY.
```

Whenever a prediction exists:

```text
SHOW ACTUAL + FORECAST GRAPHICALLY.
```

Whenever an anomaly exists:

```text
VISUALLY HIGHLIGHT IT.
```

Whenever a metric is improving or worsening:

```text
SHOW STATUS + TREND + VISUALIZATION.
```

Whenever AI explains a financial conclusion:

```text
CONNECT THE EXPLANATION TO THE RELEVANT METRIC OR GRAPH.
```

---

# 9. Implementation Strategy

The complete implementation is divided into the following phases:

```text
Phase 0   Project Audit and Baseline
Phase 1   Architecture, Design System and Foundation
Phase 2   Database and Domain Model
Phase 3   Backend Core API
Phase 4   Deterministic Analytics Engine
Phase 5   Financial Overview Dashboard
Phase 6   Advanced Analytics Workspace
Phase 7   ML Forecasting Engine
Phase 8   Anomaly Detection Engine
Phase 9   Prediction Center
Phase 10  Savings and Investment Intelligence
Phase 11  AI Insights Engine
Phase 12  Grounded AI Financial Assistant
Phase 13  Transactions and Import Experience
Phase 14  Global Filtering and Data Synchronization
Phase 15  Accessibility, Responsiveness and Interaction Polish
Phase 16  Security, Reliability and Performance
Phase 17  Testing, Evaluation and Data Quality
Phase 18  Production Readiness and Deployment
Phase 19  Final Product Audit and Portfolio Polish
```

---

# PHASE 0
# Project Audit and Baseline

## Goal

Understand the existing application before changing it.

## Antigravity Prompt

```text
PHASE 0 — PROJECT AUDIT AND BASELINE

Inspect the complete repository before modifying functionality.

Review:

- frontend architecture
- backend architecture
- database
- API routes
- authentication
- existing transaction functionality
- existing components
- existing charts
- styling system
- state management
- tests
- dependencies
- environment configuration
- Docker configuration
- documentation

Do not blindly rewrite the project.

Identify:

- reusable functionality
- technical debt
- missing functionality
- broken functionality
- files that must be preserved
- files that should be refactored
- files that should be created

Run the existing application.

Run the existing test suite.

Record baseline errors and warnings.

Create:

PROJECT_AUDIT.md

Include:

- current architecture
- dependency inventory
- application entry points
- API inventory
- database inventory
- authentication flow
- UI inventory
- existing analytics
- existing charts
- current limitations
- migration strategy

Do not implement new product features in this phase.
```

## Deliverables

```text
PROJECT_AUDIT.md
Architecture map
Baseline test report
Baseline runtime report
```

## Completion Gate

Phase 0 is complete only when:

```text
[ ] Existing application can be started
[ ] Existing tests have been executed
[ ] Existing APIs are documented
[ ] Existing database is understood
[ ] Existing UI structure is documented
[ ] Migration strategy exists
```

---

# PHASE 1
# Architecture, Design System and Foundation

## Goal

Create the foundation required for every later phase.

## Build

```text
Routing
Global layout
Sidebar
Top navigation
Responsive containers
Design tokens
Theme system
API client
Query management
Error handling
Loading states
Reusable UI primitives
Chart primitives
```

## Core Navigation

```text
Overview
Analytics
Transactions
Predictions
Investments
Savings
AI Insights
AI Assistant
Anomalies
Import Data
Settings
```

## Required Components

```text
Button
Badge
Tooltip
Dropdown
Tabs
Modal
Skeleton
EmptyState
ErrorState
MetricCard
TrendIndicator
StatusBadge
ChartContainer
SectionHeader
```

## Antigravity Prompt

```text
PHASE 1 — PLATFORM FOUNDATION

Build the platform foundation without implementing advanced analytics.

Create:

- responsive application shell
- collapsible sidebar
- top navigation
- mobile navigation
- routing
- design token system
- semantic color system
- typography system
- spacing system
- reusable UI primitives
- API client
- query layer
- error boundary
- loading infrastructure
- chart container infrastructure

Implement the full dark visual language.

Do not scatter colors across components.

Centralize the theme tokens.

Create reusable chart styling for:

- axes
- grid
- tooltip
- legend
- reference lines
- actual lines
- forecast lines

Ensure the application remains functional.

Test keyboard navigation.

Test mobile layout.

Do not create fake analytics.
```

## Completion Gate

```text
[ ] Sidebar works
[ ] Routing works
[ ] Dark theme is globally applied
[ ] Mobile navigation works
[ ] UI primitives are reusable
[ ] API client exists
[ ] Chart foundation exists
[ ] No major console errors
```

---

# PHASE 2
# Database and Domain Model

## Goal

Create a reliable financial data foundation.

## Core Entities

```text
User
Account
Transaction
Category
Merchant
Budget
SavingsRecord
InvestmentRecord
Forecast
ForecastPoint
Anomaly
Insight
InsightEvidence
AIConversation
AIMessage
ImportJob
ModelRun
```

## Transaction Data

```text
id
user_id
account_id
merchant_id
category_id
amount
currency
transaction_type
transaction_date
description
is_recurring
source
metadata
created_at
updated_at
```

## Antigravity Prompt

```text
PHASE 2 — DATABASE AND DOMAIN MODEL

Implement a normalized PostgreSQL data model for the financial intelligence platform.

Use:

- SQLAlchemy
- Alembic
- PostgreSQL

Create models for:

User
Account
Transaction
Category
Merchant
Budget
SavingsRecord
InvestmentRecord
Forecast
ForecastPoint
Anomaly
Insight
InsightEvidence
AIConversation
AIMessage
ImportJob
ModelRun

Implement:

- foreign keys
- indexes
- constraints
- timestamps
- user-level data isolation
- migrations
- rollback support
- seed data for development

Do not store derived analytics unnecessarily.

Create repository/data-access abstractions.

Write database tests.

Verify migration from empty database.

Verify rollback.

Verify user isolation.
```

## Completion Gate

```text
[ ] Clean database migration
[ ] Rollback works
[ ] Seed data works
[ ] Models validated
[ ] User isolation tested
[ ] Indexes added
[ ] Database tests passing
```

---

# PHASE 3
# Backend Core API

## Goal

Expose production-quality REST APIs.

## API Groups

```text
/api/v1/auth
/api/v1/users
/api/v1/accounts
/api/v1/transactions
/api/v1/categories
/api/v1/merchants
/api/v1/dashboard
/api/v1/analytics
```

## Transaction Operations

```text
GET
GET /:id
POST
PUT
DELETE
```

## Filters

```text
date
category
merchant
transaction type
amount range
search
sort
pagination
```

## Antigravity Prompt

```text
PHASE 3 — BACKEND CORE API

Implement the FastAPI backend.

Use:

- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL

Create versioned endpoints.

Implement:

authentication
authorization
transactions
accounts
categories
merchants
dashboard data
basic analytics endpoints

Transactions must support:

- pagination
- filtering
- sorting
- date range
- category
- merchant
- transaction type
- amount range
- search

Create consistent error responses.

Never expose internal stack traces.

Generate OpenAPI documentation.

Create API integration tests.

Use Pydantic request and response contracts.
```

## Completion Gate

```text
[ ] API starts cleanly
[ ] OpenAPI works
[ ] CRUD endpoints work
[ ] Pagination works
[ ] Filtering works
[ ] Authorization works
[ ] Tests pass
```

---

# PHASE 4
# Deterministic Financial Analytics Engine

## Goal

Convert transaction data into trustworthy financial intelligence before introducing ML.

## Metrics

```text
Monthly income
Monthly spending
Monthly savings
Savings rate
Investment contribution
Investment rate
Average transaction
Median transaction
Transaction frequency
Recurring expenses
Historical averages
Month-over-month changes
Category spending
Merchant spending
```

## Semantic Analysis

Every important metric should calculate:

```text
direction
financialImpact
status
```

## Status Values

```text
IMPROVING
CONCERNING
STABLE
ATTENTION_REQUIRED
```

## Antigravity Prompt

```text
PHASE 4 — DETERMINISTIC ANALYTICS ENGINE

Implement the financial analytics layer without using ML.

Calculate:

- income
- spending
- savings
- savings rate
- investment contribution
- investment rate
- historical averages
- monthly changes
- category totals
- category percentages
- category trends
- merchant spending
- recurring spending
- transaction statistics

For important metrics calculate:

- direction
- financial impact
- status

Do not assume increase is always positive.

Examples:

spending increase = potentially negative
savings increase = positive
income increase = positive
investment contribution increase = positive

Expose clean analytics APIs.

Handle:

- no data
- incomplete data
- zero income
- one month of history
- missing categories
- missing merchants

Write unit and integration tests.
```

## Completion Gate

```text
[ ] Analytics values match known calculations
[ ] Semantic status is correct
[ ] Edge cases handled
[ ] APIs documented
[ ] Tests pass
```

---

# PHASE 5
# Financial Overview Dashboard

## Goal

Build the main product experience.

## Dashboard Priority

```text
Current Financial State
        ↓
Historical Trend
        ↓
Comparison
        ↓
Prediction
        ↓
Explanation
        ↓
Action
```

## Summary Metrics

```text
Income
Spending
Savings
Investments
```

## Main Visualization

```text
Spending Trend
Historical Average
Previous Period
Forecast when available
```

## Supporting Visualizations

```text
Category Breakdown
Income vs Spending
Financial Intelligence
AI Insight Preview
```

## Antigravity Prompt

```text
PHASE 5 — FINANCIAL OVERVIEW DASHBOARD

Build the primary financial intelligence dashboard.

Do not make it a grid of generic cards.

Build a visual narrative.

Create:

- Income metric
- Spending metric
- Savings metric
- Investment metric

Each should include:

- current value
- percentage change
- comparison period
- sparkline
- semantic status
- historical context

Create the large Spending Trend chart.

Show:

- actual spending
- historical average
- previous period where useful
- forecast when available

Use:

solid line = actual
dashed line = forecast
reference line = historical average

Create:

- Category Breakdown chart
- Income vs Spending chart
- Financial Intelligence section
- AI insight preview section

Use backend analytics as the data source.

Do not create fake AI content.
```

## Completion Gate

```text
[ ] Dashboard is data-driven
[ ] Graphs communicate trends
[ ] Cards contain context
[ ] Dark theme is consistent
[ ] Responsive desktop/tablet/mobile
[ ] No misleading colors
```

---

# PHASE 6
# Advanced Analytics Workspace

## Goal

Allow the user to investigate financial behavior interactively.

## Filters

```text
1M
3M
6M
1Y
Custom
```

Additional filters:

```text
Category
Merchant
Transaction Type
Account
Weekly
Monthly
Yearly
```

## Charts

```text
SpendingTrendChart
CategoryTrendChart
IncomeExpenseChart
SavingsTrendChart
InvestmentTrendChart
MerchantChart
ComparisonChart
```

## Antigravity Prompt

```text
PHASE 6 — ADVANCED ANALYTICS WORKSPACE

Create an interactive analytics page.

Implement:

- date range filters
- category filters
- merchant filters
- account filters
- transaction type filters
- time aggregation filters

Charts must support:

- hover tooltip
- series toggle
- category toggle
- comparison toggle
- actual/forecast toggle
- average toggle

Do not display excessive series simultaneously.

Default to the most meaningful categories.

Implement:

- spending trend
- category trends
- income vs spending
- savings trend
- investment trend
- merchant analysis
- month-over-month comparison

When filters change, all related analytics must update consistently.
```

---

# PHASE 7
# ML Forecasting Engine

## Goal

Introduce predictive financial intelligence.

## Predictions

```text
Next-month spending
Category spending
Savings
Investment contribution
```

## Pipeline

```text
Data extraction
      ↓
Cleaning
      ↓
Feature engineering
      ↓
Baseline
      ↓
Model training
      ↓
Validation
      ↓
Evaluation
      ↓
Prediction
      ↓
Persistence
      ↓
API serving
```

## Feature Candidates

```text
Historical spending
Rolling averages
Trend
Seasonality
Category contribution
Income stability
Transaction frequency
Recurring expenses
Recent growth
Category momentum
```

## Metrics

```text
MAE
RMSE
MAPE where appropriate
```

## Antigravity Prompt

```text
PHASE 7 — ML FORECASTING ENGINE

Implement a forecasting subsystem.

Start with a baseline model.

Do not introduce complex ML merely for appearance.

Compare model performance with the baseline.

Build:

- feature generation
- training
- validation
- evaluation
- prediction
- model versioning
- persistence
- serving

Forecast:

- total spending
- category spending
- savings
- investment contribution

Return:

- forecast value
- historical average
- direction
- change percentage
- model version
- generated timestamp

Only include confidence or prediction intervals if the selected model actually produces them.

Long-running model generation must use background processing.

Handle insufficient history gracefully.

Create ML tests.
```

---

# PHASE 8
# Anomaly Detection Engine

## Goal

Detect unusual spending patterns.

## Important Language Rule

Never call an anomaly "fraud" unless an external fraud system independently establishes that.

Use:

```text
Unusual spending pattern
Unusual transaction
Anomalous behavior
```

## Severity

```text
HIGH
MEDIUM
LOW
NORMAL
```

## Antigravity Prompt

```text
PHASE 8 — ANOMALY DETECTION

Implement personalized unusual-spending detection.

Potential signals:

- transaction amount
- category
- merchant
- historical behavior
- transaction frequency
- recent spending
- category behavior

Produce:

- anomaly score
- severity
- transaction reference
- category
- merchant
- comparison
- explanation

Build an Anomaly page.

Include:

- anomaly count
- severity distribution
- recent anomalies
- anomaly timeline
- transaction details
- comparison with normal behavior

Build an anomaly visualization showing unusual transactions relative to normal spending behavior.

Use red carefully and pair it with severity labels/icons.

Never describe anomaly detection as guaranteed fraud detection.
```

---

# PHASE 9
# Prediction Center

## Goal

Create a dedicated high-quality prediction experience.

## Main View

```text
PREDICTION CENTER

Estimated Next Month Spending
₹29,500

Expected Change
+5.3%

Forecast Range
Only if supplied by model
```

## Prediction Drivers

```text
Food spending
Shopping
Consecutive trend
Income stability
Other verified model features
```

## Antigravity Prompt

```text
PHASE 9 — PREDICTION CENTER

Create a dedicated Prediction Center.

Hero section:

- estimated next-month spending
- expected change
- forecast status
- model generation timestamp

Main visualization:

Historical + Forecast

Show:

- actual
- historical average
- forecast
- prediction interval where available

Create:

- spending forecast
- category forecast
- savings forecast
- investment forecast

Create a Prediction Drivers section.

Every driver must be backed by verified analytics/model data.

Example:

Food spending +23%
Shopping +12%
Spending increased three consecutive months
Income stable

Never invent explanations.
```

---

# PHASE 10
# Savings and Investment Intelligence

## Goal

Treat saving and investing as first-class analytical modules.

## Savings

Show:

```text
Savings amount
Savings rate
Historical average
Trend
Forecast
```

## Investments

Show:

```text
Monthly investment contribution
Investment percentage of income
Investment consistency
Historical contribution
Forecast
```

## Antigravity Prompt

```text
PHASE 10 — SAVINGS AND INVESTMENT INTELLIGENCE

Create dedicated Savings and Investments experiences.

Savings:

- savings amount
- savings rate
- historical average
- trend chart
- forecast
- comparison

Investments:

- contribution amount
- contribution rate
- consistency
- historical contribution
- forecast
- comparison

Use meaningful visualizations.

Savings increases should generally be interpreted positively.

Investment contribution increases should generally be interpreted positively.

Do not apply raw numeric direction without financial semantics.

Connect data to the same global date/filter system.
```

---

# PHASE 11
# AI Insights Engine

## Goal

Generate useful AI explanations grounded in verified analytics.

## Insight Structure

```text
GRAPH
  ↓
METRIC
  ↓
INTERPRETATION
  ↓
RECOMMENDATION
```

## Example

```text
Spending increased 18%.

Food and Shopping are the largest contributors.

Your spending is above the six-month average.

Consider reviewing discretionary spending.
```

## Antigravity Prompt

```text
PHASE 11 — AI INSIGHTS ENGINE

Build an AI Insights service.

The AI must consume structured analytical facts from the backend.

The AI must not invent:

- transaction amounts
- dates
- category totals
- forecast values
- anomaly scores
- confidence values

Create insight types:

- spending trend
- savings trend
- investment trend
- anomaly
- forecast
- category change
- financial health

Each insight should contain:

- title
- summary
- evidence
- metric references
- severity/status
- recommendation where appropriate
- related chart/section identifier

The frontend should be able to navigate from an insight directly to the relevant analytical visualization.

AI explanation must remain grounded in verified backend data.
```

---

# PHASE 12
# Grounded AI Financial Assistant

## Goal

Create a premium financial assistant that understands the analytics platform.

## Assistant Capabilities

The assistant should answer questions such as:

```text
Am I spending more than usual?
Why did spending increase?
Which category changed the most?
How are my savings doing?
What does next month look like?
Why does the model expect spending to increase?
Which anomalies were detected?
```

## Important

The assistant is NOT a generic chatbot.

It should return:

```text
text
metrics
mini visualizations
trend indicators
links/actions
references to analytics
```

## Antigravity Prompt

```text
PHASE 12 — GROUNDED AI FINANCIAL ASSISTANT

Build an AI assistant integrated with the analytics system.

The assistant must have access to verified structured financial context.

For questions such as:

"Am I spending more than usual?"

Return:

- answer
- relevant metric
- historical average
- current value
- visual comparison
- explanation
- navigation action to relevant chart

The assistant should be able to produce structured responses.

Support response blocks such as:

- text
- metric
- chart reference
- comparison
- recommendation
- navigation action

Never hallucinate financial data.

Never invent model predictions.

Never manufacture confidence scores.

The assistant should cite or reference the analytical source used internally when appropriate.

Create a premium dark AI experience without making the whole application neon.
```

---

# PHASE 13
# Transactions and Import Experience

## Goal

Make reliable data entry and import part of the intelligence pipeline.

## Transactions

Support:

```text
Search
Filter
Sort
Pagination
Edit
Delete
Details
Category assignment
Merchant assignment
```

## Import

Support architecture for:

```text
CSV
Spreadsheet
Future bank integrations
```

## Import Pipeline

```text
Upload
  ↓
Validation
  ↓
Preview
  ↓
Mapping
  ↓
Normalization
  ↓
Duplicate detection
  ↓
Import
  ↓
Analytics refresh
  ↓
Optional ML refresh
```

## Antigravity Prompt

```text
PHASE 13 — TRANSACTIONS AND DATA IMPORT

Build the transaction management experience.

Implement:

- searchable table
- filters
- sorting
- pagination
- transaction detail
- editing
- deletion
- category assignment
- merchant assignment

Build an import workflow.

Stages:

1. Upload
2. Validate
3. Preview
4. Map fields
5. Normalize
6. Detect duplicates
7. Import
8. Refresh analytics

Show useful validation errors.

Do not silently discard imported rows.

Create import-job status.

Make the architecture extensible for future bank integrations.
```

---

# PHASE 14
# Global Filtering and Data Synchronization

## Goal

Ensure every analytical surface agrees with the same selected data scope.

## Global State

Synchronize:

```text
Date range
Category
Merchant
Account
Transaction type
Aggregation level
```

## Requirements

When the user changes a filter:

```text
Dashboard
Analytics
Savings
Investments
Predictions
AI Insights
Anomalies
```

must update consistently where the filter applies.

## Antigravity Prompt

```text
PHASE 14 — GLOBAL FILTERS AND DATA SYNCHRONIZATION

Implement a centralized analytical filter system.

Filters:

- date range
- category
- merchant
- account
- transaction type
- aggregation

Ensure all applicable pages consume the same filter state.

Do not create independent conflicting filter implementations.

Use URL state where useful so views can be shared/bookmarked.

When filters change:

- refetch required data
- invalidate relevant caches
- update charts
- update metrics
- update insights
- update comparison values

Avoid unnecessary network requests.

```

---

# PHASE 15
# Accessibility, Responsiveness and Interaction Polish

## Goal

Bring the interface to production-grade UX quality.

## Accessibility

Implement:

```text
Keyboard navigation
Focus states
ARIA labels
Accessible buttons
Accessible tooltips
Screen-reader-friendly status
Non-color indicators
```

## Responsive Priority

Desktop:

```text
Overview
Analytics
Predictions
Insights
```

Mobile:

```text
Summary
↓
Main Trend
↓
Forecast
↓
Category Analysis
↓
Insights
↓
Transactions
```

## Micro-interactions

Use subtle animation for:

```text
Card entrance
Chart entrance
Number transitions
Hover
Tooltip
Sidebar
Active navigation
AI responses
```

Do not over-animate.

## Antigravity Prompt

```text
PHASE 15 — UX POLISH

Perform a complete accessibility and responsive UX pass.

Test:

- desktop
- laptop
- tablet
- mobile

Implement:

- keyboard navigation
- focus states
- ARIA labels
- accessible charts where possible
- accessible tooltips
- non-color status indicators
- mobile navigation
- responsive chart containers

Add restrained micro-interactions.

Do not introduce distracting animations.

Check:

- overflow
- clipping
- unreadable chart labels
- tiny controls
- inaccessible buttons
- contrast issues
```

---

# PHASE 16
# Security, Reliability and Performance

## Goal

Harden the platform.

## Security

Review:

```text
Authentication
Authorization
Session handling
Input validation
SQL injection prevention
CORS
Secrets management
Rate limiting
API abuse
User data isolation
```

## Performance

Optimize:

```text
Database queries
Indexes
API payload sizes
React rendering
Chart rendering
Query caching
Background tasks
ML execution
```

## Reliability

Implement:

```text
Retries where appropriate
Timeouts
Graceful degradation
Error boundaries
Service health checks
Structured logging
```

## Antigravity Prompt

```text
PHASE 16 — SECURITY RELIABILITY PERFORMANCE

Perform a production hardening pass.

Review:

- authentication
- authorization
- user data isolation
- request validation
- SQL safety
- CORS
- secrets
- rate limiting
- error handling
- API timeouts
- background task failure
- ML failure

Optimize:

- database indexes
- expensive queries
- API responses
- cache behavior
- frontend rendering
- chart performance

Create health-check endpoints.

Implement structured logging.

Do not leak private financial information into logs.

Do not expose stack traces to users.
```

---

# PHASE 17
# Testing, Model Evaluation and Data Quality

## Goal

Prove that the platform is trustworthy.

## Frontend Tests

Test:

```text
Components
Hooks
Charts
Filters
Navigation
Loading states
Error states
Empty states
```

## Backend Tests

Test:

```text
API
Authorization
Database
Analytics
Imports
Validation
```

## ML Tests

Test:

```text
Feature generation
Baseline
Training
Prediction
Evaluation
Missing data
Insufficient history
Model failures
```

## Data Quality

Validate:

```text
Missing values
Duplicate transactions
Unexpected amounts
Invalid dates
Unknown categories
Currency inconsistencies
```

## Antigravity Prompt

```text
PHASE 17 — TESTING AND DATA QUALITY

Create a comprehensive automated testing strategy.

Frontend:

- unit tests
- component tests
- chart tests
- interaction tests

Backend:

- unit tests
- integration tests
- authorization tests
- database tests
- API tests

ML:

- feature tests
- model tests
- forecast tests
- evaluation tests
- edge cases

Create end-to-end tests for:

1. Login
2. Dashboard
3. Transaction creation
4. Transaction import
5. Analytics filtering
6. Forecast generation
7. Anomaly detection
8. AI insights
9. AI assistant

Add data-quality validation.

Ensure failures are visible and actionable.
```

---

# PHASE 18
# Production Readiness and Deployment

## Goal

Make the application deployable.

## Production Components

```text
Frontend
Backend API
PostgreSQL
Redis
Worker
ML service/runtime
```

## Required

```text
Environment variables
Production configuration
Docker
Health checks
Migrations
Logging
Error tracking
Build validation
Deployment documentation
```

## Antigravity Prompt

```text
PHASE 18 — PRODUCTION READINESS

Prepare the entire platform for production deployment.

Create:

- production environment configuration
- secure environment variable handling
- Docker configuration
- database migration process
- worker configuration
- health checks
- logging
- graceful shutdown
- build scripts
- deployment documentation

Verify:

- frontend production build
- backend production startup
- migration from clean database
- worker startup
- Redis connectivity
- PostgreSQL connectivity
- API health
- frontend API connectivity

Do not hardcode production secrets.

Document all required environment variables.
```

---

# PHASE 19
# Final Product Audit and Portfolio Polish

## Goal

Perform a final product-level review.

This is not merely a bug-fixing pass.

Review the experience as a real fintech product.

## Validate

```text
Does the dashboard immediately communicate financial state?

Are trends visible?

Are comparisons graphical?

Are predictions visually distinct?

Are anomalies obvious?

Are status labels semantically correct?

Can the user understand WHY a value changed?

Can the user understand WHY a prediction exists?

Does AI reference real analytical evidence?

Does mobile remain usable?

Does the application feel like an intelligence platform rather than an expense tracker?
```

## Antigravity Prompt

```text
PHASE 19 — FINAL PRODUCT AUDIT

Perform a complete product audit against:

- 01_PRD.md
- 02_SRS.md
- 03_BACKEND_IMPLEMENTATION.md
- 04_USER_WORKFLOW.md
- 05_UI_UX_SPECIFICATION.md

Review every major feature.

Audit:

- product requirements
- backend requirements
- API contracts
- database
- analytics
- ML
- anomalies
- AI
- UI
- UX
- accessibility
- responsive behavior
- performance
- security

Focus especially on the core product rule:

"SHOW THE DATA FIRST. EXPLAIN THE DATA SECOND."

Verify:

- trends are visual
- comparisons are visual
- forecasts are visual
- anomalies are visual
- improving/worsening states are visual
- AI explanations connect to relevant metrics

Remove:

- generic dashboard patterns
- decorative charts
- redundant cards
- meaningless visualizations
- inconsistent colors
- fake AI content
- misleading prediction wording

Polish spacing, typography, labels, tooltips, chart annotations and interactions.

Run the complete test suite.

Produce:

FINAL_AUDIT.md

Include:

- completed requirements
- incomplete requirements
- known limitations
- performance findings
- accessibility findings
- visual findings
- recommended future improvements

Do not claim a feature is complete unless it is actually implemented and verified.
```

---

# 10. Recommended Execution Order

Antigravity should execute phases in this exact order:

```text
0
↓
1
↓
2
↓
3
↓
4
↓
5
↓
6
↓
7
↓
8
↓
9
↓
10
↓
11
↓
12
↓
13
↓
14
↓
15
↓
16
↓
17
↓
18
↓
19
```

Do not implement ML before deterministic analytics are trustworthy.

Do not implement AI explanations before structured analytics exist.

Do not implement forecast UI before the forecast API contract exists.

Do not implement anomaly UI before anomaly data exists.

Do not build the assistant as a separate data source.

---

# 11. Dependency Map

```text
Database
   ↓
Backend APIs
   ↓
Deterministic Analytics
   ↓
Dashboard
   ↓
Advanced Analytics
   ↓
ML Forecasting
   ↓
Prediction Center

Database
   ↓
Anomaly Detection
   ↓
Anomaly Dashboard

Analytics
   ↓
AI Insights
   ↓
AI Assistant

Transactions
   ↓
Analytics
   ↓
ML
   ↓
AI
```

---

# 12. Recommended Repository Structure

```text
project-root/

README.md

docs/
    01_PRD.md
    02_SRS.md
    03_BACKEND_IMPLEMENTATION.md
    04_USER_WORKFLOW.md
    05_UI_UX_SPECIFICATION.md
    PHASE_IMPLEMENTATION_PLAN.md
    PROJECT_AUDIT.md
    FINAL_AUDIT.md

frontend/
    src/
        components/
            charts/
            dashboard/
            analytics/
            predictions/
            investments/
            savings/
            anomalies/
            ai/
            layout/
            ui/
        pages/
        hooks/
        services/
        api/
        types/
        utils/
        constants/
        theme/

backend/
    app/
        api/
            routes/
        core/
        models/
        schemas/
        services/
        repositories/
        analytics/
        ml/
        anomalies/
        ai/
        workers/
        utils/

    migrations/
    tests/

ml/
    features/
    models/
    training/
    evaluation/
    inference/

database/
    seeds/

infra/
    docker/
    deployment/

tests/
    e2e/
```

---

# 13. Standard Frontend Components

Build reusable components.

```text
MetricCard
TrendIndicator
StatusBadge
ComparisonCard
ChartContainer
ChartTooltip
ChartLegend
ForecastBadge
HistoricalAverageLine
PredictionRange
AnomalyMarker
InsightCard
AIInsightCard
AIMessage
FinancialHealthCard
FilterBar
DateRangeSelector
CategorySelector
MerchantSelector
Skeleton
EmptyState
ErrorState
```

---

# 14. Standard Chart Components

Create reusable chart implementations.

```text
SpendingTrendChart
CategoryBreakdownChart
CategoryTrendChart
IncomeExpenseChart
SavingsTrendChart
InvestmentTrendChart
ForecastChart
AnomalyChart
ComparisonChart
MerchantChart
FinancialHealthChart
```

Do not duplicate chart logic between pages.

---

# 15. Standard Backend Contracts

## Metric Contract

```json
{
  "metric": "spending",
  "current": 28000,
  "previous": 24500,
  "changePercent": 14.3,
  "direction": "UP",
  "impact": "NEGATIVE",
  "status": "CONCERNING",
  "historicalAverage": 24500
}
```

## Chart Point

```json
{
  "period": "Jun 2026",
  "actual": 28000,
  "historicalAverage": 24500,
  "forecast": null
}
```

## Forecast Point

```json
{
  "period": "Jul 2026",
  "actual": null,
  "historicalAverage": 24500,
  "forecast": 29500
}
```

## Anomaly

```json
{
  "transactionId": "txn_123",
  "score": 0.94,
  "severity": "HIGH",
  "category": "Shopping",
  "merchant": "Example Merchant",
  "reason": "Transaction amount is substantially above the user's normal range"
}
```

---

# 16. Definition of Done for Every Phase

A phase is complete only when all applicable conditions are true.

```text
[ ] Requirements implemented
[ ] Existing functionality preserved
[ ] Unit tests written
[ ] Integration tests written where applicable
[ ] Application runs
[ ] API runs
[ ] No critical console errors
[ ] No critical backend errors
[ ] Responsive behavior checked
[ ] Accessibility checked
[ ] Loading state handled
[ ] Empty state handled
[ ] Error state handled
[ ] Design tokens respected
[ ] Semantic colors respected
[ ] Documentation updated
[ ] Implementation notes recorded
```

---

# 17. AI / ML Trust Rules

The platform must distinguish between:

```text
Historical Fact
Current Measurement
Model Estimate
AI Interpretation
Recommendation
```

Never mix these categories.

## Historical Fact

Example:

```text
Your June spending was ₹28,000.
```

## Current Measurement

Example:

```text
Your current monthly spending is ₹28,000.
```

## Model Estimate

Example:

```text
Estimated next-month spending: ₹29,500.
```

## AI Interpretation

Example:

```text
The recent increase is primarily associated with higher Food and Shopping spending.
```

## Recommendation

Example:

```text
Consider reviewing discretionary spending before the next billing cycle.
```

---

# 18. Financial Safety Rules

This is an analytical financial application.

Do not present speculative conclusions as facts.

Do not:

```text
claim certainty
claim fraud without evidence
invent confidence
invent prediction ranges
invent financial values
invent transactions
invent model explanations
```

Use appropriately cautious wording.

Prefer:

```text
Estimated
Likely
Associated with
Based on available data
The model indicates
Unusual spending pattern
```

---

# 19. Visual Storytelling Standard

Every important analytical screen should answer:

```text
WHAT
↓
HOW MUCH
↓
COMPARED WITH WHAT
↓
WHY
↓
WHAT NEXT
```

Example:

```text
WHAT
Spending increased.

HOW MUCH
+18%.

COMPARED WITH WHAT
+18% vs previous month
+14.3% vs six-month average

WHY
Food and Shopping increased.

WHAT NEXT
Model estimates further spending growth.

AI GUIDANCE
Review discretionary spending categories.
```

The visual layer should communicate most of this without forcing the user to read paragraphs.

---

# 20. Anti-Patterns to Reject

Antigravity must reject implementations that result in:

```text
Generic dashboard template
Card-only UI
Text-only analytics
Decorative charts
Chart without context
Chart without labels
Prediction shown as a fact
Forecast visually identical to actuals
Random colors
Neon-heavy design
Light-theme panels
AI hallucinations
Chatbot disconnected from analytics
Overloaded charts with too many series
Unresponsive charts
Charts overflowing mobile containers
Status communicated only through color
Fake anomaly/fraud claims
Hardcoded business logic in React
Hardcoded analytics values
Duplicated chart implementations
```

---

# 21. Portfolio Quality Checklist

Before declaring the project finished, verify:

```text
[ ] The dashboard feels like a financial intelligence platform.
[ ] The dashboard does not feel like an expense tracker.
[ ] Financial data is primarily visual.
[ ] Trends are easy to identify.
[ ] Historical averages are visible.
[ ] Comparisons are visually obvious.
[ ] Forecasts are visually distinct.
[ ] Prediction uncertainty is represented honestly.
[ ] Anomalies are visually prominent.
[ ] Financial meaning determines semantic color.
[ ] Savings analytics are strong.
[ ] Investment analytics are strong.
[ ] Financial health is understandable.
[ ] AI insights are grounded.
[ ] AI explanations reference actual data.
[ ] AI assistant can surface metrics and visual context.
[ ] Filters behave consistently.
[ ] Mobile layout is intentionally designed.
[ ] Accessibility requirements are met.
[ ] Tests are passing.
[ ] Backend contracts are documented.
[ ] Deployment is documented.
```

---

# 22. Final Product Mental Model

The final system should behave conceptually like this:

```text
                  USER DATA
                     │
                     ↓
               TRANSACTION DATA
                     │
                     ↓
             DETERMINISTIC ANALYTICS
                     │
          ┌──────────┼──────────┐
          ↓          ↓          ↓
       CURRENT    HISTORY    COMPARISON
          │          │          │
          └──────────┼──────────┘
                     ↓
                 ML MODELS
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
      FORECASTS              ANOMALIES
          │                     │
          └──────────┬──────────┘
                     ↓
                AI INSIGHTS
                     │
                     ↓
             AI FINANCIAL ASSISTANT
                     │
                     ↓
              PERSONALIZED GUIDANCE
```

---

# 23. The Core Product Loop

The complete user experience should repeatedly communicate:

```text
OBSERVE
   ↓
UNDERSTAND
   ↓
COMPARE
   ↓
PREDICT
   ↓
EXPLAIN
   ↓
ACT
```

A strong implementation should make this loop visible throughout the product.

---

# 24. Master Antigravity Rule

When implementing any future feature, ask:

```text
1. What financial question does this feature answer?
2. What data is required?
3. What visualization communicates it best?
4. What analytical calculation supports it?
5. Is the result historical, current, predicted, or AI-generated?
6. What semantic status should it have?
7. How should the UI communicate that meaning?
8. How should the user drill into the evidence?
9. What happens when data is missing?
10. How does the feature behave on mobile?
```

Do not implement a feature only because it can be displayed.

Implement it because it improves financial understanding.

---

# 25. Recommended Antigravity Command Pattern

For every phase, start with:

```text
Read:

01_PRD.md
02_SRS.md
03_BACKEND_IMPLEMENTATION.md
04_USER_WORKFLOW.md
05_UI_UX_SPECIFICATION.md
README.md
```

Then state:

```text
I am implementing PHASE X.

Only implement the scope of PHASE X.

Preserve previous phases.

Do not create fake data as real analytical output.

Do not skip tests.

Do not move to the next phase until the current phase passes its completion gate.
```

Then provide the phase-specific prompt from this README.

---

# 26. Final Instruction to Antigravity

```text
IMPLEMENT THIS PROJECT AS A FINANCIAL INTELLIGENCE PLATFORM, NOT AS AN EXPENSE TRACKER.

Graphs are not decorative.

Graphs are the primary language of the product.

For every meaningful:

- trend
- change
- comparison
- prediction
- anomaly
- financial-health conclusion

prefer a visual representation first and textual explanation second.

The final application must make the user feel:

"This application understands my financial behavior, explains why it is changing, shows the evidence visually, predicts what may happen next, and helps me make better decisions."

Do not compromise:

- dark theme
- semantic color system
- data visualization
- prediction clarity
- analytical grounding
- responsive UX
- accessibility
- backend correctness
- ML honesty
- AI grounding

Execute phases sequentially.

Verify every phase before continuing.

Treat the documentation files as the product specification.

Do not replace analytical depth with superficial visual polish.

The final result must be portfolio-grade, production-style and genuinely intelligence-oriented.
```

---

# 27. Phase Completion Tracker

Use this table to track implementation.

| Phase | Area | Status |
|---|---|---|
| 0 | Project Audit | ☑ |
| 1 | Foundation / Design System | ☑ |
| 2 | Database | ☑ |
| 3 | Backend APIs | ☑ |
| 4 | Analytics Engine | ☑ |
| 5 | Main Dashboard | ☑ |
| 6 | Advanced Analytics | ☑ |
| 7 | ML Forecasting | ☑ |
| 8 | Anomaly Detection | ☑ |
| 9 | Prediction Center | ☑ |
| 10 | Savings / Investments | ☑ |
| 11 | AI Insights | ☑ |
| 12 | AI Assistant | ☑ |
| 13 | Transactions / Import | ☑ |
| 14 | Global Filters | ☑ |
| 15 | UX / Accessibility | ☑ |
| 16 | Security / Performance | ☑ |
| 17 | Testing / Data Quality | ☑ |
| 18 | Production Deployment | ☑ |
| 19 | Final Audit | ☑ |

---

# 28. Final Outcome

At completion, the platform should provide:

```text
Advanced dark fintech UI
            +
Real financial data
            +
Interactive analytical charts
            +
Historical comparisons
            +
Semantic financial status
            +
ML forecasts
            +
Anomaly detection
            +
Savings intelligence
            +
Investment intelligence
            +
AI-generated grounded insights
            +
Context-aware AI assistant
            +
Responsive and accessible UX
            +
Production-ready backend
```

The final experience should communicate:

> **"This system analyzes my finances, visualizes what changed, explains why it changed, estimates what may happen next, and provides evidence-backed guidance."**

---

# END OF PHASE IMPLEMENTATION PLAN
