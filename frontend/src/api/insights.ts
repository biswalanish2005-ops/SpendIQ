import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { ensureAuthenticated } from './auth';

export type InsightCategory =
  | 'SPENDING'
  | 'SAVINGS'
  | 'INVESTMENTS'
  | 'ANOMALIES'
  | 'FORECAST'
  | 'FINANCIAL_HEALTH';

export type InsightStatus = 'IMPROVING' | 'CONCERNING' | 'STABLE' | 'ATTENTION_REQUIRED';
export type InsightImpact = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
export type InsightActionState = 'ACTIVE' | 'DISMISSED' | 'ACTED_UPON';

export interface InsightItem {
  id: string;
  category: string;
  headline: string;
  summary: string;
  evidence: string[];
  metric_value: string;
  status: InsightStatus;
  impact: InsightImpact;
  action_state: InsightActionState;
  recommendation?: string;
  navigation_link: string;
  action_label: string;
  confidence_score: number;
  created_at: string;
}

export interface InsightSummary {
  total_insights: number;
  active_count: number;
  acted_upon_count: number;
  improving_count: number;
  concerning_count: number;
  attention_count: number;
  average_confidence: number;
}

export function useInsights(category?: string, status?: string, actionState?: string) {
  return useQuery<InsightItem[]>({
    queryKey: ['insights', 'list', category, status, actionState],
    queryFn: async () => {
      await ensureAuthenticated();
      let url = '/insights';
      const params = new URLSearchParams();
      if (category && category !== 'ALL') params.append('category', category);
      if (status && status !== 'ALL') params.append('status', status);
      if (actionState && actionState !== 'ALL') params.append('action_state', actionState);
      if (params.toString()) url += `?${params.toString()}`;
      return await apiClient.get<InsightItem[]>(url);
    },
    staleTime: 30 * 1000,
  });
}

export function useInsightSummary() {
  return useQuery<InsightSummary>({
    queryKey: ['insights', 'summary'],
    queryFn: async () => {
      await ensureAuthenticated();
      return await apiClient.get<InsightSummary>('/insights/summary');
    },
    staleTime: 30 * 1000,
  });
}

export function useUpdateInsightStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ insightId, status }: { insightId: string; status: InsightActionState }) => {
      await ensureAuthenticated();
      return await apiClient.patch<InsightItem>(`/insights/${insightId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

export function useGenerateInsights() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await ensureAuthenticated();
      return await apiClient.post<InsightItem[]>('/insights/generate');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}
