import React from 'react';
import { cn } from '../../lib/utils';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { LineChart as ChartIcon } from 'lucide-react';

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  height?: number | string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
  legend?: React.ReactNode;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  badge,
  actions,
  height = 320,
  isLoading = false,
  isEmpty = false,
  emptyTitle = 'No chart data available',
  emptyDescription = 'Transactions are required to render this visualization.',
  children,
  legend,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-textPrimary">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-textSecondary mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Chart Canvas Area */}
      <figure
        role="region"
        aria-label={title}
        style={{ height }}
        className="relative w-full overflow-hidden"
      >
        <figcaption className="sr-only">
          {title} {subtitle ? `— ${subtitle}` : ''} visualization
        </figcaption>

        {isLoading ? (
          <div className="w-full h-full flex flex-col gap-3 justify-center items-center">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={<ChartIcon size={24} />}
            title={emptyTitle}
            description={emptyDescription}
            className="w-full h-full min-h-0 border-0"
          />
        ) : (
          <div className="w-full h-full">
            {children}
          </div>
        )}
      </figure>

      {/* Optional Custom Legend */}
      {legend && (
        <div className="pt-3 mt-2 border-t border-border/60 flex items-center justify-center gap-6 text-xs text-textSecondary">
          {legend}
        </div>
      )}
    </div>
  );
};
