import React, { useState } from 'react';
import { useGlobalFilter } from '../context/GlobalFilterContext';
import { useInvestmentIntelligence } from '../api/investments';
import { InvestmentCadenceChart } from '../components/investments/InvestmentCadenceChart';
import { AssetAllocationCard } from '../components/investments/AssetAllocationCard';
import { InvestmentHistoryTable } from '../components/investments/InvestmentHistoryTable';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Award,
  Wallet,
  Landmark,
  PieChart,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const InvestmentsPage: React.FC = () => {
  const { filters } = useGlobalFilter();
  const rangeMonths = filters.range === '30D' ? 3 : filters.range === '90D' ? 3 : filters.range === '1Y' ? 12 : 6;
  const [selectedMonths, setSelectedMonths] = useState<number>(rangeMonths);

  React.useEffect(() => {
    setSelectedMonths(rangeMonths);
  }, [rangeMonths]);

  const { data, isLoading, error, refetch } = useInvestmentIntelligence(selectedMonths);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-textPrimary">Investment Intelligence</h1>
            <p className="text-xs text-textSecondary">Portfolio contribution cadence and asset allocation</p>
          </div>
        </div>
        <div className="rounded-xl border border-negative/30 bg-negative/10 p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-negative mb-2" />
          <h3 className="text-sm font-semibold text-textPrimary mb-1">Failed to load investment intelligence</h3>
          <p className="text-xs text-textSecondary mb-4">
            {(error as any)?.message || 'An unexpected error occurred while fetching investment metrics.'}
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

  const currentContribution = data?.current_monthly_contribution ?? 0;
  const incomeShare = data?.income_share_percentage ?? 0;
  const momChange = data?.mom_change_percentage ?? 0;
  const status = data?.status ?? 'STABLE';
  const consistencyScore = data?.consistency_score ?? 0;
  const portfolioBalance = data?.total_portfolio_balance ?? 0;
  const projectedContribution = data?.projected_next_month_contribution ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <TrendingUp size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-textPrimary">Investment Intelligence</h1>
              <p className="text-xs text-textSecondary">
                Monthly contribution cadence, income allocation share, and portfolio asset allocation
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
        {/* Card 1: Current Monthly Contribution */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-textMuted mb-2">
            <span>Monthly Contribution</span>
            <Wallet size={16} className="text-positive" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono text-textPrimary">
              {isLoading ? '...' : formatCurrency(currentContribution)}
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

        {/* Card 2: Income Share Percentage */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-textMuted mb-2">
            <span>Income Allocation Share</span>
            <PieChart size={16} className="text-primary" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono text-textPrimary">
              {isLoading ? '...' : `${incomeShare}%`}
            </span>
            <Badge variant="default" size="sm">
              of Gross Income
            </Badge>
          </div>
          <p className="text-[11px] text-textSecondary mt-2">
            Proportion of payroll deployed into assets
          </p>
        </div>

        {/* Card 3: Consistency Index Score */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-textMuted mb-2">
            <span>Consistency Index</span>
            <Award size={16} className="text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono text-textPrimary">
              {isLoading ? '...' : `${consistencyScore}%`}
            </span>
            <Badge variant={consistencyScore >= 80 ? 'positive' : 'warning'} size="sm">
              {consistencyScore >= 80 ? 'High Regularity' : 'Irregular'}
            </Badge>
          </div>
          <p className="text-[11px] text-textSecondary mt-2">
            Recurring contribution deposit reliability
          </p>
        </div>

        {/* Card 4: Total Portfolio Balance */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-textMuted mb-2">
            <span>Investment Portfolio</span>
            <Landmark size={16} className="text-ai" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold font-mono text-positive">
              {isLoading ? '...' : formatCurrency(portfolioBalance)}
            </span>
            <Badge variant="positive" size="sm">
              Active Holdings
            </Badge>
          </div>
          <p className="text-[11px] text-textSecondary mt-2">
            Total brokerage and retirement assets
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
              <h4 className="text-xs font-semibold text-textPrimary">Next Month Contribution Forecast</h4>
              <Badge variant="ai" size="sm">
                Projected
              </Badge>
            </div>
            <p className="text-xs text-textSecondary mt-0.5">
              Based on historical dollar-cost averaging habit and cash flow surplus:
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-textMuted block text-[10px]">PROJECTED DEPOSIT</span>
            <span className="text-positive font-bold text-sm">{formatCurrency(projectedContribution)}</span>
          </div>
          <div className="h-6 w-px bg-borderLight/60" />
          <div className="text-right">
            <span className="text-textMuted block text-[10px]">STRATEGY</span>
            <span className="text-ai font-bold text-sm">Automated DCA</span>
          </div>
        </div>
      </div>

      {/* Investment Cadence Chart */}
      <InvestmentCadenceChart
        cadence={data?.cadence || []}
        isLoading={isLoading}
      />

      {/* Asset Allocation Breakdown Card */}
      <AssetAllocationCard
        allocations={data?.allocations || []}
        totalPortfolioBalance={portfolioBalance}
        isLoading={isLoading}
      />

      {/* Historical Contribution Table */}
      <InvestmentHistoryTable
        cadence={data?.cadence || []}
        isLoading={isLoading}
      />
    </div>
  );
};
