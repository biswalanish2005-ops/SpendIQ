import React, { useState } from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ErrorState } from '../components/ui/ErrorState';
import { CategoryDrilldownSection } from '../components/analytics/CategoryDrilldownSection';
import { MerchantRankingTable } from '../components/analytics/MerchantRankingTable';
import { SpendingVelocityChart } from '../components/analytics/SpendingVelocityChart';
import { useGlobalFilter } from '../context/GlobalFilterContext';
import type { DateRangePreset } from '../context/GlobalFilterContext';
import {
  useCategoryBreakdown,
  useTopMerchants,
  useSpendingVelocity,
} from '../api/analytics';
import {
  Layers,
  Store,
  Activity,
  Download,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('categories');
  const { filters, effectiveDates, setDateRange } = useGlobalFilter();

  const daysForVelocity =
    filters.range === '90D' ? 90 : filters.range === '6M' ? 180 : filters.range === '1Y' ? 365 : 30;

  const {
    data: categoryData,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useCategoryBreakdown(effectiveDates.startDate, effectiveDates.endDate, filters.accountId);

  const {
    data: merchantsData,
    isLoading: isMerchantsLoading,
    isError: isMerchantsError,
    refetch: refetchMerchants,
  } = useTopMerchants(
    20,
    effectiveDates.startDate,
    effectiveDates.endDate,
    filters.accountId,
    filters.category
  );

  const {
    data: velocityData,
    isLoading: isVelocityLoading,
    isError: isVelocityError,
    refetch: refetchVelocity,
  } = useSpendingVelocity(daysForVelocity, filters.accountId);

  const handleRetryAll = () => {
    refetchCategories();
    refetchMerchants();
    refetchVelocity();
  };

  if (isCategoriesError || isMerchantsError || isVelocityError) {
    return (
      <div className="py-12">
        <ErrorState
          title="Failed to Load Analytics Workspace"
          message="Could not retrieve analytical datasets from the server. Check your connection or retry."
          onRetry={handleRetryAll}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Workspace Header */}
      <SectionHeader
        title="Analytics Workspace"
        subtitle="Multi-dimensional category drill-downs, merchant concentration, and daily spending velocity."
        badge={
          <Badge variant="outline" size="sm">
            Deep-Dive Environment
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-surface border border-border">
              {(['30D', '90D', '6M', 'YTD'] as DateRangePreset[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    filters.range === range
                      ? 'bg-cardElevated text-textPrimary shadow-sm'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={13} />}
            >
              Export
            </Button>
          </div>
        }
      />

      {/* Analytics Area Navigation Tabs */}
      <div className="border-b border-border pb-3">
        <Tabs
          tabs={[
            {
              id: 'categories',
              label: 'Category Drilldown',
              icon: <Layers size={14} />,
            },
            {
              id: 'merchants',
              label: 'Merchant Intelligence',
              icon: <Store size={14} />,
            },
            {
              id: 'velocity',
              label: 'Spending Velocity',
              icon: <Activity size={14} />,
            },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="underline"
        />
      </div>

      {/* Tab Panels */}
      {activeTab === 'categories' && (
        <CategoryDrilldownSection
          data={categoryData}
          isLoading={isCategoriesLoading}
        />
      )}

      {activeTab === 'merchants' && (
        <MerchantRankingTable
          merchants={merchantsData}
          isLoading={isMerchantsLoading}
        />
      )}

      {activeTab === 'velocity' && (
        <SpendingVelocityChart
          velocityData={velocityData}
          isLoading={isVelocityLoading}
        />
      )}
    </div>
  );
};
