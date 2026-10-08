export const SPENDIQ_TOKENS = {
  colors: {
    background: '#0B0F14',
    surface: '#111720',
    card: '#151C25',
    cardElevated: '#19222D',
    border: '#26313D',
    borderLight: '#334155',
    primary: '#3B82F6',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    positive: '#22C55E',
    negative: '#EF4444',
    warning: '#F59E0B',
    neutral: '#3B82F6',
    ai: '#06B6D4',
  },
  chart: {
    gridColor: '#26313D',
    axisColor: '#64748B',
    tooltipBg: '#19222D',
    tooltipBorder: '#26313D',
    actualLine: '#3B82F6',
    forecastLine: '#06B6D4',
    positiveLine: '#22C55E',
    negativeLine: '#EF4444',
    averageLine: '#64748B',
    forecastDash: '4 4',
  }
} as const;

export type SpendIQTokens = typeof SPENDIQ_TOKENS;
