import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export type DateRangePreset = '30D' | '90D' | '6M' | 'YTD' | '1Y' | 'ALL' | 'CUSTOM';
export type DirectionFilter = 'ALL' | 'INCOME' | 'EXPENSE' | 'INVESTMENT';
export type AggregationPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface GlobalFilterState {
  range: DateRangePreset;
  startDate?: string;
  endDate?: string;
  accountId: string; // 'ALL' or specific account UUID
  category: string;  // 'ALL' or specific category
  direction: DirectionFilter;
  aggregation: AggregationPeriod;
}

export interface EffectiveDateRange {
  startDate?: string;
  endDate?: string;
  label: string;
}

export interface GlobalFilterContextValue {
  filters: GlobalFilterState;
  effectiveDates: EffectiveDateRange;
  activeFilterCount: number;
  setDateRange: (range: DateRangePreset, customStart?: string, customEnd?: string) => void;
  setAccountId: (accountId: string) => void;
  setCategory: (category: string) => void;
  setDirection: (direction: DirectionFilter) => void;
  setAggregation: (agg: AggregationPeriod) => void;
  resetFilters: () => void;
}

export const DEFAULT_FILTERS: GlobalFilterState = {
  range: '30D',
  startDate: undefined,
  endDate: undefined,
  accountId: 'ALL',
  category: 'ALL',
  direction: 'ALL',
  aggregation: 'DAILY',
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeEffectiveDates(
  range: DateRangePreset,
  customStart?: string,
  customEnd?: string
): EffectiveDateRange {
  const now = new Date();
  const todayStr = formatDate(now);

  switch (range) {
    case '30D': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { startDate: formatDate(d), endDate: todayStr, label: 'Last 30 Days' };
    }
    case '90D': {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return { startDate: formatDate(d), endDate: todayStr, label: 'Last 90 Days' };
    }
    case '6M': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      return { startDate: formatDate(d), endDate: todayStr, label: 'Last 6 Months' };
    }
    case 'YTD': {
      const d = new Date(now.getFullYear(), 0, 1);
      return { startDate: formatDate(d), endDate: todayStr, label: 'Year to Date' };
    }
    case '1Y': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return { startDate: formatDate(d), endDate: todayStr, label: 'Last 1 Year' };
    }
    case 'CUSTOM': {
      return {
        startDate: customStart,
        endDate: customEnd || todayStr,
        label: customStart && customEnd ? `${customStart} → ${customEnd}` : 'Custom Range',
      };
    }
    case 'ALL':
    default:
      return { startDate: undefined, endDate: undefined, label: 'All History' };
  }
}

const GlobalFilterContext = createContext<GlobalFilterContextValue | undefined>(undefined);

export const GlobalFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read current filters from URL search params with fallbacks to defaults
  const filters: GlobalFilterState = useMemo(() => {
    const rawRange = searchParams.get('range') as DateRangePreset | null;
    const validRanges: DateRangePreset[] = ['30D', '90D', '6M', 'YTD', '1Y', 'ALL', 'CUSTOM'];
    const range: DateRangePreset = rawRange && validRanges.includes(rawRange) ? rawRange : '30D';

    const rawDir = searchParams.get('dir') as DirectionFilter | null;
    const validDirs: DirectionFilter[] = ['ALL', 'INCOME', 'EXPENSE', 'INVESTMENT'];
    const direction: DirectionFilter = rawDir && validDirs.includes(rawDir) ? rawDir : 'ALL';

    const rawAgg = searchParams.get('agg') as AggregationPeriod | null;
    const validAggs: AggregationPeriod[] = ['DAILY', 'WEEKLY', 'MONTHLY'];
    const aggregation: AggregationPeriod = rawAgg && validAggs.includes(rawAgg) ? rawAgg : 'DAILY';

    const accountId = searchParams.get('account') || 'ALL';
    const category = searchParams.get('cat') || 'ALL';
    const startDate = searchParams.get('start') || undefined;
    const endDate = searchParams.get('end') || undefined;

    return {
      range,
      startDate,
      endDate,
      accountId,
      category,
      direction,
      aggregation,
    };
  }, [searchParams]);

  // Update URL search parameters whenever filter mutators are called
  const updateUrlParams = useCallback(
    (newPartial: Partial<GlobalFilterState>) => {
      setSearchParams(
        (prev) => {
          const nextParams = new URLSearchParams(prev);
          const merged: GlobalFilterState = {
            ...filters,
            ...newPartial,
          };

          // Range
          if (merged.range && merged.range !== '30D') {
            nextParams.set('range', merged.range);
          } else {
            nextParams.delete('range');
          }

          // Custom start / end dates
          if (merged.range === 'CUSTOM' && merged.startDate) {
            nextParams.set('start', merged.startDate);
          } else {
            nextParams.delete('start');
          }
          if (merged.range === 'CUSTOM' && merged.endDate) {
            nextParams.set('end', merged.endDate);
          } else {
            nextParams.delete('end');
          }

          // Account
          if (merged.accountId && merged.accountId !== 'ALL') {
            nextParams.set('account', merged.accountId);
          } else {
            nextParams.delete('account');
          }

          // Category
          if (merged.category && merged.category !== 'ALL') {
            nextParams.set('cat', merged.category);
          } else {
            nextParams.delete('cat');
          }

          // Direction
          if (merged.direction && merged.direction !== 'ALL') {
            nextParams.set('dir', merged.direction);
          } else {
            nextParams.delete('dir');
          }

          // Aggregation
          if (merged.aggregation && merged.aggregation !== 'DAILY') {
            nextParams.set('agg', merged.aggregation);
          } else {
            nextParams.delete('agg');
          }

          return nextParams;
        },
        { replace: true }
      );
    },
    [filters, setSearchParams]
  );

  const setDateRange = useCallback(
    (range: DateRangePreset, customStart?: string, customEnd?: string) => {
      updateUrlParams({
        range,
        startDate: range === 'CUSTOM' ? customStart : undefined,
        endDate: range === 'CUSTOM' ? customEnd : undefined,
      });
    },
    [updateUrlParams]
  );

  const setAccountId = useCallback(
    (accountId: string) => {
      updateUrlParams({ accountId });
    },
    [updateUrlParams]
  );

  const setCategory = useCallback(
    (category: string) => {
      updateUrlParams({ category });
    },
    [updateUrlParams]
  );

  const setDirection = useCallback(
    (direction: DirectionFilter) => {
      updateUrlParams({ direction });
    },
    [updateUrlParams]
  );

  const setAggregation = useCallback(
    (aggregation: AggregationPeriod) => {
      updateUrlParams({ aggregation });
    },
    [updateUrlParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev);
        nextParams.delete('range');
        nextParams.delete('start');
        nextParams.delete('end');
        nextParams.delete('account');
        nextParams.delete('cat');
        nextParams.delete('dir');
        nextParams.delete('agg');
        return nextParams;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  // Compute effective date bounds
  const effectiveDates = useMemo(() => {
    return computeEffectiveDates(filters.range, filters.startDate, filters.endDate);
  }, [filters.range, filters.startDate, filters.endDate]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.range !== '30D') count++;
    if (filters.accountId !== 'ALL') count++;
    if (filters.category !== 'ALL') count++;
    if (filters.direction !== 'ALL') count++;
    if (filters.aggregation !== 'DAILY') count++;
    return count;
  }, [filters]);

  const value = useMemo<GlobalFilterContextValue>(
    () => ({
      filters,
      effectiveDates,
      activeFilterCount,
      setDateRange,
      setAccountId,
      setCategory,
      setDirection,
      setAggregation,
      resetFilters,
    }),
    [
      filters,
      effectiveDates,
      activeFilterCount,
      setDateRange,
      setAccountId,
      setCategory,
      setDirection,
      setAggregation,
      resetFilters,
    ]
  );

  return <GlobalFilterContext.Provider value={value}>{children}</GlobalFilterContext.Provider>;
};

export function useGlobalFilter(): GlobalFilterContextValue {
  const context = useContext(GlobalFilterContext);
  if (!context) {
    throw new Error('useGlobalFilter must be used within a GlobalFilterProvider');
  }
  return context;
}
