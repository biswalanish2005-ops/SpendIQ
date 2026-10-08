import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Upload,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type {
  Transaction,
  TransactionFilterParams,
  TransactionCreatePayload,
  TransactionUpdatePayload,
} from '../api/transactions';
import {
  useTransactions,
  useTransactionSummary,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useCategories,
  useAccounts,
} from '../api/transactions';
import { useGlobalFilter } from '../context/GlobalFilterContext';
import { TransactionStatsBar } from '../components/transactions/TransactionStatsBar';
import { TransactionFilterBar } from '../components/transactions/TransactionFilterBar';
import { TransactionTable } from '../components/transactions/TransactionTable';
import { TransactionModal } from '../components/transactions/TransactionModal';
import { TransactionDetailModal } from '../components/transactions/TransactionDetailModal';
import { DeleteTransactionModal } from '../components/transactions/DeleteTransactionModal';

export const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { filters: globalFilters, effectiveDates, resetFilters: resetGlobalFilters } = useGlobalFilter();

  const [filters, setFilters] = useState<TransactionFilterParams>({
    page: 1,
    page_size: 20,
    sort_by: 'occurred_at',
    sort_order: 'desc',
  });

  const combinedFilters: TransactionFilterParams = useMemo(() => {
    return {
      ...filters,
      account_id: globalFilters.accountId !== 'ALL' ? globalFilters.accountId : filters.account_id,
      category: globalFilters.category !== 'ALL' ? globalFilters.category : filters.category,
      direction: globalFilters.direction !== 'ALL' ? globalFilters.direction : filters.direction,
      start_date: effectiveDates.startDate || filters.start_date,
      end_date: effectiveDates.endDate || filters.end_date,
    };
  }, [filters, globalFilters, effectiveDates]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [inspectingTx, setInspectingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const {
    data: transactionsData,
    isLoading: isTxLoading,
    error: txError,
    refetch: refetchTx,
  } = useTransactions(combinedFilters);

  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useTransactionSummary(combinedFilters);

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const handleFilterChange = (newFilters: Partial<TransactionFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      page_size: 20,
      sort_by: 'occurred_at',
      sort_order: 'desc',
    });
    resetGlobalFilters();
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreate = async (payload: TransactionCreatePayload) => {
    await createMutation.mutateAsync(payload);
    showNotification('Transaction recorded successfully.');
    refetchSummary();
  };

  const handleUpdate = async (id: string, payload: TransactionUpdatePayload) => {
    await updateMutation.mutateAsync({ id, data: payload });
    showNotification('Transaction updated successfully.');
    refetchSummary();
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    setDeletingTx(null);
    showNotification('Transaction deleted.');
    refetchSummary();
  };

  if (txError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Transactions Ledger</h1>
          <p className="text-xs text-slate-400">Searchable, normalized personal transaction records</p>
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-rose-400 mb-2" />
          <h3 className="text-sm font-semibold text-white mb-1">Failed to load transactions</h3>
          <p className="text-xs text-slate-400 mb-4">
            {(txError as any)?.message || 'An unexpected error occurred while fetching transactions.'}
          </p>
          <button
            onClick={() => {
              refetchTx();
              refetchSummary();
            }}
            className="px-3 py-1.5 rounded-lg bg-[#151C25] border border-slate-800 text-xs text-white hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Transactions Ledger</h1>
            <p className="text-xs text-slate-400">
              Normalized personal transaction records with real-time analytics synchronization
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/import')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151C25] hover:bg-[#1E293B] border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingTx(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold shadow-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Floating Status Notification */}
      {notification && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 animate-fade-in shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Stats Summary Bar */}
      <TransactionStatsBar summary={summaryData} isLoading={isSummaryLoading} />

      {/* Search & Filter Bar */}
      <TransactionFilterBar
        filters={combinedFilters}
        categories={categories}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Transactions Data Table */}
      <TransactionTable
        data={transactionsData}
        isLoading={isTxLoading}
        onPageChange={(newPage) => handleFilterChange({ page: newPage })}
        onViewDetails={(tx) => setInspectingTx(tx)}
        onEdit={(tx) => {
          setEditingTx(tx);
          setIsModalOpen(true);
        }}
        onDelete={(tx) => setDeletingTx(tx)}
      />

      {/* Create / Edit Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
        editingTransaction={editingTx}
        categories={categories}
        accounts={accounts}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Detail Inspection Modal */}
      <TransactionDetailModal
        transaction={inspectingTx}
        onClose={() => setInspectingTx(null)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteTransactionModal
        isOpen={Boolean(deletingTx)}
        transaction={deletingTx}
        onClose={() => setDeletingTx(null)}
        onConfirmDelete={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
