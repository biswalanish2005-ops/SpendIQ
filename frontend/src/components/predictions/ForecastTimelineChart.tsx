import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { ChartContainer } from '../charts/ChartContainer';
import { CHART_THEME } from '../charts/chartTheme';
import type { CombinedTimelinePoint } from '../../api/predictions';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Sparkles } from 'lucide-react';

interface ForecastTimelineChartProps {
  timeline: CombinedTimelinePoint[];
  historicalAverage: number;
  confidenceLevelPct: number;
  isLoading?: boolean;
}

export const ForecastTimelineChart: React.FC<ForecastTimelineChartProps> = ({
  timeline,
  historicalAverage,
  confidenceLevelPct,
  isLoading = false,
}) => {
  // Prepare data with seamless actual-to-forecast bridge
  // Find last actual point index
  const lastActualIndex = timeline.reduce(
    (acc, cur, idx) => (!cur.is_forecast && cur.actual_amount !== null ? idx : acc),
    -1
  );

  const chartData = timeline.map((pt, idx) => {
    const isBridge = idx === lastActualIndex;
    const isForecast = pt.is_forecast;

    return {
      period_label: pt.period_label,
      period_date: pt.period_date,
      is_forecast: pt.is_forecast,
      actual: pt.actual_amount,
      // Connect forecast line directly from the last actual point
      forecast: isForecast ? pt.forecast_amount : isBridge ? pt.actual_amount : null,
      lower_bound: pt.lower_bound,
      upper_bound: pt.upper_bound,
      // Interval range for Area ribbon
      confidence_interval:
        pt.lower_bound !== null && pt.upper_bound !== null
          ? [pt.lower_bound, pt.upper_bound]
          : null,
    };
  });

  return (
    <ChartContainer
      title="Spending Trajectory & Multi-Horizon Forecast"
      subtitle="Holt-Winters double exponential smoothing with empirical confidence bands"
      badge={
        <Badge variant="ai" size="sm">
          <Sparkles size={11} className="mr-1 inline" />
          ML Projected
        </Badge>
      }
      isLoading={isLoading}
      isEmpty={!timeline || timeline.length === 0}
      height={340}
      legend={
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-textSecondary">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />
            <span>Actual Spend</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-400 inline-block" />
            <span>Forecast ({confidenceLevelPct}% CI)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-cyan-500/20 border border-cyan-500/40 inline-block rounded-xs" />
            <span>Prediction Interval</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dotted border-slate-500 inline-block" />
            <span>Historical Baseline</span>
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
            dataKey="period_label"
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
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              const pointData = payload[0]?.payload;
              const isForecast = pointData?.is_forecast;

              return (
                <div className="rounded-lg bg-cardElevated border border-border px-3.5 py-2.5 shadow-elevated text-xs min-w-[190px]">
                  <div className="flex items-center justify-between font-semibold text-textPrimary mb-2 pb-1.5 border-b border-border/70">
                    <span>{label}</span>
                    {isForecast ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-ai/10 text-ai border border-ai/20">
                        Forecast Point
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Verified Actual
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {pointData?.actual !== null && pointData?.actual !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-textSecondary flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Actual Spend:
                        </span>
                        <span className="font-mono font-semibold text-textPrimary">
                          {formatCurrency(pointData.actual)}
                        </span>
                      </div>
                    )}

                    {pointData?.forecast !== null && pointData?.forecast !== undefined && isForecast && (
                      <div className="flex items-center justify-between">
                        <span className="text-textSecondary flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          Projected Spend:
                        </span>
                        <span className="font-mono font-semibold text-ai">
                          {formatCurrency(pointData.forecast)}
                        </span>
                      </div>
                    )}

                    {isForecast && pointData?.lower_bound !== null && pointData?.upper_bound !== null && (
                      <div className="pt-1 mt-1 border-t border-border/50 text-[11px]">
                        <div className="text-textMuted mb-0.5">
                          {confidenceLevelPct}% Prediction Band:
                        </div>
                        <div className="font-mono text-cyan-300">
                          {formatCurrency(pointData.lower_bound)} – {formatCurrency(pointData.upper_bound)}
                        </div>
                      </div>
                    )}

                    {historicalAverage > 0 && (
                      <div className="flex items-center justify-between pt-1 text-[11px] text-textMuted">
                        <span>Baseline:</span>
                        <span className="font-mono">{formatCurrency(historicalAverage)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          />

          {/* Historical Baseline Reference */}
          {historicalAverage > 0 && (
            <ReferenceLine
              y={historicalAverage}
              stroke={CHART_THEME.colors.average}
              strokeDasharray="3 3"
              label={{
                value: `Monthly Baseline (${formatCurrency(historicalAverage)})`,
                fill: '#64748B',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
          )}

          {/* Confidence Interval Ribbon Area */}
          <Area
            type="monotone"
            dataKey="confidence_interval"
            stroke="none"
            fill="#06B6D4"
            fillOpacity={0.14}
            connectNulls={false}
            isAnimationActive={true}
          />

          {/* Actual Spending Solid Line */}
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

          {/* Forecast Dashed Line */}
          <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast Spend"
            stroke={CHART_THEME.colors.forecast}
            strokeWidth={2.2}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: CHART_THEME.colors.forecast }}
            activeDot={{ r: 6, fill: '#22D3EE' }}
            connectNulls={true}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
