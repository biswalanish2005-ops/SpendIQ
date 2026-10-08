import React from 'react';
import type { AnomalySummary } from '../../api/anomalies';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { AlertTriangle, ShieldAlert, CheckCircle2, DollarSign } from 'lucide-react';

interface AnomalySummaryCardsProps {
  summary?: AnomalySummary;
  isLoading?: boolean;
}

export const AnomalySummaryCards: React.FC<AnomalySummaryCardsProps> = ({
  summary,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const total = summary?.total_anomalies || 0;
  const high = summary?.high_severity_count || 0;
  const anomalousSpend = summary?.total_anomalous_amount || 0;
  const resolutionRate = summary?.resolution_rate || 100;
  const resolved = summary?.resolved_count || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Unusual Transactions */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-card flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
              Unusual Transactions
            </span>
            <AlertTriangle size={16} className="text-warning" />
          </div>
          <div className="text-2xl font-bold font-mono text-textPrimary mt-2">
            {total}
          </div>
        </div>
        <div className="text-xs text-textMuted pt-3 mt-2 border-t border-border/60 flex items-center justify-between">
          <span>Unresolved:</span>
          <span className="font-mono font-semibold text-textPrimary">
            {total - resolved}
          </span>
        </div>
      </div>

      {/* Card 2: High Severity Count */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-card flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
              High Severity Outliers
            </span>
            <ShieldAlert size={16} className={high > 0 ? 'text-negative' : 'text-textMuted'} />
          </div>
          <div className="text-2xl font-bold font-mono mt-2 flex items-center gap-2">
            <span className={high > 0 ? 'text-negative' : 'text-textPrimary'}>
              {high}
            </span>
            {high > 0 && (
              <Badge variant="negative" size="sm">
                Requires Review
              </Badge>
            )}
          </div>
        </div>
        <div className="text-xs text-textMuted pt-3 mt-2 border-t border-border/60">
          Transactions &gt;3.0x above category baseline
        </div>
      </div>

      {/* Card 3: Unusual Spend Volume */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-card flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
              Anomalous Spend Volume
            </span>
            <DollarSign size={16} className="text-ai" />
          </div>
          <div className="text-2xl font-bold font-mono text-textPrimary mt-2">
            {formatCurrency(anomalousSpend)}
          </div>
        </div>
        <div className="text-xs text-textMuted pt-3 mt-2 border-t border-border/60">
          Cumulative value of flagged transactions
        </div>
      </div>

      {/* Card 4: Resolution Rate */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-card flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
              Resolution Rate
            </span>
            <CheckCircle2 size={16} className="text-positive" />
          </div>
          <div className="text-2xl font-bold font-mono text-textPrimary mt-2">
            {resolutionRate}%
          </div>
        </div>
        <div className="text-xs text-textMuted pt-3 mt-2 border-t border-border/60 flex items-center justify-between">
          <span>Acknowledged:</span>
          <span className="font-mono font-semibold text-positive">
            {resolved} / {total}
          </span>
        </div>
      </div>
    </div>
  );
};
