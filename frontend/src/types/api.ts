import type { SemanticStatus, FinancialDirection, FinancialImpact } from './theme';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface MetricSummary {
  metric: string;
  label: string;
  current: number;
  previous: number;
  changePercent: number;
  direction: FinancialDirection;
  impact: FinancialImpact;
  status: SemanticStatus;
  statusText: string;
  historicalAverage?: number;
  sparkline?: number[];
  currency?: string;
}

export interface DateRangeFilter {
  label: string;
  value: '30D' | '90D' | '6M' | '1Y' | 'YTD' | 'ALL';
  startDate?: string;
  endDate?: string;
}
