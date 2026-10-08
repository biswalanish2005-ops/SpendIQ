import React from 'react';
import type { TransactionItem } from '../../api/analytics';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Receipt, ArrowUpRight, ArrowDownRight, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecentActivityTableProps {
  transactions?: TransactionItem[];
  isLoading?: boolean;
}

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({
  transactions,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (isLoading || !transactions) {
    return (
      <div className="p-5 rounded-xl border border-border bg-card shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-3 pt-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between p-5 rounded-xl border border-border bg-card shadow-card transition-all duration-200">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-surface border border-border text-textSecondary">
              <Receipt size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-textPrimary">
                Recent Verified Activity
              </h3>
              <p className="text-[11px] text-textMuted">
                Latest normalized transaction records
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
          >
            <span>Full Ledger</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {/* Transaction Rows */}
        <div className="divide-y divide-border/60">
          {transactions.map((tx) => {
            const isIncome = tx.direction === 'INCOME';
            const isInvestment = tx.direction === 'INVESTMENT';
            const amount = Number(tx.amount);
            const dateStr = new Date(tx.occurred_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between gap-3 group hover:bg-surface/30 px-2 rounded-lg -mx-2 transition-colors"
              >
                {/* Left: Direction Icon & Merchant */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      isIncome
                        ? 'bg-positive-muted border-positive-border text-positive'
                        : isInvestment
                        ? 'bg-neutral-muted border-neutral-border text-neutral'
                        : 'bg-surface border-border text-textSecondary'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownRight size={15} />
                    ) : isInvestment ? (
                      <ArrowUp size={15} />
                    ) : (
                      <ArrowUpRight size={15} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-textPrimary truncate group-hover:text-primary transition-colors">
                      {tx.merchant_name}
                    </div>
                    <div className="text-[11px] text-textMuted flex items-center gap-2">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span className="truncate">{tx.category_name}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-xs font-mono font-bold ${
                      isIncome
                        ? 'text-positive'
                        : isInvestment
                        ? 'text-neutral'
                        : 'text-textPrimary'
                    }`}
                  >
                    {isIncome ? '+' : isInvestment ? '↗ ' : '-'}
                    {formatCurrency(amount)}
                  </div>
                  <Badge
                    variant={isIncome ? 'positive' : isInvestment ? 'neutral' : 'outline'}
                    size="sm"
                    className="text-[10px] py-0 px-1.5 mt-0.5"
                  >
                    {tx.direction}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-textMuted">
        <span>Displaying latest {transactions.length} verified events</span>
        <span className="text-ai text-[11px]">Audit Protected</span>
      </div>
    </div>
  );
};
