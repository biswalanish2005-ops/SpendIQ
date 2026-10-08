import React from 'react';
import type { AssetAllocationItem } from '../../api/investments';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { PieChart, Landmark, ShieldCheck, Wallet, ArrowUpRight } from 'lucide-react';

interface AssetAllocationCardProps {
  allocations: AssetAllocationItem[];
  totalPortfolioBalance: number;
  isLoading?: boolean;
}

const COLOR_PALETTE = [
  '#3B82F6', // Vanguard / Investment - Blue
  '#10B981', // HYSA - Emerald
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
];

export const AssetAllocationCard: React.FC<AssetAllocationCardProps> = ({
  allocations,
  totalPortfolioBalance,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="h-6 w-40 bg-surface rounded mb-4" />
        <div className="h-20 bg-surface rounded mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-surface rounded" />
          <div className="h-12 bg-surface rounded" />
        </div>
      </div>
    );
  }

  const totalAssets = allocations.reduce((acc, cur) => acc + cur.balance, 0);

  const getAccountIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'INVESTMENT':
        return <Landmark size={16} className="text-primary" />;
      case 'SAVINGS':
        return <ShieldCheck size={16} className="text-positive" />;
      default:
        return <Wallet size={16} className="text-ai" />;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <PieChart size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-textPrimary">Asset Allocation Breakdown</h3>
            <p className="text-xs text-textSecondary">Distribution of capital across active investment &amp; liquid accounts</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-textMuted block">INVESTMENT PORTFOLIO</span>
          <span className="text-lg font-bold font-mono text-positive">
            {formatCurrency(totalPortfolioBalance)}
          </span>
        </div>
      </div>

      {/* Multi-Segment Allocation Visualizer Bar */}
      <div className="w-full bg-surface h-3.5 rounded-full overflow-hidden flex border border-borderLight/60 mb-5 p-0.5">
        {allocations.map((item, idx) => {
          const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
          return (
            <div
              key={item.name}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 hover:brightness-125"
              style={{
                width: `${Math.max(item.percentage, 2)}%`,
                backgroundColor: color,
              }}
              title={`${item.name}: ${item.percentage}% (${formatCurrency(item.balance)})`}
            />
          );
        })}
      </div>

      {/* Account Holdings List */}
      <div className="space-y-2.5">
        {allocations.map((item, idx) => {
          const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
          return (
            <div
              key={item.name}
              className="p-3 rounded-lg bg-surface/40 border border-border/50 hover:bg-surface/70 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="w-7 h-7 rounded-md bg-card border border-border/80 flex items-center justify-center shrink-0">
                  {getAccountIcon(item.account_type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-textPrimary truncate">{item.name}</span>
                    <Badge variant="default" size="sm" className="text-[10px] py-0 px-1.5">
                      {item.institution}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-textMuted capitalize">
                    {item.account_type.toLowerCase()}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-mono text-xs font-bold text-textPrimary">
                  {formatCurrency(item.balance)}
                </div>
                <div className="text-[11px] font-mono text-textSecondary flex items-center justify-end gap-1">
                  <span>{item.percentage}%</span>
                  <ArrowUpRight size={12} className="text-textMuted" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats Footer */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-textSecondary">
        <span>Total Tracked Holdings ({allocations.length} accounts):</span>
        <span className="font-mono font-semibold text-textPrimary">{formatCurrency(totalAssets)}</span>
      </div>
    </div>
  );
};
