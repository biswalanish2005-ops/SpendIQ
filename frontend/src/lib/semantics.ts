import type { SemanticStatus, FinancialDirection, FinancialImpact } from '../types/theme';

export interface SemanticStyleConfig {
  textColor: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  defaultLabel: string;
}

/**
 * Maps semantic status to visual design tokens.
 * Status conveys financial health: IMPROVING, CONCERNING, STABLE, ATTENTION_REQUIRED.
 */
export function getSemanticStyles(status: SemanticStatus): SemanticStyleConfig {
  switch (status) {
    case 'IMPROVING':
      return {
        textColor: 'text-positive',
        bgColor: 'bg-positive-muted',
        borderColor: 'border-positive-border',
        iconColor: '#22C55E',
        defaultLabel: 'Improving',
      };
    case 'CONCERNING':
      return {
        textColor: 'text-negative',
        bgColor: 'bg-negative-muted',
        borderColor: 'border-negative-border',
        iconColor: '#EF4444',
        defaultLabel: 'Concerning',
      };
    case 'ATTENTION_REQUIRED':
      return {
        textColor: 'text-warning',
        bgColor: 'bg-warning-muted',
        borderColor: 'border-warning-border',
        iconColor: '#F59E0B',
        defaultLabel: 'Attention Required',
      };
    case 'STABLE':
    case 'NEUTRAL':
    default:
      return {
        textColor: 'text-neutral',
        bgColor: 'bg-neutral-muted',
        borderColor: 'border-neutral-border',
        iconColor: '#3B82F6',
        defaultLabel: 'Stable',
      };
  }
}

/**
 * Determine semantic status based on metric category and directional change.
 * Useful when raw values are supplied before backend classification.
 * - Spending increase -> CONCERNING; spending decrease -> IMPROVING
 * - Savings / Income / Investment increase -> IMPROVING; decrease -> CONCERNING
 */
export function deriveSemanticStatus(
  metricCategory: 'SPENDING' | 'SAVINGS' | 'INCOME' | 'INVESTMENT',
  changePercent: number
): { status: SemanticStatus; direction: FinancialDirection; impact: FinancialImpact } {
  if (Math.abs(changePercent) < 0.5) {
    return { status: 'STABLE', direction: 'NEUTRAL', impact: 'NEUTRAL' };
  }

  const isIncrease = changePercent > 0;
  const direction: FinancialDirection = isIncrease ? 'INCREASE' : 'DECREASE';

  if (metricCategory === 'SPENDING') {
    return {
      status: isIncrease ? 'CONCERNING' : 'IMPROVING',
      direction,
      impact: isIncrease ? 'NEGATIVE' : 'POSITIVE',
    };
  } else {
    // SAVINGS, INCOME, INVESTMENT
    return {
      status: isIncrease ? 'IMPROVING' : 'CONCERNING',
      direction,
      impact: isIncrease ? 'POSITIVE' : 'NEGATIVE',
    };
  }
}
