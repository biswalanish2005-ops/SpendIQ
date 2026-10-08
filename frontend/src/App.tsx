import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PageSkeleton } from './components/common/PageSkeleton';
import { GlobalFilterProvider } from './context/GlobalFilterContext';

// ─── Lazy-loaded page modules for code splitting ──────────────────────────────
// Each page loads as a separate JS chunk, reducing initial bundle size.
const OverviewPage     = lazy(() => import('./pages/OverviewPage').then(m => ({ default: m.OverviewPage })));
const AnalyticsPage    = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SavingsPage      = lazy(() => import('./pages/SavingsPage').then(m => ({ default: m.SavingsPage })));
const InvestmentsPage  = lazy(() => import('./pages/InvestmentsPage').then(m => ({ default: m.InvestmentsPage })));
const PredictionsPage  = lazy(() => import('./pages/PredictionsPage').then(m => ({ default: m.PredictionsPage })));
const AnomaliesPage    = lazy(() => import('./pages/AnomaliesPage').then(m => ({ default: m.AnomaliesPage })));
const InsightsPage     = lazy(() => import('./pages/InsightsPage').then(m => ({ default: m.InsightsPage })));
const AssistantPage    = lazy(() => import('./pages/AssistantPage').then(m => ({ default: m.AssistantPage })));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const ImportPage       = lazy(() => import('./pages/ImportPage').then(m => ({ default: m.ImportPage })));
const PlaceholderPage  = lazy(() => import('./pages/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })));

// ─── TanStack Query Client ────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Retry failed queries once; use exponential back-off (default)
      retry: 1,
      // 5-minute staleTime for most data — reduces redundant re-fetches
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
    },
  },
});

// ─── Page wrapper: Suspense + per-page ErrorBoundary ─────────────────────────
// Each route element is isolated: a crash in one page will not break the shell.
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageSkeleton />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Top-level boundary catches shell-level errors */}
      <ErrorBoundary>
        <BrowserRouter>
          <GlobalFilterProvider>
            <AppShell>
              <Routes>
                {/* Overview / Core Dashboard */}
                <Route
                  path="/"
                  element={<PageWrapper><OverviewPage /></PageWrapper>}
                />

                {/* Analytics */}
                <Route
                  path="/analytics"
                  element={<PageWrapper><AnalyticsPage /></PageWrapper>}
                />

                {/* Transactions */}
                <Route
                  path="/transactions"
                  element={<PageWrapper><TransactionsPage /></PageWrapper>}
                />

                {/* Savings */}
                <Route
                  path="/savings"
                  element={<PageWrapper><SavingsPage /></PageWrapper>}
                />

                {/* Investments */}
                <Route
                  path="/investments"
                  element={<PageWrapper><InvestmentsPage /></PageWrapper>}
                />

                {/* Predictions */}
                <Route
                  path="/predictions"
                  element={<PageWrapper><PredictionsPage /></PageWrapper>}
                />

                {/* Insights */}
                <Route
                  path="/insights"
                  element={<PageWrapper><InsightsPage /></PageWrapper>}
                />

                {/* Assistant */}
                <Route
                  path="/assistant"
                  element={<PageWrapper><AssistantPage /></PageWrapper>}
                />

                {/* Anomalies */}
                <Route
                  path="/anomalies"
                  element={<PageWrapper><AnomaliesPage /></PageWrapper>}
                />

                {/* Import */}
                <Route
                  path="/import"
                  element={<PageWrapper><ImportPage /></PageWrapper>}
                />

                {/* Settings — scheduled for Phase 16 */}
                <Route
                  path="/settings"
                  element={
                    <PageWrapper>
                      <PlaceholderPage
                        title="Settings & Preferences"
                        subtitle="Profile details, currency selection, and security configuration."
                        phaseScheduled="Phase 16"
                        description="User account, security keys, and currency formatting preferences."
                      />
                    </PageWrapper>
                  }
                />

                {/* Fallback — redirect unknown paths to overview */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </GlobalFilterProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
