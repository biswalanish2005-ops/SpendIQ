import React, { useState } from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { ChartContainer } from '../components/charts/ChartContainer';
import { ChartTooltip } from '../components/charts/ChartTooltip';
import { CHART_THEME } from '../components/charts/chartTheme';
import { CategoryPreviewCard } from '../components/dashboard/CategoryPreviewCard';
import { RecentActivityTable } from '../components/dashboard/RecentActivityTable';
import { useGlobalFilter } from '../context/GlobalFilterContext';
import {
  useCashFlowOverview,
  useSpendingTrend,
  useCategoryBreakdown,
  useRecentTransactions,
} from '../api/analytics';
import { useSpendingForecast } from '../api/predictions';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export const OverviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { filters, effectiveDates } = useGlobalFilter();

  // Live analytics queries scoped by global filters
  const {
    data: cashFlow,
    isLoading: isCashFlowLoading,
    isError: isCashFlowError,
    refetch: refetchCashFlow,
  } = useCashFlowOverview(filters.accountId, effectiveDates.startDate, effectiveDates.endDate);

  const {
    data: trendData,
    isLoading: isTrendLoading,
    refetch: refetchTrend,
  } = useSpendingTrend(6, filters.accountId);

  const {
    data: categoryData,
    isLoading: isCategoryLoading,
    refetch: refetchCategories,
  } = useCategoryBreakdown(effectiveDates.startDate, effectiveDates.endDate, filters.accountId);

  const {
    data: recentTxData,
    isLoading: isTxLoading,
    refetch: refetchTx,
  } = useRecentTransactions(5);

  const {
    data: forecastData,
    refetch: refetchForecast,
  } = useSpendingForecast(1, 0.80);

  const handleRefreshAll = () => {
    refetchCashFlow();
    refetchTrend();
    refetchCategories();
    refetchTx();
    refetchForecast();
  };

  const baselineValue = trendData?.historical_baseline ? Number(trendData.historical_baseline) : 3600;

  // Seamlessly bridge actual points with the 1-month ML forecast point
  const chartPoints = React.useMemo(() => {
    if (!trendData?.points) return [];
    const points = trendData.points.map((p) => ({
      ...p,
      forecast: null as number | null,
    }));
    if (forecastData?.timeline && points.length > 0) {
      const forecastItem = forecastData.timeline.find((t) => t.is_forecast);
      if (forecastItem && forecastItem.forecast_amount !== null) {
        // Bridge from the last actual point
        const lastIdx = points.length - 1;
        points[lastIdx].forecast = Number(points[lastIdx].actual);
        points.push({
          period: forecastItem.period_label.split(' ')[0],
          date: forecastItem.period_date,
          actual: null as any,
          forecast: forecastItem.forecast_amount,
          historical_average: baselineValue as any,
        });
      }
    }
    return points;
  }, [trendData?.points, forecastData?.timeline, baselineValue]);

  if (isCashFlowError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Analytics Service Unavailable"
          message="Failed to retrieve verified cash flow records from the analytics backend. Please verify server connection."
          onRetry={handleRefreshAll}
        />
      </div>
    );
  }

  const spending = cashFlow?.spending;
  const savings = cashFlow?.savings;
  const income = cashFlow?.income;
  const investments = cashFlow?.investments;
  const savingsRate = cashFlow?.savings_rate;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Platform Welcome & Section Header */}
      <SectionHeader
        title="Financial Overview"
        subtitle={
          cashFlow
            ? `Verified cash flow metrics and behavioral intelligence for ${cashFlow.period_label}.`
            : 'Holistic cash flow intelligence, behavioral trends, and AI-assisted projections.'
        }
        badge={
          <Badge variant="ai" size="sm">
            <Sparkles size={11} className="mr-1 text-ai" />
            Deterministic Engine Active
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefreshAll}
              leftIcon={<RefreshCw size={13} />}
            >
              Sync Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<SlidersHorizontal size={13} />}
            >
              Preferences
            </Button>
          </div>
        }
      />

      {/* KPI Metric Cards Grid - Live Data with Backend Semantic Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isCashFlowLoading || !spending ? (
          <>
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </>
        ) : (
          <>
            {/* Metric 1: Monthly Spending */}
            <MetricCard
              label={spending.label}
              amount={Number(spending.current)}
              changePercent={Number(spending.change_percent)}
              status={spending.status}
              statusLabel={spending.status_label}
              comparisonPeriod="last month"
              historicalAverage={spending.historical_average ? Number(spending.historical_average) : undefined}
              sparklineData={spending.sparkline.map(Number)}
              icon={<Wallet size={16} />}
            />

            {/* Metric 2: Monthly Savings */}
            {savings && (
              <MetricCard
                label={savings.label}
                amount={Number(savings.current)}
                changePercent={Number(savings.change_percent)}
                status={savings.status}
                statusLabel={savings.status_label}
                comparisonPeriod="last month"
                historicalAverage={savings.historical_average ? Number(savings.historical_average) : undefined}
                sparklineData={savings.sparkline.map(Number)}
                icon={<PiggyBank size={16} />}
              />
            )}

            {/* Metric 3: Total Income */}
            {income && (
              <MetricCard
                label={income.label}
                amount={Number(income.current)}
                changePercent={Number(income.change_percent)}
                status={income.status}
                statusLabel={income.status_label}
                comparisonPeriod="last month"
                historicalAverage={income.historical_average ? Number(income.historical_average) : undefined}
                sparklineData={income.sparkline.map(Number)}
                icon={<TrendingUp size={16} />}
              />
            )}

            {/* Metric 4: Investment Contributions */}
            {investments && (
              <MetricCard
                label={investments.label}
                amount={Number(investments.current)}
                changePercent={Number(investments.change_percent)}
                status={investments.status}
                statusLabel={investments.status_label}
                comparisonPeriod="last month"
                historicalAverage={investments.historical_average ? Number(investments.historical_average) : undefined}
                sparklineData={investments.sparkline.map(Number)}
                icon={<ArrowUpRight size={16} />}
              />
            )}
          </>
        )}
      </div>

      {/* Primary Narrative Spending Chart Container */}
      <ChartContainer
        title="Historical Spending Trajectory & Baseline"
        subtitle="Multi-month verified transaction trajectory compared against your 6-month baseline average."
        badge={
          <Badge variant="outline" size="sm">
            Baseline: {formatCurrency(baselineValue)}
          </Badge>
        }
        actions={
          <Tabs
            tabs={[
              { id: 'all', label: 'All Expenses' },
              { id: 'discretionary', label: 'Discretionary' },
              { id: 'fixed', label: 'Recurring' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        }
        height={360}
        isLoading={isTrendLoading}
        legend={
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-primary" />
              <span>Actual History (Monthly Sum)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 border-b border-dotted border-textMuted" />
              <span>Historical Baseline ({formatCurrency(baselineValue)})</span>
            </div>
            {forecastData?.projected_next_month && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-400" />
                <span>Next-Month Forecast ({formatCurrency(forecastData.projected_next_month)})</span>
              </div>
            )}
          </>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartPoints}
            margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              stroke={CHART_THEME.colors.grid}
              strokeDasharray={CHART_THEME.grid.strokeDasharray}
              vertical={false}
            />
            <XAxis
              dataKey="period"
              stroke={CHART_THEME.colors.axis}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#26313D' }}
            />
            <YAxis
              stroke={CHART_THEME.colors.axis}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              content={<ChartTooltip formatter={(val) => formatCurrency(val)} />}
            />
            <ReferenceLine
              y={baselineValue}
              stroke={CHART_THEME.colors.average}
              strokeDasharray="3 3"
              label={{
                value: `Baseline (${formatCurrency(baselineValue)})`,
                fill: '#64748B',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
            {/* Actual Spending Line: Solid */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual Spend"
              stroke={CHART_THEME.colors.actual}
              strokeWidth={2.4}
              dot={{ r: 4, fill: CHART_THEME.colors.actual }}
              activeDot={{ r: 6, fill: '#60A5FA' }}
              connectNulls={false}
            />
            {/* Forecast Line: Dashed */}
            <Line
              type="monotone"
              dataKey="forecast"
              name="Forecast Projection"
              stroke={CHART_THEME.colors.forecast}
              strokeWidth={2.2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: CHART_THEME.colors.forecast }}
              activeDot={{ r: 6, fill: '#22D3EE' }}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Two Column Grid: Category Breakdown Preview + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPreviewCard
          data={categoryData}
          isLoading={isCategoryLoading}
        />
        <RecentActivityTable
          transactions={recentTxData?.items}
          isLoading={isTxLoading}
        />
      </div>

      {/* Savings Rate & Financial Health Banner */}
      {savingsRate && (
        <div className="p-5 rounded-xl border border-border bg-cardElevated flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
                Monthly Savings Rate
              </span>
              <Badge variant="positive" size="sm">
                {savingsRate.current}% of Income
              </Badge>
            </div>
            <p className="text-xs text-textMuted max-w-xl">
              You retained <strong className="text-textPrimary font-mono">{savingsRate.current}%</strong> of your net monthly earnings after all fixed leases and discretionary expenses.
            </p>
          </div>
          <div className="text-right sm:border-l sm:border-border sm:pl-6">
            <div className="text-[11px] text-textMuted">Average Daily Expenditure</div>
            <div className="text-lg font-mono font-bold text-textPrimary">
              {formatCurrency(Number(cashFlow?.average_daily_spend || 0))}/day
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
