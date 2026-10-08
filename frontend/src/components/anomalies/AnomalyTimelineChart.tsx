import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartContainer } from '../charts/ChartContainer';
import { CHART_THEME } from '../charts/chartTheme';
import type { AnomalyTimelinePoint } from '../../api/anomalies';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { ShieldAlert } from 'lucide-react';

interface AnomalyTimelineChartProps {
  timeline: AnomalyTimelinePoint[];
  isLoading?: boolean;
}

export const AnomalyTimelineChart: React.FC<AnomalyTimelineChartProps> = ({
  timeline,
  isLoading = false,
}) => {
  // Format dates for display
  const chartData = timeline.map((pt) => {
    const d = new Date(pt.date);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      date: pt.date,
      display_date: label,
      normal_spend: pt.normal_spend,
      anomalous_spend: pt.anomalous_spend > 0 ? pt.anomalous_spend : null,
      anomaly_count: pt.anomaly_count,
    };
  });

  return (
    <ChartContainer
      title="Daily Spending Activity & Unusual Spikes"
      subtitle="Comparing baseline daily cadence against identified anomalous transactions"
      badge={
        <Badge variant="warning" size="sm">
          <ShieldAlert size={11} className="mr-1 inline" />
          Pattern Outliers
        </Badge>
      }
      isLoading={isLoading}
      isEmpty={!timeline || timeline.length === 0}
      height={320}
      legend={
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-textSecondary">
          <div className="flex items-center gap-2">
            <span className="w-3 h-2.5 bg-blue-500/50 border border-blue-500 rounded-xs inline-block" />
            <span>Regular Daily Spending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-2.5 bg-red-500 border border-red-400 rounded-xs inline-block" />
            <span>Unusual Transaction Spike</span>
          </div>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 12, right: 16, left: -4, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray={CHART_THEME.grid.strokeDasharray}
            stroke={CHART_THEME.grid.stroke}
            opacity={CHART_THEME.grid.opacity}
            vertical={false}
          />

          <XAxis
            dataKey="display_date"
            stroke={CHART_THEME.axis.stroke}
            tick={CHART_THEME.axis.tick}
            tickLine={false}
            axisLine={{ stroke: '#26313D' }}
          />

          <YAxis
            stroke={CHART_THEME.axis.stroke}
            tick={CHART_THEME.axis.tick}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: number) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const data = payload[0]?.payload;
              const hasAnomaly = data?.anomalous_spend !== null && data?.anomalous_spend > 0;

              return (
                <div className="rounded-lg bg-cardElevated border border-border px-3.5 py-2.5 shadow-elevated text-xs min-w-[180px]">
                  <div className="flex items-center justify-between font-semibold text-textPrimary mb-2 pb-1 border-b border-border/70">
                    <span>{data?.display_date}</span>
                    {hasAnomaly && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-negative/10 text-negative border border-negative/20">
                        {data.anomaly_count} Outlier{data.anomaly_count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-textSecondary">Regular Spend:</span>
                      <span className="font-mono font-semibold text-textPrimary">
                        {formatCurrency(data?.normal_spend || 0)}
                      </span>
                    </div>

                    {hasAnomaly && (
                      <div className="flex items-center justify-between text-negative">
                        <span className="font-medium">Unusual Spike:</span>
                        <span className="font-mono font-bold">
                          {formatCurrency(data?.anomalous_spend)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          />

          {/* Regular Spend Bars */}
          <Bar
            dataKey="normal_spend"
            name="Regular Spend"
            fill="#3B82F6"
            fillOpacity={0.4}
            radius={[2, 2, 0, 0]}
            maxBarSize={28}
          />

          {/* Anomalous Spike Bars */}
          <Bar
            dataKey="anomalous_spend"
            name="Unusual Spend"
            fill="#EF4444"
            fillOpacity={0.85}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
