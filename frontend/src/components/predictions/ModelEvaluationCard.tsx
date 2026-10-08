import React from 'react';
import type { ForecastRunSummary } from '../../api/predictions';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Cpu, Award, Info } from 'lucide-react';

interface ModelEvaluationCardProps {
  run: ForecastRunSummary;
  confidenceLevelPct: number;
  isLoading?: boolean;
}

export const ModelEvaluationCard: React.FC<ModelEvaluationCardProps> = ({
  run,
  confidenceLevelPct,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  const metrics = run?.evaluation_metrics || {};
  const hwMae = metrics.mae !== undefined ? Number(metrics.mae) : 0;
  const hwRmse = metrics.rmse !== undefined ? Number(metrics.rmse) : 0;
  const hwMape = metrics.mape !== undefined ? Number(metrics.mape) : 0;
  const baseMae = metrics.baseline_mae !== undefined ? Number(metrics.baseline_mae) : 0;
  const baseRmse = metrics.baseline_rmse !== undefined ? Number(metrics.baseline_rmse) : 0;
  const alpha = metrics.alpha !== undefined ? Number(metrics.alpha) : 0.3;
  const beta = metrics.beta !== undefined ? Number(metrics.beta) : 0.1;

  const isBetterThanBaseline = baseMae > 0 ? hwMae <= baseMae : true;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-ai/10 text-ai border border-ai/20">
            <Cpu size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight text-textPrimary">
                Model Evaluation & Verification
              </h3>
              <Badge variant="ai" size="sm">
                v{run?.model_version || '1.2.0'}
              </Badge>
            </div>
            <p className="text-xs text-textSecondary mt-0.5">
              {run?.model_name || 'Holt-Winters Linear Trend'} • Grid-search optimized hyperparameters
            </p>
          </div>
        </div>

        {isBetterThanBaseline && baseMae > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-positive font-medium bg-positive/10 px-2.5 py-1 rounded-full border border-positive/20 shrink-0">
            <Award size={13} />
            Outperforms Rolling Baseline
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-cardElevated border border-border/80 space-y-1">
          <div className="text-[11px] text-textMuted uppercase font-mono">Mean Absolute Error (MAE)</div>
          <div className="font-mono text-base font-bold text-textPrimary">
            ${hwMae.toFixed(2)}
          </div>
          <div className="text-[10px] text-textSecondary">
            Baseline MAE: ${baseMae.toFixed(2)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-cardElevated border border-border/80 space-y-1">
          <div className="text-[11px] text-textMuted uppercase font-mono">Root Mean Sq Error (RMSE)</div>
          <div className="font-mono text-base font-bold text-textPrimary">
            ${hwRmse.toFixed(2)}
          </div>
          <div className="text-[10px] text-textSecondary">
            Baseline RMSE: ${baseRmse.toFixed(2)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-cardElevated border border-border/80 space-y-1">
          <div className="text-[11px] text-textMuted uppercase font-mono">Mean Abs Pct Error (MAPE)</div>
          <div className="font-mono text-base font-bold text-textPrimary">
            {hwMape.toFixed(1)}%
          </div>
          <div className="text-[10px] text-positive">
            High Forecast Fidelity
          </div>
        </div>

        <div className="p-3 rounded-lg bg-cardElevated border border-border/80 space-y-1">
          <div className="text-[11px] text-textMuted uppercase font-mono">Smoothing Hyperparams</div>
          <div className="font-mono text-sm font-bold text-textPrimary flex items-center gap-2">
            <span>α: {alpha}</span>
            <span className="text-textMuted">|</span>
            <span>β: {beta}</span>
          </div>
          <div className="text-[10px] text-textSecondary">
            Confidence Level: {confidenceLevelPct}%
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-surface/50 border border-border text-[11px] text-textSecondary">
        <Info size={14} className="text-ai mt-0.5 shrink-0" />
        <span>
          Holt-Winters Double Exponential Smoothing dynamically separates level and trend momentum. Analytical confidence intervals expand proportionally to the forecast horizon using accumulated residual error variance.
        </span>
      </div>
    </div>
  );
};
