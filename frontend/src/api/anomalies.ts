import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { ensureAuthenticated } from './auth';

export type AnomalySeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL';
export type AnomalyStatus = 'DETECTED' | 'ACKNOWLEDGED' | 'DISMISSED';

export interface AnomalyItem {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  merchant_name: string;
  category_name: string;
  occurred_at: string;
  anomaly_score: number;
  expected_value: number;
  deviation_factor: number;
  severity: AnomalySeverity;
  explanation: string;
  status: AnomalyStatus;
  detected_at: string;
}

export interface AnomalySummary {
  total_anomalies: number;
  high_severity_count: number;
  medium_severity_count: number;
  low_severity_count: number;
  resolved_count: number;
  total_anomalous_amount: number;
  resolution_rate: number;
}

export interface AnomalyTimelinePoint {
  date: string;
  normal_spend: number;
  anomalous_spend: number;
  anomaly_count: number;
}

export interface AnomalyScanResponse {
  scanned_transactions: number;
  anomalies_detected: number;
  new_anomalies_created: number;
  message: string;
}

export function useAnomalies(severity?: string, status?: string) {
  return useQuery<AnomalyItem[]>({
    queryKey: ['anomalies', 'list', severity, status],
    queryFn: async () => {
      await ensureAuthenticated();
      let url = '/anomalies';
      const params = new URLSearchParams();
      if (severity && severity !== 'ALL') params.append('severity', severity);
      if (status && status !== 'ALL') params.append('status', status);
      if (params.toString()) url += `?${params.toString()}`;
      return await apiClient.get<AnomalyItem[]>(url);
    },
    staleTime: 60 * 1000,
  });
}

export function useAnomalySummary() {
  return useQuery<AnomalySummary>({
    queryKey: ['anomalies', 'summary'],
    queryFn: async () => {
      await ensureAuthenticated();
      return await apiClient.get<AnomalySummary>('/anomalies/summary');
    },
    staleTime: 60 * 1000,
  });
}

export function useAnomalyTimeline(days: number = 90) {
  return useQuery<AnomalyTimelinePoint[]>({
    queryKey: ['anomalies', 'timeline', days],
    queryFn: async () => {
      await ensureAuthenticated();
      return await apiClient.get<AnomalyTimelinePoint[]>(`/anomalies/timeline?days=${days}`);
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateAnomalyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      anomalyId,
      status,
    }: {
      anomalyId: string;
      status: AnomalyStatus;
    }) => {
      await ensureAuthenticated();
      return await apiClient.patch<AnomalyItem>(`/anomalies/${anomalyId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
    },
  });
}

export function useScanAnomalies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await ensureAuthenticated();
      return await apiClient.post<AnomalyScanResponse>('/anomalies/scan', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
    },
  });
}
