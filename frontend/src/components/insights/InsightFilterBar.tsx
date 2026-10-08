import React from 'react';
import {
  Sparkles,
  TrendingDown,
  PiggyBank,
  TrendingUp,
  AlertTriangle,
  BrainCircuit,
  HeartPulse,
} from 'lucide-react';

interface InsightFilterBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  selectedActionState: string;
  onSelectActionState: (state: string) => void;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Domains', icon: Sparkles },
  { id: 'SPENDING', label: 'Spending', icon: TrendingDown },
  { id: 'SAVINGS', label: 'Savings', icon: PiggyBank },
  { id: 'INVESTMENTS', label: 'Investments', icon: TrendingUp },
  { id: 'ANOMALIES', label: 'Anomalies', icon: AlertTriangle },
  { id: 'FORECAST', label: 'Forecast', icon: BrainCircuit },
  { id: 'FINANCIAL_HEALTH', label: 'Health', icon: HeartPulse },
];

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All Statuses' },
  { id: 'IMPROVING', label: 'Improving' },
  { id: 'CONCERNING', label: 'Concerning' },
  { id: 'ATTENTION_REQUIRED', label: 'Attention' },
];

export const InsightFilterBar: React.FC<InsightFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  selectedActionState,
  onSelectActionState,
}) => {
  return (
    <div className="space-y-3">
      {/* Category Pills Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-surface/60 p-1.5 rounded-xl border border-border/80">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 inline-flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cardElevated text-textPrimary shadow-sm border border-borderLight'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-card/40'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-ai' : 'text-textMuted'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action State Switcher (Active vs Archived) */}
        <div className="flex items-center gap-1 bg-surface/60 p-1 rounded-lg border border-border/80">
          {[
            { id: 'ACTIVE', label: 'Active' },
            { id: 'ACTED_UPON', label: 'Acted Upon' },
            { id: 'DISMISSED', label: 'Dismissed' },
            { id: 'ALL', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectActionState(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                selectedActionState === tab.id
                  ? 'bg-cardElevated text-textPrimary shadow-sm border border-borderLight'
                  : 'text-textSecondary hover:text-textPrimary hover:bg-card/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Secondary Filter Pills */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-textMuted font-mono text-[11px]">Filter by Status:</span>
        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st.id}
              onClick={() => onSelectStatus(st.id)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                selectedStatus === st.id
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'text-textMuted hover:text-textSecondary hover:bg-surface'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
