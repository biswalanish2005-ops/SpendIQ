import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { ensureAuthenticated } from './auth';

export interface MonthlySavingsPoint {
  period_date: string;
  period_label: string;
  income: number;
  expenses: number;
  savings_amount: number;
  savings_rate: number;
  target_benchmark_rate: number;
  is_projected: boolean;
}

export interface EmergencyFundDetails {
  liquid_balance: number;
  monthly_burn_rate: number;
  months_of_coverage: number;
  recommended_months: number;
  target_reserve_amount: number;
  funding_percentage: number;
  status: 'EXCELLENT' | 'ADEQUATE' | 'NEEDS_ATTENTION';
}

export interface SavingsIntelligenceResponse {
  current_savings_amount: number;
  current_savings_rate: number;
  mom_change_rate: number;
  direction: 'INCREASE' | 'DECREASE' | 'STABLE';
  financial_impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  status: 'IMPROVING' | 'CONCERNING' | 'STABLE';
  average_savings_rate_6m: number;
  projected_next_month_savings: number;
  projected_next_month_rate: number;
  emergency_fund: EmergencyFundDetails;
  trajectory: MonthlySavingsPoint[];
}

export function useSavingsIntelligence(months: number = 6) {
  return useQuery<SavingsIntelligenceResponse>({
    queryKey: ['analytics', 'savings', months],
    queryFn: async () => {
      await ensureAuthenticated();
      return await apiClient.get<SavingsIntelligenceResponse>(`/analytics/savings?months=${months}`);
    },
    staleTime: 60 * 1000,
  });
}
