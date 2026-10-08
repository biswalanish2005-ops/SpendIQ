import { SPENDIQ_TOKENS } from '../../constants/tokens';

export const CHART_THEME = {
  colors: {
    grid: SPENDIQ_TOKENS.chart.gridColor,
    axis: SPENDIQ_TOKENS.chart.axisColor,
    tooltipBg: SPENDIQ_TOKENS.chart.tooltipBg,
    tooltipBorder: SPENDIQ_TOKENS.chart.tooltipBorder,
    actual: SPENDIQ_TOKENS.chart.actualLine,
    forecast: SPENDIQ_TOKENS.chart.forecastLine,
    positive: SPENDIQ_TOKENS.chart.positiveLine,
    negative: SPENDIQ_TOKENS.chart.negativeLine,
    average: SPENDIQ_TOKENS.chart.averageLine,
  },
  typography: {
    fontSize: 11,
    fontFamily: 'JetBrains Mono, monospace',
  },
  grid: {
    strokeDasharray: '3 3',
    stroke: '#26313D',
    opacity: 0.6,
  },
  axis: {
    stroke: '#26313D',
    tick: {
      fill: '#64748B',
      fontSize: 11,
      fontFamily: 'Inter, sans-serif',
    },
  },
  lines: {
    actual: {
      stroke: '#3B82F6',
      strokeWidth: 2.2,
      dot: { r: 3, fill: '#3B82F6', strokeWidth: 0 },
      activeDot: { r: 5, fill: '#60A5FA', stroke: '#1D4ED8', strokeWidth: 2 },
    },
    forecast: {
      stroke: '#06B6D4',
      strokeWidth: 2,
      strokeDasharray: '5 5',
      dot: { r: 3, fill: '#06B6D4', strokeWidth: 0 },
      activeDot: { r: 5, fill: '#22D3EE', stroke: '#0E7490', strokeWidth: 2 },
    },
    average: {
      stroke: '#64748B',
      strokeWidth: 1.5,
      strokeDasharray: '2 2',
    },
  },
  intervals: {
    fill: '#06B6D4',
    fillOpacity: 0.12,
  },
};
