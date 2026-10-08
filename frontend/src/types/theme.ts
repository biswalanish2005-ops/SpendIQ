export type FinancialDirection = 'INCREASE' | 'DECREASE' | 'NEUTRAL';

export type FinancialImpact = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export type SemanticStatus = 
  | 'IMPROVING' 
  | 'CONCERNING' 
  | 'STABLE' 
  | 'ATTENTION_REQUIRED'
  | 'NEUTRAL';

export interface SemanticMetric {
  value: number;
  currency?: string;
  changePercent?: number;
  direction?: FinancialDirection;
  impact?: FinancialImpact;
  status?: SemanticStatus;
  statusLabel?: string;
  comparisonPeriod?: string;
  historicalAverage?: number;
}
