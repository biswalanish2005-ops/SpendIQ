import React from 'react';
import type { EmergencyFundDetails } from '../../api/savings';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { ShieldCheck, AlertCircle, CheckCircle2, TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface EmergencyFundCardProps {
  emergencyFund: EmergencyFundDetails;
  isLoading?: boolean;
}

export const EmergencyFundCard: React.FC<EmergencyFundCardProps> = ({
  emergencyFund,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="h-6 w-48 bg-surface rounded mb-4" />
        <div className="h-20 bg-surface rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-14 bg-surface rounded" />
          <div className="h-14 bg-surface rounded" />
        </div>
      </div>
    );
  }

  const {
    liquid_balance,
    monthly_burn_rate,
    months_of_coverage,
    recommended_months,
    target_reserve_amount,
    funding_percentage,
    status,
  } = emergencyFund;

  const getStatusBadge = () => {
    switch (status) {
      case 'EXCELLENT':
        return (
          <Badge variant="positive" size="sm" className="flex items-center gap-1">
            <CheckCircle2 size={12} /> Robust (Exceeds 6 Mo)
          </Badge>
        );
      case 'ADEQUATE':
        return (
          <Badge variant="warning" size="sm" className="flex items-center gap-1">
            <ShieldCheck size={12} /> Adequate (3-6 Mo)
          </Badge>
        );
      default:
        return (
          <Badge variant="negative" size="sm" className="flex items-center gap-1">
            <AlertCircle size={12} /> Needs Attention (&lt; 3 Mo)
          </Badge>
        );
    }
  };

  // Calculate progress bar percentage (capped at 100% for visual width, but value shown accurately)
  const visualProgressPct = Math.min(100, Math.round(funding_percentage));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-textPrimary">Emergency Fund Runway</h3>
            <p className="text-xs text-textSecondary">Liquid cash reserves relative to average monthly expense burn</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Metric Hero */}
      <div className="bg-surface/60 rounded-xl p-4 border border-borderLight/40 mb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <div>
            <span className="text-3xl font-extrabold tracking-tight text-textPrimary font-mono">
              {months_of_coverage}
            </span>
            <span className="text-sm font-medium text-textSecondary ml-1.5">Months of Coverage</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-medium text-positive">
              {funding_percentage}%
            </span>
            <span className="text-xs text-textMuted ml-1">of 6-mo goal</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface h-2.5 rounded-full overflow-hidden border border-borderLight/60 relative">
          <div
            className={`h-full transition-all duration-700 rounded-full ${
              months_of_coverage >= 6
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : months_of_coverage >= 3
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                : 'bg-gradient-to-r from-rose-500 to-red-400'
            }`}
            style={{ width: `${visualProgressPct}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-textMuted mt-1.5 font-mono">
          <span>0 mo</span>
          <span>Target: {recommended_months} months ({formatCurrency(target_reserve_amount)})</span>
          <span>12+ mo</span>
        </div>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-surface/40 border border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-textMuted mb-1">
            <DollarSign size={14} className="text-primary" />
            <span>Liquid Cash Reserves</span>
          </div>
          <p className="text-base font-semibold font-mono text-textPrimary">
            {formatCurrency(liquid_balance)}
          </p>
          <span className="text-[11px] text-textSecondary">Checking &amp; Savings balances</span>
        </div>

        <div className="p-3 rounded-lg bg-surface/40 border border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-textMuted mb-1">
            <Calendar size={14} className="text-warning" />
            <span>Monthly Burn Rate</span>
          </div>
          <p className="text-base font-semibold font-mono text-textPrimary">
            {formatCurrency(monthly_burn_rate)}
            <span className="text-xs font-normal text-textMuted"> /mo</span>
          </p>
          <span className="text-[11px] text-textSecondary">6-month average baseline</span>
        </div>

        <div className="p-3 rounded-lg bg-surface/40 border border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-textMuted mb-1">
            <TrendingUp size={14} className="text-positive" />
            <span>Recommended Target</span>
          </div>
          <p className="text-base font-semibold font-mono text-textPrimary">
            {formatCurrency(target_reserve_amount)}
          </p>
          <span className="text-[11px] text-textSecondary">6 months minimum buffer</span>
        </div>
      </div>

      {/* Explanatory Narrative Footer */}
      <div className="p-3 rounded-lg bg-cardElevated border border-border/70 text-xs text-textSecondary flex items-start gap-2.5">
        <ShieldCheck size={16} className="text-positive shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Your current liquid reserve of <strong className="text-textPrimary">{formatCurrency(liquid_balance)}</strong>{' '}
          provides <strong className="text-positive">{months_of_coverage} months</strong> of runway at your current burn rate.{' '}
          {months_of_coverage >= 6
            ? 'Your emergency buffer is in excellent standing, well above the recommended 6-month threshold.'
            : 'Consider routing additional discretionary cash flow into high-yield savings to reach the 6-month target.'}
        </p>
      </div>
    </div>
  );
};
