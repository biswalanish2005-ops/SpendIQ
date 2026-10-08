import React from 'react';
import type { SpendingDriver } from '../../api/predictions';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SpendingDriversCardProps {
  drivers: SpendingDriver[];
  isLoading?: boolean;
}

export const SpendingDriversCard: React.FC<SpendingDriversCardProps> = ({
  drivers,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  const getImpactBadgeVariant = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'negative';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-textPrimary">
              Primary Spending Drivers
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface text-textSecondary border border-border">
              {drivers.length} Factors
            </span>
          </div>
          <span className="text-xs text-textMuted hidden sm:inline">
            Ranked by Forecast Variance Impact
          </span>
        </div>
        <p className="text-xs text-textSecondary mt-1">
          Top categories explaining projected variance between historical baseline and next-month outlook.
        </p>

        {/* Drivers List */}
        <div className="space-y-3 mt-4">
          {drivers.length === 0 ? (
            <div className="p-6 text-center text-xs text-textMuted border border-dashed border-border rounded-lg">
              No significant category drivers detected for the upcoming period.
            </div>
          ) : (
            drivers.map((driver, index) => {
              const isIncrease = driver.dollar_variance > 0;
              const isDecrease = driver.dollar_variance < 0;

              return (
                <div
                  key={driver.category_name || index}
                  className="p-3.5 rounded-lg border border-border/80 bg-cardElevated hover:border-border transition-colors duration-150 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-textMuted">#{index + 1}</span>
                      <span className="text-sm font-semibold text-textPrimary">
                        {driver.category_name}
                      </span>
                      <Badge variant={getImpactBadgeVariant(driver.impact_level)} size="sm">
                        {driver.impact_level} IMPACT
                      </Badge>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 font-mono text-sm font-bold">
                        {isIncrease ? (
                          <TrendingUp size={15} className="text-negative inline shrink-0" />
                        ) : isDecrease ? (
                          <TrendingDown size={15} className="text-positive inline shrink-0" />
                        ) : (
                          <Minus size={15} className="text-textMuted inline shrink-0" />
                        )}
                        <span className={isIncrease ? 'text-negative' : isDecrease ? 'text-positive' : 'text-textSecondary'}>
                          {driver.dollar_variance > 0 ? '+' : ''}
                          {formatCurrency(driver.dollar_variance)}
                        </span>
                      </div>
                      <div className="text-[10px] text-textMuted">
                        {driver.percentage_impact}% of total delta
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-textSecondary bg-surface/40 p-2 rounded border border-border/40 font-normal">
                    {driver.explanation}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-textMuted pt-1 border-t border-border/40 font-mono">
                    <span>
                      Current: <strong className="text-textPrimary">{formatCurrency(driver.current_amount)}</strong>
                    </span>
                    <span>→</span>
                    <span>
                      Projected: <strong className="text-textPrimary">{formatCurrency(driver.projected_amount)}</strong>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
