import React, { useState } from 'react';
import type { SpendingVelocityResponse } from '../../api/analytics';
import { ChartContainer } from '../charts/ChartContainer';
import { ChartTooltip } from '../charts/ChartTooltip';
import { CHART_THEME } from '../charts/chartTheme';
import { Tabs } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/utils';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Flame } from 'lucide-react';

interface SpendingVelocityChartProps {
  velocityData?: SpendingVelocityResponse;
  isLoading?: boolean;
}

export const SpendingVelocityChart: React.FC<SpendingVelocityChartProps> = ({
  velocityData,
  isLoading = false,
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'cumulative'>('daily');

  const burnRate = velocityData?.seven_day_burn_rate
    ? Number(velocityData.seven_day_burn_rate)
    : 140.5;

  const dailyPoints = velocityData?.daily_velocity.map((p) => ({
    ...p,
    amount: Number(p.amount),
    moving_average: Number(p.moving_average),
  })) || [];

  const cumulativePoints = velocityData?.cumulative_comparison.map((p) => ({
    ...p,
    current_month_cumulative: Number(p.current_month_cumulative),
    previous_month_cumulative: p.previous_month_cumulative ? Number(p.previous_month_cumulative) : null,
  })) || [];

  return (
    <ChartContainer
      title={viewMode === 'daily' ? 'Daily Spending Velocity' : 'Cumulative Monthly Progress'}
      subtitle={
        viewMode === 'daily'
          ? 'Daily expenditures with rolling 7-day moving average to monitor acceleration.'
          : 'Month-to-date cumulative spending compared against prior monthly pacing.'
      }
      badge={
        <Badge variant="warning" size="sm">
          <Flame size={11} className="mr-1 text-warning" />
          7-Day Burn: {formatCurrency(burnRate)}/day
        </Badge>
      }
      actions={
        <Tabs
          tabs={[
            { id: 'daily', label: 'Daily Velocity' },
            { id: 'cumulative', label: 'Cumulative Progress' },
          ]}
          activeTab={viewMode}
          onChange={(id) => setViewMode(id as 'daily' | 'cumulative')}
        />
      }
      height={340}
      isLoading={isLoading}
      legend={
        viewMode === 'daily' ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-primary/70" />
              <span>Daily Expenditure</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-ai" />
              <span className="text-ai font-medium">7-Day Moving Avg</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-primary" />
              <span>Current Month Pace</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 border-b border-dashed border-textMuted" />
              <span>Prior Month Pace</span>
            </div>
          </>
        )
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        {viewMode === 'daily' ? (
          <ComposedChart
            data={dailyPoints}
            margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              stroke={CHART_THEME.colors.grid}
              strokeDasharray={CHART_THEME.grid.strokeDasharray}
              vertical={false}
            />
            <XAxis
              dataKey="day_label"
              stroke={CHART_THEME.colors.axis}
              tick={{ fill: '#94A3B8', fontSize: 10 }}
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
            <Bar
              dataKey="amount"
              name="Daily Spend"
              fill="#3B82F6"
              fillOpacity={0.65}
              radius={[4, 4, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="moving_average"
              name="7-Day Moving Avg"
              stroke="#06B6D4"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        ) : (
          <AreaChart
            data={cumulativePoints}
            margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke={CHART_THEME.colors.grid}
              strokeDasharray={CHART_THEME.grid.strokeDasharray}
              vertical={false}
            />
            <XAxis
              dataKey="day_of_month"
              stroke={CHART_THEME.colors.axis}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickFormatter={(d) => `Day ${d}`}
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
            <Area
              type="monotone"
              dataKey="current_month_cumulative"
              name="Current Month Spend"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fill="url(#cumGradient)"
            />
            <Line
              type="monotone"
              dataKey="previous_month_cumulative"
              name="Baseline Pace"
              stroke="#64748B"
              strokeDasharray="4 4"
              strokeWidth={1.8}
              dot={false}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </ChartContainer>
  );
};
