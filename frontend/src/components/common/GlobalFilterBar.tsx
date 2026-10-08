import React, { useState } from 'react';
import {
  Calendar,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  X,
} from 'lucide-react';
import { useGlobalFilter } from '../../context/GlobalFilterContext';
import type { DateRangePreset, DirectionFilter } from '../../context/GlobalFilterContext';
import { useAccounts, useCategories } from '../../api/transactions';
import { Dropdown } from '../ui/Dropdown';
import { cn } from '../../lib/utils';

interface GlobalFilterBarProps {
  className?: string;
  isCompact?: boolean;
}

const DATE_RANGE_OPTIONS: { label: string; value: DateRangePreset }[] = [
  { label: 'Last 30 Days', value: '30D' },
  { label: 'Last 90 Days', value: '90D' },
  { label: 'Last 6 Months', value: '6M' },
  { label: 'Year to Date', value: 'YTD' },
  { label: 'Last 1 Year', value: '1Y' },
  { label: 'All History', value: 'ALL' },
  { label: 'Custom Range...', value: 'CUSTOM' },
];

const DIRECTION_OPTIONS: { label: string; value: DirectionFilter }[] = [
  { label: 'All Cash Flows', value: 'ALL' },
  { label: 'Expenses Only', value: 'EXPENSE' },
  { label: 'Income Only', value: 'INCOME' },
  { label: 'Investments Only', value: 'INVESTMENT' },
];

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  className,
  isCompact = false,
}) => {
  const {
    filters,
    activeFilterCount,
    setDateRange,
    setAccountId,
    setCategory,
    setDirection,
    resetFilters,
  } = useGlobalFilter();

  const { data: accounts = [], isLoading: isAccountsLoading } = useAccounts();
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();

  const [isCustomDateOpen, setIsCustomDateOpen] = useState(filters.range === 'CUSTOM');
  const [customStart, setCustomStart] = useState(filters.startDate || '');
  const [customEnd, setCustomEnd] = useState(filters.endDate || '');
  const [isExpandedMobile, setIsExpandedMobile] = useState(false);

  // Account dropdown options
  const accountOptions = [
    { label: 'All Accounts', value: 'ALL' },
    ...accounts.map((acc) => ({
      label: `${acc.name} (${acc.type.toLowerCase()})`,
      value: acc.id,
    })),
  ];

  // Category dropdown options
  const categoryOptions = [
    { label: 'All Categories', value: 'ALL' },
    ...categories
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((cat) => ({
        label: cat.name,
        value: cat.name,
      })),
  ];

  const handleRangeChange = (val: DateRangePreset) => {
    if (val === 'CUSTOM') {
      setIsCustomDateOpen(true);
      setDateRange('CUSTOM', customStart, customEnd);
    } else {
      setIsCustomDateOpen(false);
      setDateRange(val);
    }
  };

  const handleApplyCustomDates = () => {
    if (customStart && customEnd) {
      setDateRange('CUSTOM', customStart, customEnd);
    }
  };

  return (
    <div className={cn('relative flex flex-col', className)}>
      {/* Primary Bar Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Mobile Toggle Trigger */}
        <button
          onClick={() => setIsExpandedMobile(!isExpandedMobile)}
          className="flex md:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-textSecondary hover:text-textPrimary"
        >
          <Filter size={14} className={activeFilterCount > 0 ? 'text-ai' : 'text-textMuted'} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-ai text-background font-bold text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            size={12}
            className={cn('transition-transform duration-200', isExpandedMobile && 'rotate-180')}
          />
        </button>

        {/* Desktop / Expanded Filter Controls */}
        <div
          className={cn(
            'items-center gap-2',
            isExpandedMobile ? 'flex flex-wrap w-full mt-2 pt-2 border-t border-border' : 'hidden md:flex'
          )}
        >
          {/* Date Range Selector */}
          <div className="flex items-center">
            <Dropdown
              options={DATE_RANGE_OPTIONS}
              value={filters.range}
              onChange={handleRangeChange}
              placeholder="Select Range"
              className="min-w-[130px]"
            />
          </div>

          {/* Account Filter */}
          <div className="flex items-center">
            <Dropdown
              options={accountOptions}
              value={filters.accountId}
              onChange={setAccountId}
              placeholder={isAccountsLoading ? 'Loading...' : 'Account'}
              className="min-w-[140px] max-w-[190px]"
            />
          </div>

          {/* Category Filter */}
          {!isCompact && (
            <div className="flex items-center">
              <Dropdown
                options={categoryOptions}
                value={filters.category}
                onChange={setCategory}
                placeholder={isCategoriesLoading ? 'Loading...' : 'Category'}
                className="min-w-[130px] max-w-[180px]"
              />
            </div>
          )}

          {/* Direction Filter (when non-compact) */}
          {!isCompact && (
            <div className="hidden lg:flex items-center">
              <Dropdown
                options={DIRECTION_OPTIONS}
                value={filters.direction}
                onChange={setDirection}
                placeholder="Flow Type"
                className="min-w-[130px]"
              />
            </div>
          )}

          {/* Active Filter Count & Reset Button */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-ai/10 border border-ai/30 text-ai text-[11px] font-medium">
                <SlidersHorizontal size={11} />
                <span>{activeFilterCount} active</span>
              </span>
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-textMuted hover:text-negative hover:bg-negative/10 border border-transparent hover:border-negative/20 transition-colors"
                title="Reset all filters to defaults"
              >
                <RotateCcw size={11} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom Date Pickers Drawer */}
      {isCustomDateOpen && filters.range === 'CUSTOM' && (
        <div className="mt-2 p-2.5 rounded-lg border border-border bg-cardElevated/90 backdrop-blur-md flex flex-wrap items-center gap-2 animate-in fade-in duration-150 z-30">
          <span className="text-[11px] font-medium text-textMuted flex items-center gap-1">
            <Calendar size={12} className="text-ai" /> Custom Range:
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 text-xs rounded bg-surface border border-border text-textPrimary focus:outline-none focus:border-ai"
              placeholder="Start Date"
            />
            <span className="text-textMuted text-xs">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 text-xs rounded bg-surface border border-border text-textPrimary focus:outline-none focus:border-ai"
              placeholder="End Date"
            />
            <button
              onClick={handleApplyCustomDates}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-ai text-background hover:bg-ai/90 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setIsCustomDateOpen(false);
                setDateRange('30D');
              }}
              className="p-1 text-textMuted hover:text-textPrimary rounded"
              title="Cancel custom range"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
