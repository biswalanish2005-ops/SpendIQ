from fastapi import APIRouter
from app.api.routes import (
    auth,
    transactions,
    accounts,
    categories,
    analytics,
    predictions,
    anomalies,
    savings_investments,
    insights,
    assistant,
    imports,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["Accounts"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(savings_investments.router, prefix="/analytics", tags=["Savings & Investments"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])
api_router.include_router(anomalies.router, prefix="/anomalies", tags=["Anomalies"])
api_router.include_router(insights.router, prefix="/insights", tags=["AI Insights"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["AI Assistant"])
api_router.include_router(imports.router, prefix="/import", tags=["Data Import"])


