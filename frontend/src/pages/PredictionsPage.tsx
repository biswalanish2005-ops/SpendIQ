import React, { useState } from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ErrorState } from '../components/ui/ErrorState';
import { ForecastTimelineChart } from '../components/predictions/ForecastTimelineChart';
import { SpendingDriversCard } from '../components/predictions/SpendingDriversCard';
import { CategoryForecastTable } from '../components/predictions/CategoryForecastTable';
import { ModelEvaluationCard } from '../components/predictions/ModelEvaluationCard';
import {
  useSpendingForecast,
  useRecomputeForecast,
} from '../api/predictions';
import { formatCurrency } from '../lib/utils';
import {
  Sparkles,
  RefreshCw,
  ShieldCheck,
  PiggyBank,
  Calendar,
} from 'lucide-react';

export const PredictionsPage: React.FC = () => {
  const [horizonMonths, setHorizonMonths] = useState<number>(3);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.80);

  const {
    data: forecast,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useSpendingForecast(horizonMonths, confidenceLevel);

  const recomputeMutation = useRecomputeForecast();

  const handleRecompute = () => {
    recomputeMutation.mutate({
      horizonMonths,
      confidenceLevel,
    });
  };

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Predictive Engine Unavailable"
          message="Failed to generate or retrieve time-series forecast models. Ensure backend analytics service is running."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const projectedSpend = forecast?.projected_next_month || 0;
  const histAverage = forecast?.historical_monthly_average || 0;
  const changePct = forecast?.expected_change_pct || 0;
  const lowerBound = forecast?.next_month_lower_bound || 0;
  const upperBound = forecast?.next_month_upper_bound || 0;
  const savingsForecast = forecast?.savings_forecast;
  const baselineDelta = projectedSpend - histAverage;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <SectionHeader
          title="Predictive Financial Intelligence"
          subtitle="Time-series machine learning forecasting with empirical prediction intervals and driver decomposition."
        />

        {/* Global Controls: Horizon, Confidence, and Recompute */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Horizon Selector */}
          <div className="flex items-center rounded-lg border border-border bg-card p-1 text-xs font-mono">
            <span className="text-textMuted px-2 flex items-center gap-1">
              <Calendar size={12} /> Horizon:
            </span>
            {[1, 3, 6].map((m) => (
              <button
                key={m}
                onClick={() => setHorizonMonths(m)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  horizonMonths === m
                    ? 'bg-primary text-white font-semibold'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                {m}M
              </button>
            ))}
          </div>

          {/* Confidence Interval Selector */}
          <div className="flex items-center rounded-lg border border-border bg-card p-1 text-xs font-mono">
            <span className="text-textMuted px-2 flex items-center gap-1">
              <ShieldCheck size={12} /> CI:
            </span>
            {[0.80, 0.95].map((c) => (
              <button
                key={c}
                onClick={() => setConfidenceLevel(c)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  confidenceLevel === c
                    ? 'bg-ai/20 text-ai border border-ai/30 font-semibold'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                {Math.round(c * 100)}%
              </button>
            ))}
          </div>

          {/* Recompute Forecast Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecompute}
            disabled={recomputeMutation.isPending || isFetching}
            className="border-ai/30 text-ai hover:bg-ai/10 hover:border-ai"
          >
            <RefreshCw
              size={13}
              className={`mr-1.5 ${recomputeMutation.isPending || isFetching ? 'animate-spin' : ''}`}
            />
            {recomputeMutation.isPending ? 'Training Model...' : 'Recompute Model'}
          </Button>
        </div>
      </div>

      {/* Model Metadata Status Bar */}
      {forecast?.run && (
        <div className="px-4 py-2.5 rounded-lg border border-ai/20 bg-ai/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-ai" />
            <span className="text-textSecondary">Active Model:</span>
            <span className="font-semibold text-textPrimary">{forecast.run.model_name}</span>
            <Badge variant="ai" size="sm">
              v{forecast.run.model_version}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-textMuted font-mono text-[11px]">
            <span>Horizon: {forecast.run.horizon_days} Days</span>
            <span>Confidence Interval: {forecast.confidence_interval_pct}%</span>
            <span>Target: TOTAL_SPENDING</span>
          </div>
        </div>
      )}

      {/* 4 Hero Predictive Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Projected Next-Month Spend */}
        <MetricCard
          label="Projected Next-Month Spend"
          amount={projectedSpend}
          changePercent={Math.abs(changePct)}
          status={forecast?.status}
          statusLabel={forecast?.status === 'CONCERNING' ? 'Variance Above Baseline' : 'Controlled Pacing'}
          comparisonPeriod="current month"
          historicalAverage={histAverage}
        />

        {/* Metric 2: Confidence Interval Range */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-card flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
                {forecast?.confidence_interval_pct || 80}% Prediction Range
              </span>
              <Badge variant="neutral" size="sm">
                ±{formatCurrency((upperBound - lowerBound) / 2)}
              </Badge>
            </div>
            <div className="text-2xl font-bold font-mono text-textPrimary mt-2">
              {formatCurrency(lowerBound)} – {formatCurrency(upperBound)}
            </div>
          </div>
          <div className="text-xs text-textMuted pt-3 mt-2 border-t border-border/60">
            Analytical band based on residual standard error ($z={confidenceLevel <= 0.8 ? '1.28' : '1.96'}$)
          </div>
        </div>

        {/* Metric 3: Baseline Deviation */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-card flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
                Historical Baseline
              </span>
              <span className="text-xs font-mono text-textMuted">
                {formatCurrency(histAverage)}/mo
              </span>
            </div>
            <div className="text-2xl font-bold font-mono mt-2 flex items-center gap-2">
              <span className={baselineDelta > 0 ? 'text-negative' : 'text-positive'}>
                {baselineDelta > 0 ? '+' : ''}
                {formatCurrency(baselineDelta)}
              </span>
            </div>
          </div>
          <div className="text-xs text-textMuted pt-3 mt-2 border-t border-border/60 flex items-center justify-between">
            <span>Projected vs Baseline</span>
            <Badge variant={baselineDelta > 0 ? 'negative' : 'positive'} size="sm">
              {baselineDelta > 0 ? 'Above Normal' : 'Below Normal'}
            </Badge>
          </div>
        </div>

        {/* Metric 4: Projected Savings Rate */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-card flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
                Projected Savings Rate
              </span>
              <PiggyBank size={16} className="text-positive" />
            </div>
            <div className="text-2xl font-bold font-mono text-textPrimary mt-2">
              {savingsForecast?.projected_savings_rate || 0}%
            </div>
          </div>
          <div className="text-xs text-textMuted pt-3 mt-2 border-t border-border/60 flex items-center justify-between">
            <span>Expected Retained:</span>
            <span className="font-mono font-semibold text-positive">
              {formatCurrency(savingsForecast?.projected_savings_amount || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Visualizations Grid: Timeline Chart + Spending Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ForecastTimelineChart
            timeline={forecast?.timeline || []}
            historicalAverage={histAverage}
            confidenceLevelPct={forecast?.confidence_interval_pct || 80}
            isLoading={isLoading}
          />
        </div>

        <div>
          <SpendingDriversCard
            drivers={forecast?.drivers || []}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Category Trajectories Table */}
      <CategoryForecastTable
        categories={forecast?.category_forecasts || []}
        isLoading={isLoading}
      />

      {/* Model Performance & Evaluation */}
      {forecast?.run && (
        <ModelEvaluationCard
          run={forecast.run}
          confidenceLevelPct={forecast.confidence_interval_pct || 80}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default PredictionsPage;
