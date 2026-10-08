import React, { useState } from 'react';
import {
  useInsights,
  useInsightSummary,
  useUpdateInsightStatus,
  useGenerateInsights,
} from '../api/insights';
import { InsightSummaryHero } from '../components/insights/InsightSummaryHero';
import { InsightFilterBar } from '../components/insights/InsightFilterBar';
import { InsightCard } from '../components/insights/InsightCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Sparkles, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';

export const InsightsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedActionState, setSelectedActionState] = useState<string>('ACTIVE');
  const [notification, setNotification] = useState<string | null>(null);

  const {
    data: insights,
    isLoading: isInsightsLoading,
    error: insightsError,
    refetch: refetchInsights,
  } = useInsights(selectedCategory, selectedStatus, selectedActionState);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useInsightSummary();

  const updateStatusMutation = useUpdateInsightStatus();
  const generateMutation = useGenerateInsights();

  const handleUpdateStatus = async (insightId: string, newStatus: 'ACTIVE' | 'DISMISSED' | 'ACTED_UPON') => {
    try {
      await updateStatusMutation.mutateAsync({ insightId, status: newStatus });
      setNotification(`Insight marked as ${newStatus.toLowerCase().replace('_', ' ')}.`);
      setTimeout(() => setNotification(null), 4000);
      refetchSummary();
    } catch (err: any) {
      console.error('Failed to update insight status:', err);
    }
  };

  const handleRegenerate = async () => {
    try {
      await generateMutation.mutateAsync();
      setNotification('Analytical facts re-evaluated and insights updated.');
      setTimeout(() => setNotification(null), 4000);
      refetchInsights();
      refetchSummary();
    } catch (err: any) {
      console.error('Failed to regenerate insights:', err);
    }
  };

  if (insightsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-textPrimary">AI Insights Workspace</h1>
          <p className="text-xs text-textSecondary">Grounded narrative explanations tied directly to verified analytics</p>
        </div>
        <div className="rounded-xl border border-negative/30 bg-negative/10 p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-negative mb-2" />
          <h3 className="text-sm font-semibold text-textPrimary mb-1">Failed to load AI insights</h3>
          <p className="text-xs text-textSecondary mb-4">
            {(insightsError as any)?.message || 'An unexpected error occurred while fetching insights.'}
          </p>
          <button
            onClick={() => {
              refetchInsights();
              refetchSummary();
            }}
            className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-textPrimary hover:bg-cardElevated inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-ai/10 border border-ai/20 flex items-center justify-center text-ai">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-textPrimary">AI Insights Workspace</h1>
            <p className="text-xs text-textSecondary">
              Data-grounded financial narratives and recommendations verified against mathematical telemetry
            </p>
          </div>
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div className="rounded-lg bg-positive/10 border border-positive/30 p-3 text-xs text-positive flex items-center gap-2 animate-fadeIn">
          <CheckCircle size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Intelligence Summary Hero */}
      <InsightSummaryHero
        summary={summary}
        isLoading={isSummaryLoading}
        onRegenerate={handleRegenerate}
        isRegenerating={generateMutation.isPending}
      />

      {/* Multi-Domain Filter Controls */}
      <InsightFilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        selectedActionState={selectedActionState}
        onSelectActionState={setSelectedActionState}
      />

      {/* Insights Cards Grid */}
      {isInsightsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-12 w-full rounded" />
              <Skeleton className="h-16 w-full rounded" />
            </div>
          ))}
        </div>
      ) : !insights || insights.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <EmptyState
            icon={<Sparkles size={28} className="text-ai" />}
            title="No insights match your filter"
            description="Try selecting a different domain category, status, or switch to the 'All' tab to view archived items."
            actionLabel="Reset Filters"
            onAction={() => {
              setSelectedCategory('ALL');
              setSelectedStatus('ALL');
              setSelectedActionState('ACTIVE');
            }}
          />

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((ins) => (
            <InsightCard
              key={ins.id}
              insight={ins}
              onUpdateStatus={handleUpdateStatus}
              isUpdating={updateStatusMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
};
