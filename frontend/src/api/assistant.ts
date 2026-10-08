import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from './client';
import { ensureAuthenticated } from './auth';

export type AssistantBlockType = 'TEXT' | 'METRIC' | 'CHART' | 'RECOMMENDATION' | 'ACTION';

export interface AssistantMetricData {
  label: string;
  value: string;
  comparison_label?: string;
  comparison_value?: string;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  status?: 'IMPROVING' | 'CONCERNING' | 'STABLE' | 'ATTENTION_REQUIRED';
}

export interface AssistantChartData {
  chart_type: string;
  title: string;
  data: Array<Record<string, any>>;
}

export interface AssistantActionData {
  label: string;
  route: string;
  action_type: string;
}

export interface AssistantRecommendationData {
  title: string;
  text: string;
}

export interface AssistantResponseBlock {
  block_type: AssistantBlockType;
  data: AssistantMetricData | AssistantChartData | AssistantActionData | AssistantRecommendationData | { markdown: string } | any;
}

export interface AssistantMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  blocks: AssistantResponseBlock[];
  sources: string[];
  created_at: string;
}

export interface AssistantSuggestedPrompt {
  id: string;
  prompt: string;
  category: string;
  icon: string;
}

export interface AssistantChatPayload {
  query: string;
  conversation_id?: string;
}

export function useAssistantSuggestions() {
  return useQuery<AssistantSuggestedPrompt[]>({
    queryKey: ['assistant', 'suggestions'],
    queryFn: async () => {
      await ensureAuthenticated();
      return await apiClient.get<AssistantSuggestedPrompt[]>('/assistant/suggestions');
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSendAssistantMessage() {
  return useMutation<AssistantMessage, Error, AssistantChatPayload>({
    mutationFn: async (payload) => {
      await ensureAuthenticated();
      return await apiClient.post<AssistantMessage>('/assistant/chat', payload);
    },
  });
}
