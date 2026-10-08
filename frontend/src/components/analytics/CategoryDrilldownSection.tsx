import React, { useState } from 'react';
import type { CategoryBreakdownResponse } from '../../api/analytics';
import { ChartContainer } from '../charts/ChartContainer';
import { ChartTooltip } from '../charts/ChartTooltip';
import { CHART_THEME } from '../charts/chartTheme';
import { Badge } from '../ui/Badge';
import { Tabs } from '../ui/Tabs';
import { formatCurrency } from '../../lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Layers, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface CategoryDrilldownSectionProps {
  data?: CategoryBreakdownResponse;
  isLoading?: boolean;
}

export const CategoryDrilldownSection: React.FC<CategoryDrilldownSectionProps> = ({
  data,
  isLoading = false,
}) => {
  const [filterGroup, setFilterGroup] = useState<string>('all');

  const categories = data?.categories || [];
  const filteredCategories = categories.filter((c) => {
    if (filterGroup === 'fixed') return c.group === 'Fixed';
    if (filterGroup === 'discretionary') return c.group === 'Discretionary';
    return true;
  });

  const chartData = filteredCategories.map((c) => ({
    name: c.category_name,
    amount: Number(c.amount),
    percentage: Number(c.percentage),
  }));

  const fixedAmt = data ? Number(data.fixed_amount) : 0;
  const discAmt = data ? Number(data.discretionary_amount) : 0;
  const discRatio = data ? Number(data.discretionary_ratio) : 0;

  return (
    <div className="space-y-6">
      {/* Category Distribution Chart */}
      <ChartContainer
        title="Category Spend Comparison"
        subtitle="Distribution of expenditures across standardized spending categories."
        badge={
          <Badge variant="outline" size="sm">
            {categories.length} Categories Active
          </Badge>
        }
        actions={
          <Tabs
            tabs={[
              { id: 'all', label: 'All Groups' },
              { id: 'fixed', label: 'Fixed Only' },
              { id: 'discretionary', label: 'Discretionary' },
            ]}
            activeTab={filterGroup}
            onChange={setFilterGroup}
          />
        }
        height={300}
        isLoading={isLoading}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid
              stroke={CHART_THEME.colors.grid}
              strokeDasharray={CHART_THEME.grid.strokeDasharray}
              horizontal={false}
            />
            <XAxis
              type="number"
              stroke={CHART_THEME.colors.axis}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#26313D' }}
              tickFormatter={(val) => `$${val}`}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke={CHART_THEME.colors.axis}
              tick={{ fill: '#F1F5F9', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<ChartTooltip formatter={(val) => formatCurrency(val)} />}
            />
            <Bar
              dataKey="amount"
              name="Expenditure"
              fill="#3B82F6"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Two KPI cards for Fixed vs Discretionary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card shadow-card flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-textSecondary uppercase tracking-wider font-semibold mb-1">
              <CheckCircle2 size={15} className="text-primary" />
              <span>Essential / Fixed Commitments</span>
            </div>
            <div className="text-2xl font-mono font-bold text-textPrimary">
              {formatCurrency(fixedAmt)}
            </div>
            <p className="text-xs text-textMuted mt-1">
              Mandatory housing, utilities, groceries, and debt servicing.
            </p>
          </div>
          <Badge variant="neutral" size="md">
            {(100 - discRatio).toFixed(1)}% of Spend
          </Badge>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card shadow-card flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-textSecondary uppercase tracking-wider font-semibold mb-1">
              <ShieldAlert size={15} className="text-ai" />
              <span>Discretionary Expenditures</span>
            </div>
            <div className="text-2xl font-mono font-bold text-ai">
              {formatCurrency(discAmt)}
            </div>
            <p className="text-xs text-textMuted mt-1">
              Flexible dining, shopping, entertainment, and personal leisure.
            </p>
          </div>
          <Badge variant="ai" size="md">
            {discRatio.toFixed(1)}% of Spend
          </Badge>
        </div>
      </div>

      {/* Detailed Categories Table */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-surface border border-border text-textSecondary">
            <Layers size={16} />
          </div>
          <h3 className="text-sm font-semibold text-textPrimary">
            Category Breakdown Matrix
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-textMuted font-medium uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3 text-right">Total Amount</th>
                <th className="py-2.5 px-3 text-right">Transactions</th>
                <th className="py-2.5 px-3 text-right">Avg / Trans</th>
                <th className="py-2.5 px-3 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredCategories.map((cat) => {
                const amt = Number(cat.amount);
                const count = cat.transaction_count;
                const avgTicket = count > 0 ? amt / count : 0;
                const pct = Number(cat.percentage);

                return (
                  <tr key={cat.category_name} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-textPrimary">
                      {cat.category_name}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={cat.group === 'Fixed' ? 'neutral' : 'ai'} size="sm">
                        {cat.group}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-textPrimary">
                      {formatCurrency(amt)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-textSecondary">
                      {count}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-textSecondary">
                      {formatCurrency(avgTicket)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-textPrimary">
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
