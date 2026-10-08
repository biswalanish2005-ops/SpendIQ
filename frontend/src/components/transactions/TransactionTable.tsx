import React from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Inbox,
} from 'lucide-react';
import type { Transaction, PaginatedTransactions } from '../../api/transactions';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface TransactionTableProps {
  data?: PaginatedTransactions;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
  onViewDetails: (tx: Transaction) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  data,
  isLoading,
  onPageChange,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#111720] overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-[#151C25] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const items = data?.items || [];
  const total = data?.total || 0;
  const page = data?.page || 1;
  const totalPages = data?.total_pages || 1;

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#111720] p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-500 mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200 mb-1">No transactions found</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          No records match the active search query or filter parameters. Try clearing your filters or record a new transaction.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#111720] overflow-hidden flex flex-col">
      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">
            Financial transactions ledger with date, merchant, category, flow direction, and amounts
          </caption>
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-[#0E141D]">
              <th scope="col" className="py-3 px-4">Date</th>
              <th scope="col" className="py-3 px-4">Merchant & Description</th>
              <th scope="col" className="py-3 px-4">Category</th>
              <th scope="col" className="py-3 px-4">Direction</th>
              <th scope="col" className="py-3 px-4 text-right">Amount</th>
              <th scope="col" className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {items.map((tx) => {
              const isIncome = tx.direction === 'INCOME';
              const isExpense = tx.direction === 'EXPENSE';
              const isInvestment = tx.direction === 'INVESTMENT';
              const numAmount = Number(tx.amount);

              return (
                <tr
                  key={tx.id}
                  className="hover:bg-[#151C25]/80 transition-colors duration-150 group"
                >
                  {/* Date */}
                  <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                    {new Date(tx.occurred_at).toLocaleDateString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>

                  {/* Merchant & Description */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-200 group-hover:text-white transition-colors">
                      {tx.merchant_name}
                    </div>
                    {tx.description && (
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {tx.description}
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {tx.category_name}
                    </span>
                  </td>

                  {/* Direction */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge
                      variant={
                        isIncome ? 'positive' : isExpense ? 'negative' : 'ai'
                      }
                      size="sm"
                    >
                      {isIncome && <ArrowDownRight className="w-3 h-3" />}
                      {isExpense && <ArrowUpRight className="w-3 h-3" />}
                      {isInvestment && <TrendingUp className="w-3 h-3" />}
                      <span>{tx.direction}</span>
                    </Badge>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4 text-right font-mono font-semibold whitespace-nowrap">
                    <span
                      className={
                        isIncome
                          ? 'text-emerald-400'
                          : isExpense
                          ? 'text-rose-400'
                          : 'text-cyan-400'
                      }
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatCurrency(numAmount)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onViewDetails(tx)}
                        aria-label={`Inspect transaction details for ${tx.merchant_name}`}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ai"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(tx)}
                        aria-label={`Edit transaction for ${tx.merchant_name}`}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ai"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(tx)}
                        aria-label={`Delete transaction for ${tx.merchant_name}`}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ai"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-xs text-slate-400 bg-[#0E141D]">
        <div>
          Showing <span className="font-semibold text-slate-200">{items.length}</span> of{' '}
          <span className="font-semibold text-slate-200">{total}</span> records
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Go to previous page"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded bg-[#151C25] border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ai"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <span className="px-2 font-mono text-[11px] text-slate-400">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Go to next page"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] rounded bg-[#151C25] border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ai"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
