import React from 'react';
import type { SemanticStatus, FinancialDirection } from '../../types/theme';
import { getSemanticStyles } from '../../lib/semantics';
import { formatPercent, cn } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

export interface TrendIndicatorProps {
  changePercent: number;
  status: SemanticStatus;
  direction?: FinancialDirection;
  comparisonPeriod?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  changePercent,
  status,
  comparisonPeriod,
  className,
  size = 'md',
}) => {
  const styles = getSemanticStyles(status);
  const iconSize = size === 'sm' ? 14 : 16;

  const renderIcon = () => {
    if (changePercent > 0) {
      return <ArrowUpRight size={iconSize} className="shrink-0" />;
    } else if (changePercent < 0) {
      return <ArrowDownRight size={iconSize} className="shrink-0" />;
    }
    return <ArrowRight size={iconSize} className="shrink-0" />;
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5 text-xs font-medium', className)}>
      <span className={cn('inline-flex items-center gap-0.5 font-semibold', styles.textColor)}>
        {renderIcon()}
        {formatPercent(changePercent)}
      </span>
      {comparisonPeriod && (
        <span className="text-textMuted font-normal">
          vs {comparisonPeriod}
        </span>
      )}
    </div>
  );
};
