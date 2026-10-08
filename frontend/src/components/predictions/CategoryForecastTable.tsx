import type { CategoryForecast } from '../../api/predictions';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface CategoryForecastTableProps {
  categories: CategoryForecast[];
  isLoading?: boolean;
}

export const CategoryForecastTable: React.FC<CategoryForecastTableProps> = ({
  categories,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-40 w-full mt-4" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-textPrimary">
            Category Trajectories Matrix
          </h3>
          <p className="text-xs text-textSecondary mt-0.5">
            Individual category forecasts, projected wallet shares, and model momentum
          </p>
        </div>
        <div className="text-xs text-textMuted font-mono">
          {categories.length} Categories Analyzed
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-textSecondary uppercase tracking-wider">
              <th className="pb-3 pl-2">Category</th>
              <th className="pb-3 text-right">Current Spend</th>
              <th className="pb-3 text-right">Projected Spend</th>
              <th className="pb-3 text-right">Projected Change</th>
              <th className="pb-3 text-right">Forecast Share</th>
              <th className="pb-3 text-right pr-2">Model Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-textMuted">
                  No category projections available.
                </td>
              </tr>
            ) : (
              categories.map((cat) => {
                const isUp = cat.projected_change_pct > 0;
                const isDown = cat.projected_change_pct < 0;

                return (
                  <tr
                    key={cat.category_name}
                    className="hover:bg-cardElevated/60 transition-colors duration-150"
                  >
                    <td className="py-3 pl-2 font-medium text-textPrimary">
                      {cat.category_name}
                    </td>

                    <td className="py-3 text-right font-mono text-textSecondary">
                      {formatCurrency(cat.current_spend)}
                    </td>

                    <td className="py-3 text-right font-mono font-semibold text-textPrimary">
                      {formatCurrency(cat.projected_spend)}
                    </td>

                    <td className="py-3 text-right font-mono">
                      <div className="flex items-center justify-end gap-1">
                        {isUp ? (
                          <ArrowUpRight size={13} className="text-negative" />
                        ) : isDown ? (
                          <ArrowDownRight size={13} className="text-positive" />
                        ) : (
                          <Minus size={13} className="text-textMuted" />
                        )}
                        <span
                          className={
                            isUp
                              ? 'text-negative font-medium'
                              : isDown
                              ? 'text-positive font-medium'
                              : 'text-textSecondary'
                          }
                        >
                          {cat.projected_change_pct > 0 ? '+' : ''}
                          {cat.projected_change_pct}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3 text-right font-mono text-textSecondary">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 bg-surface rounded-full h-1.5 overflow-hidden border border-border hidden sm:block">
                          <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, cat.share_of_projected_spend)}%` }}
                          />
                        </div>
                        <span>{cat.share_of_projected_spend}%</span>
                      </div>
                    </td>

                    <td className="py-3 text-right pr-2">
                      <Badge
                        variant={cat.confidence_score >= 0.85 ? 'positive' : 'neutral'}
                        size="sm"
                      >
                        {Math.round(cat.confidence_score * 100)}%
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
