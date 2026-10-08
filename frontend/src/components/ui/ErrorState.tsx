import React from 'react';
import { cn } from '../../lib/utils';
import { AlertOctagon, RotateCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Data',
  message = 'An unexpected error occurred while communicating with the analytics service.',
  onRetry,
  className,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-negative/30 bg-negative/5 min-h-[220px]',
        className
      )}
    >
      <div className="p-3 rounded-full bg-negative/10 border border-negative/20 text-negative mb-3">
        <AlertOctagon size={24} />
      </div>
      <h4 className="text-sm font-semibold text-textPrimary mb-1">{title}</h4>
      <p className="text-xs text-textSecondary max-w-sm mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RotateCw size={14} />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
