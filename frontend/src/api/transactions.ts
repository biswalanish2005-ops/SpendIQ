import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { ensureAuthenticated } from './auth';

export type TransactionDirection = 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'TRANSFER';

export interface Transaction {
  id: string;
  user_id: string;
  account_id?: string | null;
  category_id?: string | null;
  occurred_at: string;
  amount: number | string;
  currency: string;
  direction: TransactionDirection;
  category_name: string;
  merchant_name: string;
  description?: string;
  source: string;
  created_at: string;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface TransactionSummary {
  total_count: number;
  total_income: number | string;
  total_expense: number | string;
  total_investment: number | string;
  net_cash_flow: number | string;
}

export interface TransactionFilterParams {
  search?: string;
  start_date?: string;
  end_date?: string;
  category?: string;
  merchant?: string;
  direction?: string;
  min_amount?: number;
  max_amount?: number;
  account_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface TransactionCreatePayload {
  occurred_at: string;
  amount: number;
  currency?: string;
  direction: TransactionDirection;
  category_name: string;
  merchant_name: string;
  description?: string;
  account_id?: string | null;
  category_id?: string | null;
  source?: string;
}

export interface TransactionUpdatePayload {
  occurred_at?: string;
  amount?: number;
  direction?: TransactionDirection;
  category_name?: string;
  merchant_name?: string;
  description?: string;
}

function buildFilterQueryString(params: TransactionFilterParams = {}): string {
  const q = new URLSearchParams();
  if (params.search) q.append('search', params.search);
  if (params.start_date) q.append('start_date', params.start_date);
  if (params.end_date) q.append('end_date', params.end_date);
  if (params.category && params.category !== 'ALL') q.append('category', params.category);
  if (params.merchant) q.append('merchant', params.merchant);
  if (params.direction && params.direction !== 'ALL') q.append('direction', params.direction);
  if (params.min_amount !== undefined) q.append('min_amount', params.min_amount.toString());
  if (params.max_amount !== undefined) q.append('max_amount', params.max_amount.toString());
  if (params.account_id && params.account_id !== 'ALL') q.append('account_id', params.account_id);
  if (params.sort_by) q.append('sort_by', params.sort_by);
  if (params.sort_order) q.append('sort_order', params.sort_order);
  if (params.page) q.append('page', params.page.toString());
  if (params.page_size) q.append('page_size', params.page_size.toString());
  return q.toString() ? `?${q.toString()}` : '';
}

export function useTransactions(params: TransactionFilterParams = {}) {
  return useQuery<PaginatedTransactions>({
    queryKey: ['transactions', 'list', params],
    queryFn: async () => {
      await ensureAuthenticated();
      const qs = buildFilterQueryString(params);
      return await apiClient.get<PaginatedTransactions>(`/transactions${qs}`);
    },
    staleTime: 10 * 1000,
  });
}

export function useTransactionSummary(params: TransactionFilterParams = {}) {
  return useQuery<TransactionSummary>({
    queryKey: ['transactions', 'summary', params],
    queryFn: async () => {
      await ensureAuthenticated();
      const { page, page_size, sort_by, sort_order, ...summaryParams } = params;
      const qs = buildFilterQueryString(summaryParams);
      return await apiClient.get<TransactionSummary>(`/transactions/summary${qs}`);
    },
    staleTime: 10 * 1000,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation<Transaction, Error, TransactionCreatePayload>({
    mutationFn: async (payload) => {
      await ensureAuthenticated();
      return await apiClient.post<Transaction>('/transactions', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation<Transaction, Error, { id: string; data: TransactionUpdatePayload }>({
    mutationFn: async ({ id, data }) => {
      await ensureAuthenticated();
      return await apiClient.patch<Transaction>(`/transactions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await ensureAuthenticated();
      await apiClient.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useCategories() {
  return useQuery<Array<{ id: string; name: string; group: string }>>({
    queryKey: ['categories'],
    queryFn: async () => {
      await ensureAuthenticated();
      return await apiClient.get<Array<{ id: string; name: string; group: string }>>('/categories');
    },
    staleTime: 60 * 1000,
  });
}

export function useAccounts() {
  return useQuery<Array<{ id: string; name: string; type: string; balance: number }>>({
    queryKey: ['accounts'],
    queryFn: async () => {
      await ensureAuthenticated();
      return await apiClient.get<Array<{ id: string; name: string; type: string; balance: number }>>('/accounts');
    },
    staleTime: 60 * 1000,
  });
}
