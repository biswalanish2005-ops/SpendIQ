import React from 'react';
import type { SemanticStatus } from '../../types/theme';
import { StatusBadge } from './StatusBadge';
import { TrendIndicator } from './TrendIndicator';
import { formatCurrency, cn } from '../../lib/utils';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export interface MetricCardProps {
  label: string;
  amount: number;
  currency?: string;
  changePercent?: number;
  status?: SemanticStatus;
  statusLabel?: string;
  comparisonPeriod?: string;
  sparklineData?: number[];
  historicalAverage?: number;
  icon?: React.ReactNode;
  infoTooltip?: string;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  amount,
  currency = 'USD',
  changePercent,
  status = 'STABLE',
  statusLabel,
  comparisonPeriod = 'last month',
  sparklineData,
  historicalAverage,
  icon,
  className,
  onClick,
}) => {
  const formattedSparkline = sparklineData?.map((val, idx) => ({ i: idx, v: val }));

  const sparklineColor = 
    status === 'IMPROVING' ? '#22C55E' :
    status === 'CONCERNING' ? '#EF4444' :
    status === 'ATTENTION_REQUIRED' ? '#F59E0B' : '#3B82F6';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col justify-between p-5 rounded-xl border border-border bg-card transition-all duration-200',
        'hover:border-borderLight hover:bg-cardElevated/80 hover:shadow-card',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Card Header: Label and Status/Icon */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="p-2 rounded-lg bg-surface border border-border text-textSecondary group-hover:text-primary transition-colors">
              {icon}
            </div>
          )}
          <span className="text-xs font-medium uppercase tracking-wider text-textSecondary">
            {label}
          </span>
        </div>
        {status && (
          <StatusBadge status={status} label={statusLabel} size="sm" />
        )}
      </div>

      {/* Main Metric Figure */}
      <div className="mb-2">
        <div className="text-2xl lg:text-3xl font-bold tracking-tight text-textPrimary font-mono">
          {formatCurrency(amount, currency)}
        </div>
      </div>

      {/* Footer: Trend Indicator & Sparkline */}
      <div className="flex items-end justify-between pt-2 border-t border-border/60">
        <div className="space-y-1">
          {changePercent !== undefined && (
            <TrendIndicator
              changePercent={changePercent}
              status={status}
              comparisonPeriod={comparisonPeriod}
            />
          )}
          {historicalAverage !== undefined && (
            <div className="text-[11px] text-textMuted">
              Avg: <span className="font-mono text-textSecondary">{formatCurrency(historicalAverage, currency)}</span>
            </div>
          )}
        </div>

        {/* Optional Micro Sparkline */}
        {formattedSparkline && formattedSparkline.length > 1 && (
          <div className="w-20 h-9 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedSparkline}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={sparklineColor}
                  strokeWidth={1.8}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
