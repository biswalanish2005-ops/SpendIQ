import React from 'react';
import { cn } from '../../lib/utils';
import { Database } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border bg-surface/30 min-h-[260px]',
        className
      )}
    >
      <div className="p-3.5 rounded-full bg-surface border border-border text-textSecondary mb-3">
        {icon || <Database size={24} className="text-textMuted" />}
      </div>
      <h4 className="text-sm font-semibold text-textPrimary mb-1">{title}</h4>
      <p className="text-xs text-textSecondary max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
