import React from 'react';
import type { SemanticStatus } from '../../types/theme';
import { getSemanticStyles } from '../../lib/semantics';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

export interface StatusBadgeProps {
  status: SemanticStatus;
  label?: string;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showIcon = true,
  className,
  size = 'md',
}) => {
  const styles = getSemanticStyles(status);
  const displayLabel = label || styles.defaultLabel;

  const renderIcon = () => {
    const iconSize = size === 'sm' ? 12 : 14;
    switch (status) {
      case 'IMPROVING':
        return <TrendingUp size={iconSize} className="text-positive" />;
      case 'CONCERNING':
        return <TrendingDown size={iconSize} className="text-negative" />;
      case 'ATTENTION_REQUIRED':
        return <AlertTriangle size={iconSize} className="text-warning" />;
      case 'STABLE':
      case 'NEUTRAL':
      default:
        return <Minus size={iconSize} className="text-neutral" />;
    }
  };

  const sizeClasses = size === 'sm' 
    ? 'text-[11px] px-2 py-0.5 gap-1' 
    : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border select-none transition-colors',
        styles.bgColor,
        styles.textColor,
        styles.borderColor,
        sizeClasses,
        className
      )}
      role="status"
      aria-label={`Status: ${displayLabel}`}
    >
      {showIcon && renderIcon()}
      <span>{displayLabel}</span>
    </span>
  );
};
