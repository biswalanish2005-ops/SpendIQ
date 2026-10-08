import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Building,
  Loader2,
} from 'lucide-react';
import type { ImportPreviewResponse } from '../../api/imports';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface ImportPreviewTableProps {
  preview: ImportPreviewResponse;
  accounts: Array<{ id: string; name: string }>;
  selectedAccountId: string;
  onAccountSelect: (id: string) => void;
  skipDuplicates: boolean;
  onToggleSkipDuplicates: (skip: boolean) => void;
  onExecute: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const ImportPreviewTable: React.FC<ImportPreviewTableProps> = ({
  preview,
  accounts,
  selectedAccountId,
  onAccountSelect,
  skipDuplicates,
  onToggleSkipDuplicates,
  onExecute,
  onBack,
  isLoading = false,
}) => {
  const willImportCount = skipDuplicates
    ? preview.valid_rows - preview.duplicate_rows
    : preview.valid_rows;

  return (
    <div className="space-y-4">
      {/* Options & Account Link Bar */}
      <div className="p-4 rounded-xl bg-[#111720] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Destination Account */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <Building className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400">Target Account</label>
            <select
              value={selectedAccountId}
              onChange={(e) => onAccountSelect(e.target.value)}
              className="bg-[#151C25] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 mt-0.5"
            >
              <option value="">(No specific account link)</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Deduplication Option */}
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => onToggleSkipDuplicates(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
            />
            <span className="text-xs text-slate-200 font-medium">
              Skip potential duplicate transactions ({preview.duplicate_rows})
            </span>
          </label>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-[#0E141D] border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Rows</div>
          <div className="text-lg font-bold font-mono text-white mt-1">{preview.total_rows}</div>
        </div>
        <div className="p-3 rounded-lg bg-[#0E141D] border border-slate-800">
          <div className="text-[11px] text-slate-400">Valid Rows</div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">{preview.valid_rows}</div>
        </div>
        <div className="p-3 rounded-lg bg-[#0E141D] border border-slate-800">
          <div className="text-[11px] text-slate-400">Duplicates Detected</div>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1">{preview.duplicate_rows}</div>
        </div>
        <div className="p-3 rounded-lg bg-[#0E141D] border border-slate-800">
          <div className="text-[11px] text-slate-400">Will Be Imported</div>
          <div className="text-lg font-bold font-mono text-cyan-400 mt-1">{willImportCount}</div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="rounded-xl border border-slate-800 bg-[#111720] overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#0E141D] border-b border-slate-800 z-10">
              <tr className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Merchant</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Direction</th>
                <th className="py-2.5 px-3">Status / Deduplication</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {preview.preview_rows.map((row) => {
                const isDupe = row.is_duplicate;
                const isError = Boolean(row.validation_error);

                return (
                  <tr
                    key={row.row_index}
                    className={`hover:bg-[#151C25]/80 transition-colors ${
                      isDupe && skipDuplicates ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                      {row.row_index}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-300 whitespace-nowrap">
                      {row.occurred_at ? row.occurred_at.split('T')[0] : '—'}
                    </td>
                    <td className="py-2 px-3 text-slate-200 font-medium">
                      {row.merchant_name}
                    </td>
                    <td className="py-2 px-3 text-slate-400">{row.category_name}</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-200 whitespace-nowrap">
                      {row.amount !== null && row.amount !== undefined
                        ? formatCurrency(Number(row.amount))
                        : '—'}
                    </td>
                    <td className="py-2 px-3">
                      <Badge
                        variant={row.direction === 'INCOME' ? 'positive' : 'negative'}
                        size="sm"
                      >
                        {row.direction}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      {isError ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{row.validation_error}</span>
                        </span>
                      ) : isDupe ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{skipDuplicates ? 'Skipping duplicate' : 'Duplicate detected'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ready</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-[#151C25] hover:bg-[#1E293B] border border-slate-800 text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
        >
          Back to Mapping
        </button>

        <button
          type="button"
          onClick={onExecute}
          disabled={willImportCount === 0 || isLoading}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Import {willImportCount} Transactions</span>
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
