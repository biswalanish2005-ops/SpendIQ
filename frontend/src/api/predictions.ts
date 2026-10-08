import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { ensureAuthenticated } from './auth';

export interface CombinedTimelinePoint {
  period_date: string;
  period_label: string;
  actual_amount: number | null;
  forecast_amount: number | null;
  lower_bound: number | null;
  upper_bound: number | null;
  is_forecast: boolean;
}

export interface SpendingDriver {
  category_name: string;
  historical_monthly_average: number;
  current_amount: number;
  projected_amount: number;
  dollar_variance: number;
  percentage_impact: number;
  direction: 'INCREASE' | 'DECREASE' | 'STABLE';
  impact_level: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}

export interface CategoryForecast {
  category_name: string;
  current_spend: number;
  projected_spend: number;
  projected_change_pct: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  confidence_score: number;
  share_of_projected_spend: number;
}

export interface ForecastRunSummary {
  run_id: string;
  target_metric: string;
  horizon_days: number;
  model_name: string;
  model_version: string;
  created_at: string;
  evaluation_metrics: {
    mae?: number;
    rmse?: number;
    mape?: number;
    alpha?: number;
    beta?: number;
    baseline_mae?: number;
    baseline_rmse?: number;
    [key: string]: any;
  };
}

export interface SavingsForecast {
  projected_savings_amount: number;
  projected_savings_rate: number;
  status: 'IMPROVING' | 'CONCERNING' | 'STABLE';
}

export interface InvestmentForecast {
  projected_contribution: number;
  status: 'IMPROVING' | 'CONCERNING' | 'STABLE';
}

export interface SpendingForecastResponse {
  run: ForecastRunSummary;
  projected_next_month: number;
  historical_monthly_average: number;
  expected_change_pct: number;
  direction: 'INCREASE' | 'DECREASE' | 'STABLE';
  financial_impact: 'CONCERNING' | 'IMPROVING' | 'NEUTRAL';
  status: 'CONCERNING' | 'IMPROVING' | 'STABLE';
  confidence_interval_pct: number;
  next_month_lower_bound: number | null;
  next_month_upper_bound: number | null;
  timeline: CombinedTimelinePoint[];
  drivers: SpendingDriver[];
  category_forecasts: CategoryForecast[];
  savings_forecast: SavingsForecast | null;
  investment_forecast: InvestmentForecast | null;
}

export function useSpendingForecast(horizonMonths: number = 3, confidenceLevel: number = 0.80) {
  return useQuery<SpendingForecastResponse>({
    queryKey: ['predictions', 'spending', horizonMonths, confidenceLevel],
    queryFn: async () => {
      await ensureAuthenticated();
      return await apiClient.get<SpendingForecastResponse>(
        `/predictions/spending?horizon_months=${horizonMonths}&confidence_level=${confidenceLevel}`
      );
    },
    staleTime: 60 * 1000,
  });
}

export function useSpendingDrivers() {
  return useQuery<SpendingDriver[]>({
    queryKey: ['predictions', 'drivers'],
    queryFn: async () => {
      await ensureAuthenticated();
      return await apiClient.get<SpendingDriver[]>('/predictions/drivers');
    },
    staleTime: 60 * 1000,
  });
}

export function useCategoryForecasts() {
  return useQuery<CategoryForecast[]>({
    queryKey: ['predictions', 'categories'],
    queryFn: async () => {
      await ensureAuthenticated();
      return await apiClient.get<CategoryForecast[]>('/predictions/categories');
    },
    staleTime: 60 * 1000,
  });
}

export function useRecomputeForecast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      horizonMonths = 3,
      confidenceLevel = 0.80,
    }: {
      horizonMonths?: number;
      confidenceLevel?: number;
    }) => {
      await ensureAuthenticated();
      return await apiClient.post<SpendingForecastResponse>(
        `/predictions/recompute?horizon_months=${horizonMonths}&confidence_level=${confidenceLevel}`,
        {}
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
