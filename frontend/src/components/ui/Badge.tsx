import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'positive' | 'negative' | 'warning' | 'neutral' | 'ai' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none';

  const variants = {
    default: 'bg-surface text-textSecondary border border-border',
    positive: 'bg-positive-muted text-positive border border-positive-border',
    negative: 'bg-negative-muted text-negative border border-negative-border',
    warning: 'bg-warning-muted text-warning border border-warning-border',
    neutral: 'bg-neutral-muted text-neutral border border-neutral-border',
    ai: 'bg-ai-muted text-ai border border-ai-border shadow-ai-glow',
    outline: 'border border-border text-textSecondary',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
