import React, { useState } from 'react';
import { useGlobalFilter } from '../context/GlobalFilterContext';
import { useSavingsIntelligence } from '../api/savings';
import { SavingsTrajectoryChart } from '../components/savings/SavingsTrajectoryChart';
import { EmergencyFundCard } from '../components/savings/EmergencyFundCard';
import { SavingsHistoryTable } from '../components/savings/SavingsHistoryTable';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';
import {
  PiggyBank,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Sparkles,
  Percent,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const SavingsPage: React.FC = () => {
  const { filters } = useGlobalFilter();
  const rangeMonths = filters.range === '30D' ? 3 : filters.range === '90D' ? 3 : filters.range === '1Y' ? 12 : 6;
  const [selectedMonths, setSelectedMonths] = useState<number>(rangeMonths);

  React.useEffect(() => {
    setSelectedMonths(rangeMonths);
  }, [rangeMonths]);

  const { data, isLoading, error, refetch } = useSavingsIntelligence(selectedMonths);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-textPrimary">Savings Intelligence</h1>
            <p className="text-xs text-textSecondary">Real-time savings rate tracking and emergency reserve analysis</p>
          </div>
        </div>
        <div className="rounded-xl border border-negative/30 bg-negative/10 p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-negative mb-2" />
          <h3 className="text-sm font-semibold text-textPrimary mb-1">Failed to load savings intelligence</h3>
          <p className="text-xs text-textSecondary mb-4">
            {(error as any)?.message || 'An unexpected error occurred while fetching savings metrics.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-textPrimary hover:bg-cardElevated inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const currentSavings = data?.current_savings_amount ?? 0;
  const currentRate = data?.current_savings_rate ?? 0;
  const momChange = data?.mom_change_rate ?? 0;
  const status = data?.status ?? 'STABLE';
  const avgRate = data?.average_savings_rate_6m ?? 0;
  const efCoverage = data?.emergency_fund?.months_of_coverage ?? 0;
  const projectedSavings = data?.projected_next_month_savings ?? 0;
  const projectedRate = data?.projected_next_month_rate ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-positive/10 border border-positive/20 flex items-center justify-center text-positive">
              <PiggyBank size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-textPrimary">Savings Intelligence</h1>
              <p className="text-xs text-textSecondary">
                Personal savings rate trajectory, 20% benchmark pacing, and emergency reserve buffer
              </p>
            </div>
          </div>
        </div>

        {/* Time Window Selector */}
        <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonths(m)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                selectedMonths === m
                  ? 'bg-cardElevated text-textPrimary shadow-sm border border-borderLight'
                  : 'text-textSecondary hover:text-textPrimary hover:bg-card/50'
              }`}
            >
              {m} Months
            </button>
          ))}
        </div>
      </div>

      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current Month Net Savings */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-textMuted mb-2">
            <span>Net Monthly Savings</span>
            <PiggyBank size={16} className="text-positive" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono text-textPrimary">
              {isLoading ? '...' : formatCurrency(currentSavings)}
            </span>
            <Badge
              variant={status === 'IMPROVING' ? 'positive' : status === 'CONCERNING' ? 'negative' : 'default'}
              size="sm"
              className="flex items-center gap-1"
            >
              {momChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {momChange >= 0 ? `+${momChange}%` : `${momChange}%`} MoM
            </Badge>
          </div>
          <p className="text-[11px] text-textSecondary mt-2">
            Direction: <strong className="text-textPrimary capitalize">{data?.direction?.toLowerCase() || 'stable'}</strong>
          </p>
        </div>

        {/* Card 2: Current Savings Rate */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-textMuted mb-2">
            <span>Current Savings Rate</span>
            <Percent size={16} className="text-primary" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono text-positive">
              {isLoading ? '...' : `${currentRate}%`}
            </span>
            <Badge variant={currentRate >= 20 ? 'positive' : 'warning'} size="sm">
              {currentRate >= 20 ? 'Above 20% Target' : 'Below 20% Target'}
            </Badge>
          </div>
          <p className="text-[11px] text-textSecondary mt-2">
            Benchmark: <strong className="text-warning">20.0%</strong> ({currentRate >= 20 ? `+${(currentRate - 20).toFixed(1)}%` : `${(currentRate - 20).toFixed(1)}%`})
          </p>
        </div>

        {/* Card 3: 6-Month Average Savings Rate */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-textMuted mb-2">
            <span>Average Savings Rate ({selectedMonths}m)</span>
            <Calendar size={16} className="text-textSecondary" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono text-textPrimary">
              {isLoading ? '...' : `${avgRate}%`}
            </span>
            <Badge variant="default" size="sm">
              Historical Mean
            </Badge>
          </div>
          <p className="text-[11px] text-textSecondary mt-2">
            Consistent capital accumulation baseline
          </p>
        </div>

        {/* Card 4: Emergency Reserve Runway */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-textMuted mb-2">
            <span>Emergency Reserve Runway</span>
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono text-textPrimary">
              {isLoading ? '...' : `${efCoverage} Mo`}
            </span>
            <Badge
              variant={
                data?.emergency_fund?.status === 'EXCELLENT'
                  ? 'positive'
                  : data?.emergency_fund?.status === 'ADEQUATE'
                  ? 'warning'
                  : 'negative'
              }
              size="sm"
            >
              {data?.emergency_fund?.status === 'EXCELLENT'
                ? '6+ Mo Buffer'
                : data?.emergency_fund?.status === 'ADEQUATE'
                ? '3-6 Mo Buffer'
                : '< 3 Mo Buffer'}
            </Badge>
          </div>
          <p className="text-[11px] text-textSecondary mt-2">
            Liquid balance: <strong className="text-textPrimary">{formatCurrency(data?.emergency_fund?.liquid_balance || 0)}</strong>
          </p>
        </div>
      </div>

      {/* Next Month ML Projection Callout Banner */}
      <div className="rounded-xl border border-ai/30 bg-gradient-to-r from-ai/10 via-card to-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ai/20 border border-ai/30 flex items-center justify-center text-ai shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-textPrimary">Next Month ML Forecast Horizon</h4>
              <Badge variant="ai" size="sm">
                Projected
              </Badge>
            </div>
            <p className="text-xs text-textSecondary mt-0.5">
              Based on historical income stability and expense velocity momentum:
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-textMuted block text-[10px]">PROJECTED SAVINGS</span>
            <span className="text-positive font-bold text-sm">{formatCurrency(projectedSavings)}</span>
          </div>
          <div className="h-6 w-px bg-borderLight/60" />
          <div className="text-right">
            <span className="text-textMuted block text-[10px]">PROJECTED RATE</span>
            <span className="text-ai font-bold text-sm">{projectedRate}%</span>
          </div>
        </div>
      </div>

      {/* Emergency Fund Card */}
      {data?.emergency_fund && (
        <EmergencyFundCard
          emergencyFund={data.emergency_fund}
          isLoading={isLoading}
        />
      )}

      {/* Savings Trajectory Chart */}
      <SavingsTrajectoryChart
        trajectory={data?.trajectory || []}
        averageSavingsRate={avgRate}
        isLoading={isLoading}
      />

      {/* Historical Ledger Table */}
      <SavingsHistoryTable
        trajectory={data?.trajectory || []}
        isLoading={isLoading}
      />
    </div>
  );
};
