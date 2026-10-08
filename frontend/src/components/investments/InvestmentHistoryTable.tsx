import React from 'react';
import type { MonthlyInvestmentPoint } from '../../api/investments';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Sparkles, TrendingUp } from 'lucide-react';

interface InvestmentHistoryTableProps {
  cadence: MonthlyInvestmentPoint[];
  isLoading?: boolean;
}

export const InvestmentHistoryTable: React.FC<InvestmentHistoryTableProps> = ({
  cadence,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="h-6 w-40 bg-surface rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-surface rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Display newest first
  const displayRows = [...cadence].reverse();

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-textPrimary">Contribution History Ledger</h3>
          <p className="text-xs text-textSecondary">Monthly recurring deposit schedule and cumulative portfolio growth</p>
        </div>
        <span className="text-xs text-textMuted font-mono">{cadence.length} Records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface/60 text-textMuted uppercase font-mono tracking-wider border-b border-border/80">
            <tr>
              <th className="py-3 px-4">Period</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Contribution</th>
              <th className="py-3 px-4 text-right">Income Share</th>
              <th className="py-3 px-4 text-right">Cumulative Invested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {displayRows.map((row) => (
              <tr
                key={row.period_date}
                className={`transition-colors hover:bg-surface/50 ${
                  row.is_projected ? 'bg-cardElevated/40' : ''
                }`}
              >
                <td className="py-3 px-4 font-medium text-textPrimary whitespace-nowrap">
                  {row.period_label}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {row.is_projected ? (
                    <Badge variant="ai" size="sm" className="flex items-center gap-1 w-fit">
                      <Sparkles size={10} /> Projected
                    </Badge>
                  ) : (
                    <Badge variant="positive" size="sm" className="flex items-center gap-1 w-fit">
                      <TrendingUp size={10} /> Deposited
                    </Badge>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-positive whitespace-nowrap">
                  {formatCurrency(row.contribution_amount)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-textSecondary whitespace-nowrap">
                  {row.income_share_pct}% of gross
                </td>
                <td className="py-3 px-4 text-right font-mono text-primary font-medium whitespace-nowrap">
                  {formatCurrency(row.cumulative_invested)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
