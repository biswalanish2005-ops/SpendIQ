import React from 'react';
import type { CategoryBreakdownResponse } from '../../api/analytics';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { PieChart, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CategoryPreviewCardProps {
  data?: CategoryBreakdownResponse;
  isLoading?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Housing: '#3B82F6',
  Utilities: '#06B6D4',
  Groceries: '#22C55E',
  'Dining Out': '#F59E0B',
  Shopping: '#EC4899',
  Transportation: '#8B5CF6',
  Healthcare: '#10B981',
  Entertainment: '#F97316',
};

export const CategoryPreviewCard: React.FC<CategoryPreviewCardProps> = ({
  data,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (isLoading || !data) {
    return (
      <div className="p-5 rounded-xl border border-border bg-card shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-full rounded" />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  const topCategories = data.categories.slice(0, 5);

  return (
    <div className="flex flex-col justify-between p-5 rounded-xl border border-border bg-card shadow-card transition-all duration-200">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-surface border border-border text-textSecondary">
              <PieChart size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-textPrimary">
                Spending by Category
              </h3>
              <p className="text-[11px] text-textMuted">
                Top expenditure drivers
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/analytics')}
            className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
          >
            <span>View All</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {/* Fixed vs Discretionary Split Bar */}
        <div className="mb-4 p-3 rounded-lg bg-surface border border-border">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-textSecondary">
              Fixed: <strong className="text-textPrimary font-mono">{formatCurrency(Number(data.fixed_amount))}</strong>
            </span>
            <span className="text-textSecondary">
              Discretionary: <strong className="text-ai font-mono">{formatCurrency(Number(data.discretionary_amount))}</strong>
            </span>
          </div>
          <div className="h-2 w-full bg-cardElevated rounded-full overflow-hidden flex">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${100 - Number(data.discretionary_ratio)}%` }}
              title="Fixed Expenses"
            />
            <div
              className="bg-ai h-full transition-all duration-500"
              style={{ width: `${data.discretionary_ratio}%` }}
              title="Discretionary Expenses"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-3">
          {topCategories.map((cat) => {
            const color = CATEGORY_COLORS[cat.category_name] || '#94A3B8';
            const percentage = Number(cat.percentage);
            const amount = Number(cat.amount);

            return (
              <div key={cat.category_name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-textPrimary">
                      {cat.category_name}
                    </span>
                    <Badge variant="outline" size="sm" className="text-[10px] py-0 px-1.5">
                      {cat.group}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-textPrimary font-semibold">
                      {formatCurrency(amount)}
                    </span>
                    <span className="text-[11px] font-mono text-textMuted w-10 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Total */}
      <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs">
        <span className="text-textSecondary">Total Classified Spending</span>
        <span className="font-mono font-bold text-textPrimary text-sm">
          {formatCurrency(Number(data.total_spending))}
        </span>
      </div>
    </div>
  );
};
