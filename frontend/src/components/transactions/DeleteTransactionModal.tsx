import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Transaction } from '../../api/transactions';
import { formatCurrency } from '../../lib/utils';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  transaction?: Transaction | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onConfirmDelete,
  isLoading = false,
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-[#111720] border border-rose-500/30 shadow-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Delete Transaction</h3>
            <p className="text-xs text-slate-400">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4 bg-[#151C25] p-3 rounded-lg border border-slate-800">
          Are you sure you want to permanently remove{' '}
          <span className="font-semibold text-white">{transaction.merchant_name}</span> for{' '}
          <span className="font-mono font-semibold text-rose-400">
            {formatCurrency(Number(transaction.amount))}
          </span>
          ?
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg bg-[#151C25] hover:bg-[#1E293B] border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirmDelete(transaction.id)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
