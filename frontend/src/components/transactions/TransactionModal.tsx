import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type {
  Transaction,
  TransactionDirection,
  TransactionCreatePayload,
  TransactionUpdatePayload,
} from '../../api/transactions';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCreate: (data: TransactionCreatePayload) => Promise<void>;
  onSubmitUpdate: (id: string, data: TransactionUpdatePayload) => Promise<void>;
  editingTransaction?: Transaction | null;
  categories: Array<{ id: string; name: string }>;
  accounts: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
  editingTransaction,
  categories,
  accounts,
  isLoading = false,
}) => {
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<TransactionDirection>('EXPENSE');
  const [merchantName, setMerchantName] = useState('');
  const [categoryName, setCategoryName] = useState('Uncategorized');
  const [accountId, setAccountId] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingTransaction) {
      setAmount(String(editingTransaction.amount));
      setDirection(editingTransaction.direction);
      setMerchantName(editingTransaction.merchant_name);
      setCategoryName(editingTransaction.category_name);
      setAccountId(editingTransaction.account_id || '');
      setOccurredAt(editingTransaction.occurred_at.split('T')[0]);
      setDescription(editingTransaction.description || '');
    } else {
      setAmount('');
      setDirection('EXPENSE');
      setMerchantName('');
      setCategoryName(categories[0]?.name || 'Uncategorized');
      setAccountId(accounts[0]?.id || '');
      setOccurredAt(new Date().toISOString().split('T')[0]);
      setDescription('');
    }
    setError(null);
  }, [editingTransaction, isOpen, categories, accounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Amount must be a valid positive number');
      return;
    }
    if (!merchantName.trim()) {
      setError('Merchant name cannot be empty');
      return;
    }
    if (!occurredAt) {
      setError('Date is required');
      return;
    }

    try {
      const isoDate = new Date(occurredAt).toISOString();
      if (editingTransaction) {
        await onSubmitUpdate(editingTransaction.id, {
          amount: num,
          direction,
          merchant_name: merchantName.trim(),
          category_name: categoryName,
          occurred_at: isoDate,
          description: description.trim(),
        });
      } else {
        await onSubmitCreate({
          amount: num,
          direction,
          merchant_name: merchantName.trim(),
          category_name: categoryName,
          account_id: accountId || null,
          occurred_at: isoDate,
          description: description.trim(),
          source: 'MANUAL',
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save transaction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[#111720] border border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0E141D]">
          <h2 className="text-sm font-bold text-white">
            {editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Amount & Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="45.50"
                className="w-full bg-[#151C25] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
                className="w-full bg-[#151C25] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
                <option value="INVESTMENT">Investment</option>
              </select>
            </div>
          </div>

          {/* Merchant Name */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Merchant / Payee</label>
            <input
              type="text"
              required
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="e.g. Trader Joe's, Netflix, Salary"
              className="w-full bg-[#151C25] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Category & Account */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Category</label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full bg-[#151C25] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-[#151C25] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="">(No Account Linked)</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Date</label>
            <input
              type="date"
              required
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full bg-[#151C25] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Description / Memo (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Weekly family groceries"
              className="w-full bg-[#151C25] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#151C25] hover:bg-[#1E293B] border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingTransaction ? 'Save Changes' : 'Record Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
