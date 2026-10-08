import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { InsightItem, InsightActionState } from '../../api/insights';
import { Badge } from '../ui/Badge';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';

interface InsightCardProps {
  insight: InsightItem;
  onUpdateStatus: (insightId: string, status: InsightActionState) => void;
  isUpdating?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onUpdateStatus,
  isUpdating = false,
}) => {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    switch (insight.status) {
      case 'IMPROVING':
        return (
          <Badge variant="positive" size="sm" className="flex items-center gap-1">
            <TrendingUp size={12} /> Improving
          </Badge>
        );
      case 'CONCERNING':
        return (
          <Badge variant="warning" size="sm" className="flex items-center gap-1">
            <TrendingDown size={12} /> Concerning
          </Badge>
        );
      case 'ATTENTION_REQUIRED':
        return (
          <Badge variant="negative" size="sm" className="flex items-center gap-1">
            <AlertTriangle size={12} /> Action Needed
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm">
            Stable
          </Badge>
        );
    }
  };

  const getCategoryBadge = () => {
    return (
      <Badge variant="ai" size="sm" className="flex items-center gap-1 font-mono uppercase text-[10px]">
        <Sparkles size={10} /> {insight.category.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div
      className={`rounded-xl border bg-card p-5 shadow-card transition-all duration-200 flex flex-col justify-between hover:border-ai/40 ${
        insight.status === 'ATTENTION_REQUIRED'
          ? 'border-negative/30 bg-negative/5'
          : insight.status === 'IMPROVING'
          ? 'border-positive/25 hover:shadow-glow-positive'
          : 'border-border'
      }`}
    >
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {getCategoryBadge()}
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-textPrimary bg-surface/70 px-2 py-0.5 rounded border border-border">
              {insight.metric_value}
            </span>
            {insight.action_state !== 'ACTIVE' && (
              <Badge variant="default" size="sm" className="opacity-75">
                {insight.action_state === 'ACTED_UPON' ? 'Acted' : 'Dismissed'}
              </Badge>
            )}
          </div>
        </div>

        {/* Headline */}
        <h3 className="text-sm font-bold text-textPrimary tracking-tight mb-2">
          {insight.headline}
        </h3>

        {/* Narrative Summary */}
        <p className="text-xs text-textSecondary leading-relaxed mb-4">
          {insight.summary}
        </p>

        {/* Factual Evidence List */}
        {insight.evidence && insight.evidence.length > 0 && (
          <div className="rounded-lg bg-surface/50 border border-border/60 p-3 mb-4 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-textMuted block mb-1">
              Verified Evidence Points:
            </span>
            {insight.evidence.map((ev, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-textSecondary">
                <span className="text-ai mt-0.5 shrink-0">•</span>
                <span className="font-mono text-[11px] text-textPrimary">{ev}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recommendation Box */}
        {insight.recommendation && (
          <div className="rounded-lg bg-cardElevated/80 border border-borderLight/60 p-3 mb-4 flex items-start gap-2.5">
            <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                Analytical Recommendation:
              </span>
              <p className="text-xs text-textSecondary leading-relaxed">
                {insight.recommendation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation & Actions */}
      <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 mt-2">
        <div className="flex items-center gap-1.5 text-[11px] text-textMuted font-mono">
          <ShieldCheck size={13} className="text-primary" />
          <span>{Math.round(insight.confidence_score * 100)}% Verified</span>
        </div>

        <div className="flex items-center gap-2">
          {insight.action_state === 'ACTIVE' && (
            <>
              <button
                onClick={() => onUpdateStatus(insight.id, 'ACTED_UPON')}
                disabled={isUpdating}
                className="px-2 py-1 rounded bg-surface border border-border hover:bg-positive/10 hover:border-positive/30 hover:text-positive text-textMuted text-[11px] transition-colors inline-flex items-center gap-1"
                title="Mark this recommendation as acted upon"
              >
                <CheckCircle2 size={12} />
                <span>Acted</span>
              </button>
              <button
                onClick={() => onUpdateStatus(insight.id, 'DISMISSED')}
                disabled={isUpdating}
                className="px-2 py-1 rounded bg-surface border border-border hover:bg-surfaceElevated hover:text-textSecondary text-textMuted text-[11px] transition-colors inline-flex items-center gap-1"
                title="Dismiss this insight"
              >
                <XCircle size={12} />
                <span>Dismiss</span>
              </button>
            </>
          )}

          {/* Deep Navigation Button */}
          <button
            onClick={() => navigate(insight.navigation_link)}
            className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/25 hover:bg-primary/20 hover:border-primary/50 text-primary text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm"
          >
            <span>{insight.action_label}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
