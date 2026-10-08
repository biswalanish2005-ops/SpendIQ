import React, { useState } from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Button } from '../components/ui/Button';
import { ErrorState } from '../components/ui/ErrorState';
import { AnomalySummaryCards } from '../components/anomalies/AnomalySummaryCards';
import { AnomalyTimelineChart } from '../components/anomalies/AnomalyTimelineChart';
import { AnomalyTable } from '../components/anomalies/AnomalyTable';
import {
  useAnomalies,
  useAnomalySummary,
  useAnomalyTimeline,
  useUpdateAnomalyStatus,
  useScanAnomalies,
  type AnomalyStatus,
} from '../../src/api/anomalies';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

export const AnomaliesPage: React.FC = () => {
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const {
    data: anomalies,
    isLoading: isAnomaliesLoading,
    isError: isAnomaliesError,
    refetch: refetchAnomalies,
  } = useAnomalies();

  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useAnomalySummary();

  const {
    data: timeline,
    isLoading: isTimelineLoading,
    refetch: refetchTimeline,
  } = useAnomalyTimeline(90);

  const updateStatusMutation = useUpdateAnomalyStatus();
  const scanMutation = useScanAnomalies();

  const handleUpdateStatus = (anomalyId: string, status: AnomalyStatus) => {
    updateStatusMutation.mutate({ anomalyId, status });
  };

  const handleScan = () => {
    setScanMessage(null);
    scanMutation.mutate(undefined, {
      onSuccess: (data) => {
        setScanMessage(data.message);
        refetchAnomalies();
        refetchSummary();
        refetchTimeline();
      },
    });
  };

  const handleRefreshAll = () => {
    refetchAnomalies();
    refetchSummary();
    refetchTimeline();
  };

  if (isAnomaliesError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Anomaly Detection Unavailable"
          message="Failed to retrieve unusual transactions from the pattern detection service. Please verify backend connection."
          onRetry={handleRefreshAll}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <SectionHeader
          title="Unusual Spending Patterns"
          subtitle="Statistical outlier detection comparing individual transactions against personal category baselines."
        />

        {/* Global Action: Trigger Scan */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScan}
            disabled={scanMutation.isPending}
            className="border-warning/30 text-warning hover:bg-warning/10 hover:border-warning"
          >
            <RefreshCw
              size={13}
              className={`mr-1.5 ${scanMutation.isPending ? 'animate-spin' : ''}`}
            />
            {scanMutation.isPending ? 'Scanning Transactions...' : 'Scan for Anomalies'}
          </Button>
        </div>
      </div>

      {/* Scan Feedback Banner */}
      {scanMessage && (
        <div className="p-3.5 rounded-lg border border-positive/30 bg-positive/10 flex items-center justify-between text-xs text-positive">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{scanMessage}</span>
          </div>
          <button
            onClick={() => setScanMessage(null)}
            className="text-positive/70 hover:text-positive font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <AnomalySummaryCards
        summary={summary}
        isLoading={isSummaryLoading}
      />

      {/* Timeline Visualization */}
      <AnomalyTimelineChart
        timeline={timeline || []}
        isLoading={isTimelineLoading}
      />

      {/* Interactive Anomaly Table */}
      <AnomalyTable
        anomalies={anomalies || []}
        isLoading={isAnomaliesLoading}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={updateStatusMutation.isPending}
      />
    </div>
  );
};

export default AnomaliesPage;
