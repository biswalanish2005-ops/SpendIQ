# AI Financial Intelligence Platform

This document is part of the implementation specification for an advanced personal-finance intelligence platform.
The product is designed to answer a continuous sequence of questions: what happened, why it happened, whether it is improving or worsening, what may happen next, and what action the user may consider.
The system must prioritize verified financial data, purpose-built visualizations, explainable ML predictions, and grounded AI explanations.
The frontend is dark-first and analytical by design.
The reference stack is React + TypeScript + Recharts for presentation, FastAPI + Python + PostgreSQL for the application backend, Redis for asynchronous workloads/caching, and scikit-learn/statsmodels-compatible services for analytics and forecasting.
All implementation choices in these documents are defaults that may be adapted only when a change preserves the product goals and contracts stated here.


---

# User Workflow Specification

Version: 1.0
Status: Experience blueprint

## 1. Workflow Philosophy
The workflow should continuously move from observation to understanding to prediction to optional action.

Users should not need to understand machine learning terminology to benefit from the system.

- Every screen has a primary question.
- Every important answer points to evidence.
- Every prediction carries appropriate uncertainty.
- Users remain in control of their data and decisions.

## 2. First Visit
The first visit should explain the platform through a small number of concrete promises: connect data, see financial trends, understand anomalies, and explore forecasts.

Avoid presenting the user with an empty admin dashboard.

- Welcome state.
- Data import CTA.
- Privacy and processing explanation.
- Demo dataset option for local/portfolio showcase if explicitly enabled.

## 3. Import Workflow
The import journey should minimize fear around irreversible data changes by showing preview, validation, and duplicate handling before commit.

The user should see exactly what will be imported.

- Select CSV.
- Detect columns.
- Map fields.
- Preview rows.
- Review validation warnings.
- Review duplicate count.
- Confirm import.
- Show progress.
- Show import summary.

## 4. Dashboard Discovery
After the first successful import, the system should guide the user from current metrics into trends and then into predictions.

The first screen should immediately answer whether anything material changed.

- Review KPI cards.
- Open spending trend.
- Inspect category drivers.
- Review savings and investment trends.
- See forecast preview.
- See anomaly count.

## 5. Spending Investigation
When spending rises, the workflow should make it easy to move from the high-level number to the categories and merchants responsible for the change.

- Observe spending change.
- Open trend chart.
- Compare against historical average.
- Toggle categories.
- Inspect top contributors.
- Open transactions for evidence.

## 6. Savings Investigation
Savings workflows convert income and spending changes into a view of saved amount and savings rate.

The user should see whether the savings trajectory is improving, stable, or concerning.

- Open savings page.
- Review savings rate.
- Compare with average.
- Review three-month direction.
- Inspect drivers.

## 7. Investment Investigation
Investment workflows focus on consistency, contribution amount, and contribution as a share of income rather than live portfolio valuation in the core release.

- Review contribution trend.
- Review contribution percentage.
- Compare months.
- Inspect forecast.

## 8. Prediction Workflow
The prediction center should answer what may happen next and why the system expects that outcome.

- Open prediction center.
- Read estimated value.
- Inspect forecast chart.
- Review prediction range when available.
- Read drivers.
- Review historical trend.

## 9. Anomaly Workflow
Anomalies are designed for investigation, not accusations.

The workflow should contextualize unusual observations against the user’s own behavior.

- Open anomaly indicator.
- Review severity.
- Inspect amount vs baseline.
- Open transaction.
- Dismiss or mark reviewed.

## 10. AI Insight Workflow
AI insights should appear after the relevant analytical evidence is available.

The user can follow the evidence rather than trusting a text-only statement.

- Read insight headline.
- Inspect linked metric.
- Open supporting chart.
- Review recommendation.

## 11. AI Assistant Workflow
The assistant acts as an analytical navigation layer.

A response should lead to evidence and relevant dashboard surfaces.

- Ask a question.
- Resolve analytical context.
- Return structured answer.
- Offer chart or page action.
- Allow follow-up.

## 12. Filter Workflow
Filters should have predictable scope and visible state.

- Choose date range.
- Choose category.
- Choose merchant.
- Choose transaction type.
- Apply.
- Update cards and charts.
- Persist filter in URL when useful.

## 13. Mobile Workflow
Mobile users should receive the same story in a more vertical format.

The interface should prioritize the primary trend and forecast before deep-dive details.

- Summary.
- Main trend.
- Forecast.
- Category drivers.
- Insights.
- Transactions.

## 14. Error Workflow
Failures should preserve context and provide recovery actions.

- Show local error state.
- Preserve filters.
- Explain whether stale data is being shown.
- Provide retry.

## 15. Empty Data Workflow
An empty state should explain what data is missing and how the user can add it.

Never display an empty chart shell that looks broken.

- Explain minimum history.
- Offer import action.
- Offer sample data only when configured.

## 16. Data Deletion Workflow
Deletion should be explicit, irreversible only after confirmation, and clearly scoped.

- Preview deletion scope.
- Confirm.
- Execute server-side.
- Clear or invalidate analytical caches.
- Confirm completion.

## 17. User Trust Workflow
Trust is increased by showing provenance, date ranges, uncertainty, and the difference between observation and inference.

- Show data period.
- Show forecast label.
- Show model metadata where useful.
- Show anomaly wording as unusual rather than fraudulent.

## 18. Workflow Acceptance
Critical workflows should be represented as executable end-to-end scenarios.

- New user to first dashboard.
- Import to analytics.
- Spending increase to category explanation.
- Prediction to driver explanation.
- Anomaly to transaction review.
- AI question to grounded visualization.

## 19. User Workflow Scenarios
The scenarios below are written as testable paths for product, engineering, and QA.

WF-001 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-002 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-003 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-004 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-004-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-005 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-006 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-006-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-007 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-008 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-008-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-009 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-009-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-010 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-011 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-012 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-012-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-012-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-013 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-014 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-015 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-016 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-016-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-017 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-018 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-018-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-018-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-019 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-020 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-020-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-021 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-022 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-023 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-024 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-024-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-024-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-025 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-026 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-027 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-027-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-028 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-028-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-029 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-030 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-030-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-031 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-032 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-032-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-033 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-034 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-035 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-036 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-036-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-036-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-036-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-037 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-038 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-039 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-040 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-040-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-041 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-042 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-042-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-043 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-044 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-044-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-045 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-045-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-046 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-047 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-048 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-048-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-048-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-049 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-050 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-051 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-052 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-052-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-053 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-054 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-054-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-054-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-055 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-056 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-056-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-057 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-058 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-059 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-060 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-060-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-060-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-061 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-062 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-063 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-063-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-064 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-064-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-065 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-066 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-066-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-067 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-068 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-068-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-069 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-070 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-071 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-072 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-072-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-072-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-072-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-073 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-074 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-075 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-076 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-076-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-077 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-078 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-078-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-079 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-080 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-080-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-081 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-081-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-082 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-083 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-084 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-084-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-084-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-085 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-086 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-087 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-088 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-088-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-089 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-090 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-090-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-090-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-091 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-092 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-092-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-093 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-094 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-095 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-096 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-096-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-096-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-097 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-098 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-099 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-099-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-100 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-100-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-101 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-102 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-102-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-103 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-104 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-104-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-105 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-106 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-107 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-108 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-108-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-108-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-108-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-109 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-110 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-111 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-112 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-112-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-113 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-114 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-114-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-115 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-116 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-116-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-117 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-117-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-118 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-119 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-120 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-120-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-120-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-121 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-122 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-123 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-124 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-124-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-125 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-126 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-126-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-126-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-127 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-128 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-128-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-129 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-130 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-131 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-132 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-132-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-132-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-133 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-134 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-135 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-135-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-136 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-136-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-137 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-138 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-138-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-139 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-140 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-140-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-141 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-142 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-143 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-144 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-144-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-144-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-144-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-145 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-146 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-147 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-148 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-148-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-149 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-150 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-150-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-151 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-152 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-152-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-153 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-153-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-154 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-155 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-156 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-156-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-156-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-157 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-158 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-159 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-160 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-160-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-161 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-162 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-162-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-162-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-163 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-164 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-164-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-165 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-166 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-167 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-168 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-168-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-168-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-169 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-170 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-171 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-171-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-172 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-172-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-173 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-174 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-174-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-175 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-176 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-176-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-177 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-178 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-179 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-180 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-180-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-180-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-180-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-181 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-182 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-183 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-184 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-184-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-185 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-186 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-186-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-187 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-188 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-188-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-189 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-189-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-190 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-191 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-192 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-192-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-192-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-193 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-194 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-195 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-196 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-196-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-197 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-198 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-198-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-198-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-199 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-200 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-200-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-201 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-202 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-203 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-204 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-204-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-204-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-205 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-206 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-207 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-207-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-208 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-208-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-209 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-210 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-210-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-211 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-212 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-212-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-213 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-214 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-215 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-216 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-216-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-216-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-216-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-217 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-218 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-219 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-220 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-220-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-221 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-222 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-222-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-223 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-224 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-224-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-225 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-225-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-226 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-227 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-228 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-228-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-228-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-229 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-230 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-231 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-232 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-232-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-233 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-234 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-234-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-234-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-235 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-236 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-236-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-237 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-238 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-239 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-240 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-240-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-240-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-241 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-242 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-243 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-243-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-244 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-244-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-245 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-246 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-246-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-247 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-248 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-248-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-249 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-250 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-251 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-252 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-252-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-252-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-252-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-253 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-254 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-255 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-256 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-256-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-257 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-258 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-258-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-259 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-260 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-260-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-261 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-261-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-262 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-263 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-264 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-264-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-264-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-265 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-266 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-267 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-268 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-268-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-269 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-270 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-270-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-270-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-271 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-272 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-272-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-273 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-274 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-275 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-276 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-276-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-276-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-277 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-278 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-279 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-279-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-280 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-280-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-281 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-282 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-282-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-283 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-284 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-284-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-285 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-286 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-287 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-288 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-288-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-288-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-288-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-289 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-290 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-291 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-292 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-292-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-293 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-294 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-294-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
WF-295 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-296 | Actor: returning user | Goal: review savings | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-296-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-297 | Actor: power analyst | Goal: inspect forecast | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-297-ACCESS | The scenario must be achievable with keyboard navigation for interactive controls.
WF-298 | Actor: mobile user | Goal: investigate anomaly | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-299 | Actor: import operator | Goal: ask AI | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-300 | Actor: first-time user | Goal: understand spending | Start from the appropriate entry point, inspect the visual evidence, open the underlying analytical context, and complete the next action without losing user context or filters.
WF-300-EMPTY | The scenario must define a graceful outcome when the dataset does not contain enough information.
WF-300-ERROR | The scenario must preserve context and offer a retry or alternative route when a dependent service fails.
## 20. Workflow Completion Rules
A workflow is complete when the user can understand the result, inspect evidence, and move to the next relevant screen without ambiguity.

- No dead-end analytical cards.
- No unsupported AI recommendation presented as fact.
- No forecast without an explicit estimate label.
- No unexplained anomaly score.
- No filter state hidden from the user.

## 21. Extended User Workflow Acceptance Paths

A user imports twelve months of transactions and sees a completed overview without manually configuring every chart.

The user selects six months and every eligible overview visualization updates to the same date window.

The user switches from six months to one year and the chart granularity adjusts without breaking the layout.

The user opens a spending increase and reaches a category explanation with the same filter context.

The user selects Food and sees its historical trend without unrelated categories dominating the chart.

The user opens the category driver and can navigate to supporting transactions.

The user checks savings and sees both savings amount and savings rate.

The user checks investments and sees contributions separated from general income.

The user opens Prediction Center and sees actual history followed by visually distinct forecast data.

The user sees the forecast model or model family when the product chooses to expose implementation metadata.

The user sees an estimated range only when interval data exists.

The user sees an explanatory list of forecast drivers.

The user can return from prediction details to the overview without losing the selected period.

The user opens an anomaly and sees the user's baseline behavior used for the comparison.

The user can mark an anomaly reviewed without deleting the source transaction.

The user asks the AI assistant whether spending is higher than normal.

The AI answer includes the relevant percentage and a link to the spending analysis.

The AI answer does not invent a value when the analytics service returns insufficient data.

The user asks a follow-up question about the same period and the assistant preserves context.

The user receives an error when a dependent service is unavailable, but the rest of the page remains usable.

The user sees stale-data or last-updated context when cached analytics are displayed after a transient failure.

The user switches to mobile and the main financial story is preserved in the order summary, trend, forecast, category drivers, insights, and transactions.

The user expands a chart on mobile and can inspect detailed tooltips without the chart leaving the viewport.

The user navigates with only a keyboard and can reach date filters, series toggles, and page actions.

The user receives descriptive labels for improving, concerning, warning, and stable states.

The user imports malformed rows and receives row-level validation feedback before committing data.

The user sees duplicate rows identified during import before confirmation.

The user cancels an import and no partial dataset becomes visible as committed financial activity.

The user deletes their data and receives a clear confirmation of completion.

The user exports their information through an explicit data-export workflow.

The user opens settings and understands the scope of analytics and AI processing.

The user can distinguish historical observation, model estimate, and AI interpretation on every applicable surface.

## 22. Persona-Based Flows

Persona A: new user with no imported data begins at the welcome state and is guided toward import.

Persona B: returning user checks whether monthly spending improved.

Persona C: analytical user compares category behavior across twelve months.

Persona D: investor reviews monthly contribution consistency.

Persona E: user investigates a large unusual transaction.

Persona F: mobile user checks the forecast during a commute.

Persona G: user asks the assistant for an explanation of a spending increase.

Persona H: user has insufficient data and receives a useful explanation instead of a fabricated forecast.

Persona I: user experiences an AI provider outage but can still use core analytics.

Persona J: user imports a file containing mixed signs and receives normalized previews before commit.

## 23. Workflow Guardrails

Never silently change the selected date range when moving between analytical pages.

Never reset a category filter without explaining why the filter is unavailable on the destination page.

Never show a forecast as though it were a completed transaction.

Never describe an anomaly as confirmed fraud.

Never expose another user's transaction during a shared-client request.

Never require an AI response before allowing the user to inspect raw analytics.

Never block the dashboard because a secondary insight card failed.

Never discard a valid import merely because some rows are invalid; instead support an explicit row-handling decision.

Never hide insufficient-data conditions behind generic loading spinners.

Never make a recommendation appear mandatory.

Never use animation to conceal latency or incomplete data.

Never show a confidence value that was not derived from an actual model or defined heuristic.

Never imply that a prediction is a guarantee.

Never remove the distinction between historical and forecast values on mobile.

Never let filter controls become inaccessible after a responsive layout change.

Never create a dead-end error page when a local component can recover independently.

Never force the user to navigate back multiple times to understand a chart's evidence.

Always provide an understandable next action for empty, warning, and error states.

Always preserve the meaning of the user's selected period.

Always keep analytical terminology understandable to non-ML users.

Always make the source of a major number traceable to a metric or transaction context.

## 24. Workflow Measurement

Measure time from first import completion to first meaningful dashboard interaction.

Measure time from detecting a spending change to opening its supporting category analysis.

Measure completion rate for prediction-center visits.

Measure anomaly review completion rate.

Measure successful AI assistant question resolution when a relevant analytical answer exists.

Measure failure recovery rate after API errors.

Measure import completion rate for valid CSV files.

Measure abandonment during column mapping.

Measure mobile chart interaction completion.

Use these measurements to improve the workflow without manipulating financial information or obscuring uncertainty.
