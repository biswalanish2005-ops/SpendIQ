import React, { useState, useMemo } from 'react';
import type { AnomalyItem, AnomalyStatus } from '../../api/anomalies';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface AnomalyTableProps {
  anomalies: AnomalyItem[];
  isLoading?: boolean;
  onUpdateStatus: (anomalyId: string, status: AnomalyStatus) => void;
  isUpdating?: boolean;
}

export const AnomalyTable: React.FC<AnomalyTableProps> = ({
  anomalies,
  isLoading = false,
  onUpdateStatus,
  isUpdating = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((item) => {
      // Filter tab
      if (activeFilter === 'HIGH' && item.severity !== 'HIGH') return false;
      if (activeFilter === 'MEDIUM' && item.severity !== 'MEDIUM') return false;
      if (activeFilter === 'LOW' && item.severity !== 'LOW') return false;
      if (activeFilter === 'RESOLVED' && item.status === 'DETECTED') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchMerchant = item.merchant_name.toLowerCase().includes(query);
        const matchCategory = item.category_name.toLowerCase().includes(query);
        const matchExplanation = item.explanation.toLowerCase().includes(query);
        return matchMerchant || matchCategory || matchExplanation;
      }
      return true;
    });
  }, [anomalies, activeFilter, searchQuery]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-64 w-full mt-4" />
      </div>
    );
  }

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'negative';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const getStatusBadge = (status: AnomalyStatus) => {
    switch (status) {
      case 'ACKNOWLEDGED':
        return (
          <Badge variant="positive" size="sm">
            <CheckCircle2 size={11} className="mr-1 inline" />
            Acknowledged
          </Badge>
        );
      case 'DISMISSED':
        return (
          <Badge variant="neutral" size="sm">
            <XCircle size={11} className="mr-1 inline" />
            Dismissed
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" size="sm">
            <AlertTriangle size={11} className="mr-1 inline" />
            Detected
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-textPrimary">
            Unusual Transactions Ledger
          </h3>
          <p className="text-xs text-textSecondary mt-0.5">
            Individual transactions classified as statistical deviations from category baselines
          </p>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textMuted" />
            <input
              type="text"
              placeholder="Search merchant or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-lg border border-border bg-surface text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-primary w-48 sm:w-60"
            />
          </div>

          <div className="flex items-center rounded-lg border border-border bg-surface p-0.5 text-xs font-mono">
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW', 'RESOLVED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2 py-1 rounded transition-colors ${
                  activeFilter === filter
                    ? 'bg-primary text-white font-semibold'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter === 'RESOLVED' ? 'Reviewed' : filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-textSecondary uppercase tracking-wider">
              <th className="pb-3 pl-2">Transaction</th>
              <th className="pb-3">Category</th>
              <th className="pb-3 text-right">Amount</th>
              <th className="pb-3 text-right">Expected Baseline</th>
              <th className="pb-3 text-right">Deviation</th>
              <th className="pb-3 text-center">Severity</th>
              <th className="pb-3 text-center">Status</th>
              <th className="pb-3 text-right pr-2">Review Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {filteredAnomalies.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-textMuted">
                  No unusual transactions found for the selected criteria.
                </td>
              </tr>
            ) : (
              filteredAnomalies.map((item) => {
                const isExpanded = expandedId === item.id;
                const occurredDate = new Date(item.occurred_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-cardElevated/60 transition-colors duration-150">
                      <td className="py-3 pl-2">
                        <div className="font-semibold text-textPrimary flex items-center gap-1.5">
                          <span>{item.merchant_name}</span>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="text-textMuted hover:text-textPrimary transition-colors"
                            title="Toggle explanation"
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                        <div className="text-[10px] text-textMuted font-mono">
                          {occurredDate}
                        </div>
                      </td>

                      <td className="py-3 text-textSecondary font-medium">
                        {item.category_name}
                      </td>

                      <td className="py-3 text-right font-mono font-bold text-textPrimary">
                        {formatCurrency(item.amount)}
                      </td>

                      <td className="py-3 text-right font-mono text-textSecondary">
                        {formatCurrency(item.expected_value)}
                      </td>

                      <td className="py-3 text-right font-mono font-semibold">
                        <span className={item.severity === 'HIGH' ? 'text-negative' : 'text-warning'}>
                          {item.deviation_factor.toFixed(1)}x
                        </span>
                      </td>

                      <td className="py-3 text-center">
                        <Badge variant={getSeverityBadgeVariant(item.severity)} size="sm">
                          {item.severity}
                        </Badge>
                      </td>

                      <td className="py-3 text-center">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className="py-3 text-right pr-2">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'DETECTED' ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => onUpdateStatus(item.id, 'ACKNOWLEDGED')}
                                className="text-[11px] h-7 px-2 border-positive/30 text-positive hover:bg-positive/10 hover:border-positive"
                              >
                                Acknowledge
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => onUpdateStatus(item.id, 'DISMISSED')}
                                className="text-[11px] h-7 px-2 border-border text-textSecondary hover:text-textPrimary"
                              >
                                Dismiss
                              </Button>
                            </>
                          ) : (
                            <span className="text-[11px] text-textMuted flex items-center justify-end gap-1">
                              <ShieldCheck size={13} className="text-positive" />
                              Reviewed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Explanation Row */}
                    {isExpanded && (
                      <tr className="bg-cardElevated/40 border-b border-border/80">
                        <td colSpan={8} className="p-3 pl-6">
                          <div className="flex items-start gap-2 text-xs text-textSecondary bg-surface/60 p-3 rounded-lg border border-border/60">
                            <Info size={14} className="text-ai mt-0.5 shrink-0" />
                            <div>
                              <div className="font-semibold text-textPrimary mb-0.5">
                                Pattern Evaluation Rationale:
                              </div>
                              <p className="text-textSecondary leading-relaxed font-normal">
                                {item.explanation}
                              </p>
                              <div className="text-[10px] text-textMuted mt-1.5 font-mono">
                                Outlier Score: {item.anomaly_score.toFixed(2)} • Detection Timestamp: {new Date(item.detected_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
