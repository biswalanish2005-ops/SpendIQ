import React from 'react';
import { formatCurrency } from '../../lib/utils';

export interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey?: string;
  payload?: any;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  currency?: string;
  formatter?: (value: number, name: string) => string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  currency = 'USD',
  formatter,
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg bg-cardElevated border border-border px-3.5 py-2.5 shadow-elevated text-xs">
      {label && (
        <div className="font-semibold text-textPrimary mb-1.5 pb-1 border-b border-border/70">
          {label}
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((item, index) => {
          const isForecast =
            item.name.toLowerCase().includes('forecast') ||
            item.dataKey?.toLowerCase().includes('forecast');

          const formattedValue = formatter
            ? formatter(item.value, item.name)
            : formatCurrency(item.value, currency);

          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color || '#3B82F6' }}
                />
                <span className="text-textSecondary">
                  {item.name}
                  {isForecast && (
                    <span className="ml-1 text-[10px] px-1 py-0.2 rounded bg-ai/10 text-ai border border-ai/20">
                      Forecast
                    </span>
                  )}
                </span>
              </div>
              <span className="font-mono font-semibold text-textPrimary">
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
