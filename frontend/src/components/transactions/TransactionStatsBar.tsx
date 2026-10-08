import React from 'react';
import { ArrowUpRight, ArrowDownRight, Layers, DollarSign } from 'lucide-react';
import type { TransactionSummary } from '../../api/transactions';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface TransactionStatsBarProps {
  summary?: TransactionSummary;
  isLoading?: boolean;
}

export const TransactionStatsBar: React.FC<TransactionStatsBarProps> = ({
  summary,
  isLoading = false,
}) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-[#151C25] border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const netFlow = Number(summary.net_cash_flow);
  const isNetPositive = netFlow >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. Total Volume */}
      <div className="p-3.5 rounded-xl bg-[#111720] border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>Transactions</span>
          <Layers className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono text-white">
            {summary.total_count.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500">records</span>
        </div>
      </div>

      {/* 2. Inflow */}
      <div className="p-3.5 rounded-xl bg-[#111720] border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>Total Inflow</span>
          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono text-emerald-400">
            {formatCurrency(Number(summary.total_income))}
          </span>
          <Badge variant="positive" size="sm">Income</Badge>
        </div>
      </div>

      {/* 3. Outflow */}
      <div className="p-3.5 rounded-xl bg-[#111720] border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>Total Outflow</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono text-rose-400">
            {formatCurrency(Number(summary.total_expense))}
          </span>
          <Badge variant="negative" size="sm">Expense</Badge>
        </div>
      </div>

      {/* 4. Net Flow */}
      <div className="p-3.5 rounded-xl bg-[#111720] border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>Net Cash Flow</span>
          <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span
            className={`text-xl font-bold font-mono ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isNetPositive ? '+' : ''}
            {formatCurrency(netFlow)}
          </span>
          <Badge variant={isNetPositive ? 'positive' : 'negative'} size="sm">
            {isNetPositive ? 'Surplus' : 'Deficit'}
          </Badge>
        </div>
      </div>
    </div>
  );
};
