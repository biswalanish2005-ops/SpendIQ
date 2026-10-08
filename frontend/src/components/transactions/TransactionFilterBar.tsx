import React from 'react';
import { Search, X } from 'lucide-react';
import type { TransactionFilterParams } from '../../api/transactions';

interface TransactionFilterBarProps {
  filters: TransactionFilterParams;
  categories: Array<{ id: string; name: string }>;
  onFilterChange: (newFilters: Partial<TransactionFilterParams>) => void;
  onResetFilters: () => void;
}

export const TransactionFilterBar: React.FC<TransactionFilterBarProps> = ({
  filters,
  categories,
  onFilterChange,
  onResetFilters,
}) => {
  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.direction && filters.direction !== 'ALL') ||
      (filters.category && filters.category !== 'ALL') ||
      filters.sort_by !== 'occurred_at' ||
      filters.sort_order !== 'desc'
  );

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-[#111720] border border-slate-800">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
          placeholder="Search merchant, description, category..."
          className="w-full bg-[#151C25] border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
        {filters.search && (
          <button
            onClick={() => onFilterChange({ search: '', page: 1 })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Direction Segmented Control */}
        <div className="inline-flex rounded-lg p-0.5 bg-[#151C25] border border-slate-800 text-xs">
          {[
            { label: 'All', value: 'ALL' },
            { label: 'Expenses', value: 'EXPENSE' },
            { label: 'Income', value: 'INCOME' },
            { label: 'Invest', value: 'INVESTMENT' },
          ].map((item) => {
            const isActive = (filters.direction || 'ALL') === item.value;
            return (
              <button
                key={item.value}
                onClick={() => onFilterChange({ direction: item.value, page: 1 })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Category Dropdown */}
        <div className="relative">
          <select
            value={filters.category || 'ALL'}
            onChange={(e) => onFilterChange({ category: e.target.value, page: 1 })}
            className="bg-[#151C25] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={`${filters.sort_by || 'occurred_at'}:${filters.sort_order || 'desc'}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split(':');
              onFilterChange({ sort_by: by, sort_order: order as 'asc' | 'desc', page: 1 });
            }}
            className="bg-[#151C25] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
          >
            <option value="occurred_at:desc">Date: Newest</option>
            <option value="occurred_at:asc">Date: Oldest</option>
            <option value="amount:desc">Amount: Highest</option>
            <option value="amount:asc">Amount: Lowest</option>
            <option value="merchant_name:asc">Merchant: A-Z</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
            title="Reset all filters"
          >
            <X className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
