import React from 'react';
import { X, Calendar, Tag, Building, Hash } from 'lucide-react';
import type { Transaction } from '../../api/transactions';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface TransactionDetailModalProps {
  transaction?: Transaction | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  const isIncome = transaction.direction === 'INCOME';
  const isExpense = transaction.direction === 'EXPENSE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[#111720] border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0E141D]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Transaction Details
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Amount */}
        <div className="p-6 text-center border-b border-slate-800/80 bg-slate-900/30">
          <div className="text-xs text-slate-400 mb-1">{transaction.merchant_name}</div>
          <div
            className={`text-3xl font-bold font-mono tracking-tight ${
              isIncome ? 'text-emerald-400' : isExpense ? 'text-rose-400' : 'text-cyan-400'
            }`}
          >
            {isIncome ? '+' : isExpense ? '-' : ''}
            {formatCurrency(Number(transaction.amount))}
          </div>
          <div className="mt-2.5 flex justify-center">
            <Badge
              variant={isIncome ? 'positive' : isExpense ? 'negative' : 'ai'}
              size="sm"
            >
              {transaction.direction}
            </Badge>
          </div>
        </div>

        {/* Key-Value Details */}
        <div className="p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Occurred At</span>
            </span>
            <span className="font-mono text-slate-200">
              {new Date(transaction.occurred_at).toLocaleString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Category</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-medium">
              {transaction.category_name}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>Source / Origin</span>
            </span>
            <span className="font-mono text-slate-300">{transaction.source}</span>
          </div>

          {transaction.description && (
            <div className="py-1 border-b border-slate-800/60">
              <span className="text-slate-400 block mb-1">Description / Memo</span>
              <p className="text-slate-200 bg-[#151C25] p-2 rounded-lg border border-slate-800">
                {transaction.description}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between py-1 text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              <span>ID</span>
            </span>
            <span className="truncate max-w-[200px]">{transaction.id}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#0E141D] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
