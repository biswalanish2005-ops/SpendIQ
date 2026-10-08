import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { ensureAuthenticated } from './auth';

export interface MonthlyInvestmentPoint {
  period_date: string;
  period_label: string;
  contribution_amount: number;
  income_share_pct: number;
  cumulative_invested: number;
  is_projected: boolean;
}

export interface AssetAllocationItem {
  name: string;
  account_type: string;
  institution: string;
  balance: number;
  percentage: number;
}

export interface InvestmentIntelligenceResponse {
  current_monthly_contribution: number;
  income_share_percentage: number;
  mom_change_percentage: number;
  direction: 'INCREASE' | 'DECREASE' | 'STABLE';
  financial_impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  status: 'IMPROVING' | 'CONCERNING' | 'STABLE';
  consistency_score: number;
  total_portfolio_balance: number;
  projected_next_month_contribution: number;
  allocations: AssetAllocationItem[];
  cadence: MonthlyInvestmentPoint[];
}

export function useInvestmentIntelligence(months: number = 6) {
  return useQuery<InvestmentIntelligenceResponse>({
    queryKey: ['analytics', 'investments', months],
    queryFn: async () => {
      await ensureAuthenticated();
      return await apiClient.get<InvestmentIntelligenceResponse>(`/analytics/investments?months=${months}`);
    },
    staleTime: 60 * 1000,
  });
}
