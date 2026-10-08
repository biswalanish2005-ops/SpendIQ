import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartContainer } from '../charts/ChartContainer';
import { CHART_THEME } from '../charts/chartTheme';
import type { MonthlyInvestmentPoint } from '../../api/investments';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { TrendingUp, Sparkles } from 'lucide-react';

interface InvestmentCadenceChartProps {
  cadence: MonthlyInvestmentPoint[];
  isLoading?: boolean;
}

export const InvestmentCadenceChart: React.FC<InvestmentCadenceChartProps> = ({
  cadence,
  isLoading = false,
}) => {
  const chartData = cadence.map((pt) => ({
    period_label: pt.period_label,
    period_date: pt.period_date,
    is_projected: pt.is_projected,
    contribution_amount: pt.contribution_amount,
    actual_contribution: !pt.is_projected ? pt.contribution_amount : null,
    projected_contribution: pt.is_projected ? pt.contribution_amount : null,
    income_share_pct: pt.income_share_pct,
    cumulative_invested: pt.cumulative_invested,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="rounded-lg border border-border bg-cardElevated p-3 shadow-xl backdrop-blur-md min-w-[220px]">
        <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2 mb-2">
          <span className="font-semibold text-xs text-textPrimary">{label}</span>
          {data.is_projected ? (
            <Badge variant="ai" size="sm" className="flex items-center gap-1">
              <Sparkles size={10} /> Projected
            </Badge>
          ) : (
            <span className="text-[10px] text-textMuted font-mono">Actual</span>
          )}
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-textSecondary">
            <span>Contribution Amount:</span>
            <span className="font-mono font-semibold text-positive">
              {formatCurrency(data.contribution_amount)}
            </span>
          </div>
          <div className="flex justify-between items-center text-textSecondary">
            <span>Income Allocation:</span>
            <span className="font-mono text-textPrimary">{data.income_share_pct}% of gross</span>
          </div>
          <div className="flex justify-between items-center font-medium pt-1 border-t border-border/50">
            <span className="text-textSecondary">Cumulative Invested:</span>
            <span className="font-mono text-primary font-semibold">
              {formatCurrency(data.cumulative_invested)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ChartContainer
      title="Investment Contribution Cadence & Cumulative Wealth"
      subtitle="Monthly recurring portfolio deposits and aggregate capital deployed"
      badge={
        <Badge variant="positive" size="sm" className="flex items-center gap-1">
          <TrendingUp size={12} /> DCA Strategy
        </Badge>
      }
      height={340}
      isLoading={isLoading}
      isEmpty={cadence.length === 0}
      emptyTitle="No investment records found"
      legend={
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-textSecondary">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-positive/40 border border-positive" />
            <span>Monthly Deposit ($)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-ai/40 border border-dashed border-ai" />
            <span>Projected Deposit (Est)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-primary" />
            <span>Cumulative Capital Deployed</span>
          </div>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
          <defs>
            <linearGradient id="investBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0.15} />
            </linearGradient>
            <linearGradient id="investProjBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray={CHART_THEME.grid.strokeDasharray}
            stroke={CHART_THEME.grid.stroke}
            opacity={CHART_THEME.grid.opacity}
            vertical={false}
          />

          <XAxis
            dataKey="period_label"
            stroke={CHART_THEME.axis.stroke}
            tick={CHART_THEME.axis.tick}
            tickLine={false}
          />

          {/* Left Axis: Monthly Contribution ($) */}
          <YAxis
            yAxisId="contrib"
            stroke={CHART_THEME.axis.stroke}
            tick={CHART_THEME.axis.tick}
            tickFormatter={(val) => `$${val}`}
            tickLine={false}
            width={45}
          />

          {/* Right Axis: Cumulative Capital ($) */}
          <YAxis
            yAxisId="cumulative"
            orientation="right"
            stroke={CHART_THEME.axis.stroke}
            tick={CHART_THEME.axis.tick}
            tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
            tickLine={false}
            width={45}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Actual Monthly Contribution Bars */}
          <Bar
            yAxisId="contrib"
            dataKey="actual_contribution"
            fill="url(#investBarGrad)"
            stroke="#22C55E"
            strokeWidth={1}
            radius={[4, 4, 0, 0]}
            maxBarSize={45}
          />

          {/* Projected Monthly Contribution Bar */}
          <Bar
            yAxisId="contrib"
            dataKey="projected_contribution"
            fill="url(#investProjBarGrad)"
            stroke="#06B6D4"
            strokeWidth={1}
            strokeDasharray="3 3"
            radius={[4, 4, 0, 0]}
            maxBarSize={45}
          />

          {/* Cumulative Capital Line */}
          <Line
            yAxisId="cumulative"
            type="monotone"
            dataKey="cumulative_invested"
            stroke="#3B82F6"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#60A5FA', stroke: '#1D4ED8', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
