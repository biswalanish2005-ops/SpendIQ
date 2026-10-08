import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { ensureAuthenticated } from './auth';

export interface ImportPreviewRow {
  row_index: number;
  occurred_at?: string | null;
  amount?: number | null;
  currency: string;
  direction: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
  category_name: string;
  merchant_name: string;
  description?: string;
  is_duplicate: boolean;
  duplicate_reason?: string | null;
  validation_error?: string | null;
  raw_data: Record<string, any>;
}

export interface ImportPreviewResponse {
  headers: string[];
  suggested_mappings: Record<string, string>;
  preview_rows: ImportPreviewRow[];
  total_rows: number;
  valid_rows: number;
  duplicate_rows: number;
  error_rows: number;
}

export interface ImportExecuteRow {
  occurred_at: string;
  amount: number;
  currency?: string;
  direction: string;
  category_name: string;
  merchant_name: string;
  description?: string;
  is_duplicate: boolean;
}

export interface ImportExecuteRequest {
  filename: string;
  account_id?: string | null;
  skip_duplicates: boolean;
  rows: ImportExecuteRow[];
}

export interface ImportJobOut {
  id: string;
  user_id: string;
  filename: string;
  total_rows: number;
  imported_rows: number;
  duplicate_rows: number;
  failed_rows: number;
  status: string;
  created_at: string;
}

export function useImportHistory() {
  return useQuery<ImportJobOut[]>({
    queryKey: ['imports', 'history'],
    queryFn: async () => {
      await ensureAuthenticated();
      return await apiClient.get<ImportJobOut[]>('/import/history');
    },
    staleTime: 30 * 1000,
  });
}

export function useImportPreviewRaw() {
  return useMutation<ImportPreviewResponse, Error, { csv_text: string; filename?: string }>({
    mutationFn: async ({ csv_text, filename }) => {
      await ensureAuthenticated();
      return await apiClient.post<ImportPreviewResponse>('/import/preview/raw', {
        csv_text,
        filename: filename || 'statement.csv',
      });
    },
  });
}

export function useExecuteImport() {
  const queryClient = useQueryClient();
  return useMutation<ImportJobOut, Error, ImportExecuteRequest>({
    mutationFn: async (payload) => {
      await ensureAuthenticated();
      return await apiClient.post<ImportJobOut>('/import/execute', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imports'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}
