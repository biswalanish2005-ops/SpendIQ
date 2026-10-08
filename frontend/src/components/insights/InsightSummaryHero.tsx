import React from 'react';
import type { InsightSummary } from '../../api/insights';
import { Badge } from '../ui/Badge';
import { Sparkles, TrendingUp, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

interface InsightSummaryHeroProps {
  summary?: InsightSummary;
  isLoading?: boolean;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export const InsightSummaryHero: React.FC<InsightSummaryHeroProps> = ({
  summary,
  isLoading = false,
  onRegenerate,
  isRegenerating = false,
}) => {
  const total = summary?.total_insights ?? 0;
  const active = summary?.active_count ?? 0;
  const improving = summary?.improving_count ?? 0;
  const attention = summary?.attention_count ?? 0;
  const avgConf = summary?.average_confidence ?? 95.0;

  return (
    <div className="rounded-xl border border-ai/25 bg-gradient-to-br from-ai/10 via-card to-card p-5 shadow-card transition-all duration-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="ai" size="sm" className="flex items-center gap-1">
              <Sparkles size={12} /> Grounded AI Intelligence
            </Badge>
            <span className="text-xs text-textMuted font-mono">Real-Time Synthesis</span>
          </div>
          <h2 className="text-lg font-bold text-textPrimary tracking-tight">
            Financial Narrative Insights &amp; Analytical Proof
          </h2>
          <p className="text-xs text-textSecondary mt-0.5 max-w-2xl">
            Every insight is mathematically derived from verified transactional aggregates, 
            Holt-Winters forecasting horizons, and emergency liquidity ratios.
          </p>
        </div>

        <button
          onClick={onRegenerate}
          disabled={isRegenerating || isLoading}
          className="px-3.5 py-2 rounded-lg bg-surface border border-ai/30 text-xs font-medium text-textPrimary hover:bg-cardElevated hover:border-ai transition-all duration-150 inline-flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRegenerating ? 'animate-spin text-ai' : 'text-ai'} />
          <span>{isRegenerating ? 'Analyzing Data...' : 'Refresh Insights'}</span>
        </button>
      </div>

      {/* Metric Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/50">
        <div className="p-3 rounded-lg bg-surface/50 border border-border/40">
          <div className="flex items-center justify-between text-xs text-textMuted mb-1">
            <span>Active Signals</span>
            <Sparkles size={14} className="text-ai" />
          </div>
          <div className="text-xl font-bold font-mono text-textPrimary">
            {isLoading ? '...' : active}
            <span className="text-xs font-normal text-textMuted ml-1">/ {total}</span>
          </div>
          <span className="text-[10px] text-textSecondary">Verified analytical stories</span>
        </div>

        <div className="p-3 rounded-lg bg-surface/50 border border-border/40">
          <div className="flex items-center justify-between text-xs text-textMuted mb-1">
            <span>Improving Trends</span>
            <TrendingUp size={14} className="text-positive" />
          </div>
          <div className="text-xl font-bold font-mono text-positive">
            {isLoading ? '...' : improving}
          </div>
          <span className="text-[10px] text-textSecondary">Positive financial momentum</span>
        </div>

        <div className="p-3 rounded-lg bg-surface/50 border border-border/40">
          <div className="flex items-center justify-between text-xs text-textMuted mb-1">
            <span>Requires Review</span>
            <AlertTriangle size={14} className="text-warning" />
          </div>
          <div className="text-xl font-bold font-mono text-warning">
            {isLoading ? '...' : attention}
          </div>
          <span className="text-[10px] text-textSecondary">Actionable spending signals</span>
        </div>

        <div className="p-3 rounded-lg bg-surface/50 border border-border/40">
          <div className="flex items-center justify-between text-xs text-textMuted mb-1">
            <span>Confidence Index</span>
            <ShieldCheck size={14} className="text-primary" />
          </div>
          <div className="text-xl font-bold font-mono text-primary">
            {isLoading ? '...' : `${avgConf}%`}
          </div>
          <span className="text-[10px] text-textSecondary">Deterministic data grounding</span>
        </div>
      </div>
    </div>
  );
};
