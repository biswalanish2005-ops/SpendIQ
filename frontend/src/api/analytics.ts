import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { ensureAuthenticated } from './auth';

export interface MetricCardAnalytics {
  metric: string;
  label: string;
  current: string | number;
  previous: string | number;
  change_amount: string | number;
  change_percent: string | number;
  direction: 'INCREASE' | 'DECREASE' | 'NEUTRAL';
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  status: 'IMPROVING' | 'CONCERNING' | 'STABLE' | 'ATTENTION_REQUIRED';
  status_label: string;
  historical_average?: string | number | null;
  sparkline: (string | number)[];
  currency: string;
}

export interface CashFlowOverview {
  spending: MetricCardAnalytics;
  savings: MetricCardAnalytics;
  income: MetricCardAnalytics;
  investments: MetricCardAnalytics;
  savings_rate: MetricCardAnalytics;
  average_daily_spend: string | number;
  period_label: string;
}

export interface CategoryAggregate {
  category_name: string;
  group: string;
  amount: string | number;
  percentage: string | number;
  transaction_count: number;
  change_percent?: string | number | null;
}

export interface CategoryBreakdownResponse {
  total_spending: string | number;
  categories: CategoryAggregate[];
  fixed_amount: string | number;
  discretionary_amount: string | number;
  discretionary_ratio: string | number;
}

export interface MerchantAggregate {
  merchant_name: string;
  amount: string | number;
  transaction_count: number;
  average_ticket: string | number;
  percentage: string | number;
}

export interface TimeSeriesPoint {
  period: string;
  date: string;
  actual?: number | null;
  historical_average?: number | null;
}

export interface SpendingTrendResponse {
  points: TimeSeriesPoint[];
  historical_baseline: string | number;
  granularity: string;
}

export interface VelocityPoint {
  date: string;
  day_label: string;
  amount: string | number;
  moving_average: string | number;
}

export interface CumulativePoint {
  day_of_month: number;
  current_month_cumulative: string | number;
  previous_month_cumulative?: string | number | null;
}

export interface SpendingVelocityResponse {
  daily_velocity: VelocityPoint[];
  cumulative_comparison: CumulativePoint[];
  seven_day_burn_rate: string | number;
  period_label: string;
}

export interface TransactionItem {
  id: string;
  user_id: string;
  occurred_at: string;
  amount: string | number;
  currency: string;
  direction: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'TRANSFER';
  category_name: string;
  merchant_name: string;
  description: string;
  source: string;
}

export interface PaginatedTransactions {
  items: TransactionItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export function useCashFlowOverview(accountId?: string, startDate?: string, endDate?: string) {
  const effectiveAccount = accountId && accountId !== 'ALL' ? accountId : undefined;
  return useQuery<CashFlowOverview>({
    queryKey: ['analytics', 'overview', effectiveAccount, startDate, endDate],
    queryFn: async () => {
      await ensureAuthenticated();
      let url = '/analytics/overview';
      const params = new URLSearchParams();
      if (effectiveAccount) params.append('account_id', effectiveAccount);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      return await apiClient.get<CashFlowOverview>(url);
    },
    staleTime: 60 * 1000,
  });
}

export function useSpendingTrend(months: number = 6, accountId?: string) {
  const effectiveAccount = accountId && accountId !== 'ALL' ? accountId : undefined;
  return useQuery<SpendingTrendResponse>({
    queryKey: ['analytics', 'spending-trend', months, effectiveAccount],
    queryFn: async () => {
      await ensureAuthenticated();
      let url = `/analytics/spending/trend?months=${months}`;
      if (effectiveAccount) url += `&account_id=${effectiveAccount}`;
      return await apiClient.get<SpendingTrendResponse>(url);
    },
    staleTime: 60 * 1000,
  });
}

export function useCategoryBreakdown(startDate?: string, endDate?: string, accountId?: string) {
  const effectiveAccount = accountId && accountId !== 'ALL' ? accountId : undefined;
  return useQuery<CategoryBreakdownResponse>({
    queryKey: ['analytics', 'categories', startDate, endDate, effectiveAccount],
    queryFn: async () => {
      await ensureAuthenticated();
      let url = '/analytics/spending/categories';
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (effectiveAccount) params.append('account_id', effectiveAccount);
      if (params.toString()) url += `?${params.toString()}`;
      return await apiClient.get<CategoryBreakdownResponse>(url);
    },
    staleTime: 60 * 1000,
  });
}

export function useTopMerchants(
  limit: number = 10,
  startDate?: string,
  endDate?: string,
  accountId?: string,
  category?: string
) {
  const effectiveAccount = accountId && accountId !== 'ALL' ? accountId : undefined;
  const effectiveCategory = category && category !== 'ALL' ? category : undefined;
  return useQuery<MerchantAggregate[]>({
    queryKey: ['analytics', 'merchants', limit, startDate, endDate, effectiveAccount, effectiveCategory],
    queryFn: async () => {
      await ensureAuthenticated();
      let url = `/analytics/spending/merchants?limit=${limit}`;
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (effectiveAccount) params.append('account_id', effectiveAccount);
      if (effectiveCategory) params.append('category', effectiveCategory);
      const queryString = params.toString();
      if (queryString) url += `&${queryString}`;
      return await apiClient.get<MerchantAggregate[]>(url);
    },
    staleTime: 60 * 1000,
  });
}

export function useSpendingVelocity(days: number = 30, accountId?: string) {
  const effectiveAccount = accountId && accountId !== 'ALL' ? accountId : undefined;
  return useQuery<SpendingVelocityResponse>({
    queryKey: ['analytics', 'velocity', days, effectiveAccount],
    queryFn: async () => {
      await ensureAuthenticated();
      let url = `/analytics/spending/velocity?days=${days}`;
      if (effectiveAccount) url += `&account_id=${effectiveAccount}`;
      return await apiClient.get<SpendingVelocityResponse>(url);
    },
    staleTime: 60 * 1000,
  });
}

export function useRecentTransactions(pageSize: number = 5) {
  return useQuery<PaginatedTransactions>({
    queryKey: ['transactions', 'recent', pageSize],
    queryFn: async () => {
      await ensureAuthenticated();
      return await apiClient.get<PaginatedTransactions>(`/transactions?page_size=${pageSize}`);
    },
    staleTime: 60 * 1000,
  });
}
