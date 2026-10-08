import React, { useState } from 'react';
import type { MerchantAggregate } from '../../api/analytics';
import { formatCurrency } from '../../lib/utils';
import { Skeleton } from '../ui/Skeleton';
import { Store, Search } from 'lucide-react';

interface MerchantRankingTableProps {
  merchants?: MerchantAggregate[];
  isLoading?: boolean;
}

export const MerchantRankingTable: React.FC<MerchantRankingTableProps> = ({
  merchants,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading || !merchants) {
    return (
      <div className="p-5 rounded-xl border border-border bg-card shadow-card space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  const filteredMerchants = merchants.filter((m) =>
    m.merchant_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-5 rounded-xl border border-border bg-card shadow-card space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-surface border border-border text-textSecondary">
            <Store size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-textPrimary">
              Merchant Concentration
            </h3>
            <p className="text-[11px] text-textMuted">
              Ranked by total historical and current expenditure
            </p>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input
            type="text"
            placeholder="Search merchants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-textMuted font-medium uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Rank</th>
              <th className="py-2.5 px-3">Merchant</th>
              <th className="py-2.5 px-3 text-right">Total Spent</th>
              <th className="py-2.5 px-3 text-right">Visits</th>
              <th className="py-2.5 px-3 text-right">Avg Ticket</th>
              <th className="py-2.5 px-3 text-right">Wallet Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredMerchants.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-textMuted">
                  No merchants match "{searchTerm}"
                </td>
              </tr>
            ) : (
              filteredMerchants.map((m, index) => {
                const amount = Number(m.amount);
                const avgTicket = Number(m.average_ticket);
                const pct = Number(m.percentage);

                return (
                  <tr
                    key={m.merchant_name}
                    className="hover:bg-surface/30 transition-colors group"
                  >
                    <td className="py-3 px-3 font-mono text-textMuted font-semibold">
                      #{index + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-textPrimary group-hover:text-primary transition-colors">
                        {m.merchant_name}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-textPrimary">
                      {formatCurrency(amount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-textSecondary">
                      {m.transaction_count}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-textSecondary">
                      {formatCurrency(avgTicket)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-textPrimary font-medium w-10">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
