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
  ReferenceLine,
} from 'recharts';
import { ChartContainer } from '../charts/ChartContainer';
import { CHART_THEME } from '../charts/chartTheme';
import type { MonthlySavingsPoint } from '../../api/savings';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { PiggyBank, Sparkles } from 'lucide-react';

interface SavingsTrajectoryChartProps {
  trajectory: MonthlySavingsPoint[];
  averageSavingsRate: number;
  isLoading?: boolean;
}

export const SavingsTrajectoryChart: React.FC<SavingsTrajectoryChartProps> = ({
  trajectory,
  averageSavingsRate,
  isLoading = false,
}) => {
  // Bridge the last actual point with the projected point for smooth line rendering
  const lastActualIndex = trajectory.reduce(
    (acc, cur, idx) => (!cur.is_projected ? idx : acc),
    -1
  );

  const chartData = trajectory.map((pt, idx) => {
    const isBridge = idx === lastActualIndex;
    const isProjected = pt.is_projected;

    return {
      period_label: pt.period_label,
      period_date: pt.period_date,
      is_projected: pt.is_projected,
      income: pt.income,
      expenses: pt.expenses,
      savings_amount: pt.savings_amount,
      savings_rate: pt.savings_rate,
      actual_rate: !isProjected ? pt.savings_rate : null,
      projected_rate: isProjected ? pt.savings_rate : isBridge ? pt.savings_rate : null,
      target_benchmark_rate: pt.target_benchmark_rate || 20.0,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    const rateDiff = Number((data.savings_rate - data.target_benchmark_rate).toFixed(1));
    const isAboveBenchmark = rateDiff >= 0;

    return (
      <div className="rounded-lg border border-border bg-cardElevated p-3 shadow-xl backdrop-blur-md min-w-[220px]">
        <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2 mb-2">
          <span className="font-semibold text-xs text-textPrimary">{label}</span>
          {data.is_projected ? (
            <Badge variant="ai" size="sm" className="flex items-center gap-1">
              <Sparkles size={10} /> Projection
            </Badge>
          ) : (
            <span className="text-[10px] text-textMuted font-mono">Actual</span>
          )}
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-textSecondary">
            <span>Gross Income:</span>
            <span className="font-mono text-textPrimary">{formatCurrency(data.income)}</span>
          </div>
          <div className="flex justify-between items-center text-textSecondary">
            <span>Expenses:</span>
            <span className="font-mono text-textPrimary">{formatCurrency(data.expenses)}</span>
          </div>
          <div className="flex justify-between items-center font-medium pt-1 border-t border-border/50">
            <span className="text-textPrimary">Net Savings:</span>
            <span className={`font-mono ${data.savings_amount >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatCurrency(data.savings_amount)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-textSecondary">Savings Rate:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-semibold text-positive">{data.savings_rate}%</span>
              <span className={`text-[10px] ${isAboveBenchmark ? 'text-positive' : 'text-warning'}`}>
                ({isAboveBenchmark ? '+' : ''}{rateDiff}% vs target)
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ChartContainer
      title="Savings Rate Trajectory & Benchmark"
      subtitle="Historical monthly savings rate pacing against standard 20.0% financial benchmark"
      badge={
        <Badge variant="positive" size="sm" className="flex items-center gap-1">
          <PiggyBank size={12} /> 20% Rule Benchmark
        </Badge>
      }
      height={340}
      isLoading={isLoading}
      isEmpty={trajectory.length === 0}
      emptyTitle="No savings records found"
      legend={
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-textSecondary">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-positive/40 border border-positive" />
            <span>Savings Amount ($)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-positive" />
            <span>Actual Rate (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-ai border-t border-dashed border-ai" />
            <span>Projected Rate (Est)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-warning border-t border-dashed border-warning" />
            <span>20% Benchmark Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-textMuted border-t border-dashed border-textMuted" />
            <span>6-Mo Avg ({averageSavingsRate}%)</span>
          </div>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
          <defs>
            <linearGradient id="savingsBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="projectedBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.08} />
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

          {/* Left Axis: Savings Amount ($) */}
          <YAxis
            yAxisId="amount"
            stroke={CHART_THEME.axis.stroke}
            tick={CHART_THEME.axis.tick}
            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            tickLine={false}
            width={45}
          />

          {/* Right Axis: Savings Rate (%) */}
          <YAxis
            yAxisId="rate"
            orientation="right"
            stroke={CHART_THEME.axis.stroke}
            tick={CHART_THEME.axis.tick}
            tickFormatter={(val) => `${val}%`}
            domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax * 1.2))]}
            tickLine={false}
            width={40}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Benchmark Reference Line (20%) */}
          <ReferenceLine
            yAxisId="rate"
            y={20}
            stroke="#F59E0B"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />

          {/* 6-Month Average Reference Line */}
          {averageSavingsRate > 0 && (
            <ReferenceLine
              yAxisId="rate"
              y={averageSavingsRate}
              stroke="#64748B"
              strokeDasharray="2 2"
              strokeWidth={1}
            />
          )}

          {/* Savings Amount Bars */}
          <Bar
            yAxisId="amount"
            dataKey="savings_amount"
            fill="url(#savingsBarGrad)"
            stroke="#22C55E"
            strokeWidth={1}
            radius={[4, 4, 0, 0]}
            maxBarSize={45}
          />

          {/* Actual Savings Rate Line */}
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="actual_rate"
            stroke="#22C55E"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#22C55E', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#86EFAC', stroke: '#15803D', strokeWidth: 2 }}
            connectNulls={false}
          />

          {/* Projected Savings Rate Line */}
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="projected_rate"
            stroke="#06B6D4"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 4, fill: '#06B6D4', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#67E8F9', stroke: '#0E7490', strokeWidth: 2 }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
