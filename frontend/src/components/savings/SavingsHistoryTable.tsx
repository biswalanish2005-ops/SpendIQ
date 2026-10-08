import React from 'react';
import type { MonthlySavingsPoint } from '../../api/savings';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Sparkles, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface SavingsHistoryTableProps {
  trajectory: MonthlySavingsPoint[];
  isLoading?: boolean;
}

export const SavingsHistoryTable: React.FC<SavingsHistoryTableProps> = ({
  trajectory,
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

  // Display newest first (reverse chronological)
  const displayRows = [...trajectory].reverse();

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-textPrimary">Savings Ledger &amp; Performance History</h3>
          <p className="text-xs text-textSecondary">Monthly income allocation and benchmark variance breakdown</p>
        </div>
        <span className="text-xs text-textMuted font-mono">{trajectory.length} Records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface/60 text-textMuted uppercase font-mono tracking-wider border-b border-border/80">
            <tr>
              <th className="py-3 px-4">Period</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 text-right">Gross Income</th>
              <th className="py-3 px-4 text-right">Expenses</th>
              <th className="py-3 px-4 text-right">Net Savings</th>
              <th className="py-3 px-4 text-right">Savings Rate</th>
              <th className="py-3 px-4 text-right">vs. 20% Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {displayRows.map((row) => {
              const benchmarkDiff = Number((row.savings_rate - (row.target_benchmark_rate || 20.0)).toFixed(1));
              const isAbove = benchmarkDiff >= 0;

              return (
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
                      <Badge variant="default" size="sm" className="w-fit">
                        Actual
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-textSecondary whitespace-nowrap">
                    {formatCurrency(row.income)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-textSecondary whitespace-nowrap">
                    {formatCurrency(row.expenses)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-medium whitespace-nowrap ${
                      row.savings_amount >= 0 ? 'text-positive' : 'text-negative'
                    }`}
                  >
                    {formatCurrency(row.savings_amount)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold whitespace-nowrap">
                    <span className={row.savings_rate >= 20 ? 'text-positive' : 'text-warning'}>
                      {row.savings_rate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {benchmarkDiff > 0 ? (
                        <ArrowUpRight size={14} className="text-positive" />
                      ) : benchmarkDiff < 0 ? (
                        <ArrowDownRight size={14} className="text-warning" />
                      ) : (
                        <Minus size={14} className="text-textMuted" />
                      )}
                      <span className={isAbove ? 'text-positive' : 'text-warning'}>
                        {isAbove ? '+' : ''}{benchmarkDiff}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
