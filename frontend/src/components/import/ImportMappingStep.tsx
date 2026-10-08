import React from 'react';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface ImportMappingStepProps {
  headers: string[];
  mappings: Record<string, string>;
  onMappingChange: (header: string, field: string) => void;
  onProceed: () => void;
  onBack: () => void;
}

const SPENDIQ_FIELDS: Array<{ id: string; label: string; required: boolean }> = [
  { id: 'occurred_at', label: 'Date (Occurred At)', required: true },
  { id: 'amount', label: 'Monetary Amount', required: true },
  { id: 'merchant_name', label: 'Merchant / Payee Name', required: true },
  { id: 'category_name', label: 'Category', required: false },
  { id: 'direction', label: 'Direction (Income / Expense)', required: false },
  { id: 'description', label: 'Description / Memo', required: false },
  { id: 'ignore', label: '(Ignore Column)', required: false },
];

export const ImportMappingStep: React.FC<ImportMappingStepProps> = ({
  headers,
  mappings,
  onMappingChange,
  onProceed,
  onBack,
}) => {
  const hasDate = Object.values(mappings).includes('occurred_at');
  const hasAmount = Object.values(mappings).includes('amount');
  const hasMerchant = Object.values(mappings).includes('merchant_name');
  const canProceed = hasDate && hasAmount && hasMerchant;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Map CSV Headers to SpendIQ Attributes</h3>
          <p className="text-xs text-slate-400">
            Confirm or adjust automatic column mapping heuristics for statement normalization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={canProceed ? 'positive' : 'warning'} size="sm">
            {canProceed ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>All Required Mapped</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>Requires Date, Amount & Merchant</span>
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Mapping Table */}
      <div className="rounded-xl border border-slate-800 bg-[#111720] overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-[#0E141D] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">CSV Column Header</th>
              <th className="py-3 px-4">Mapped SpendIQ Field</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {headers.map((h) => {
              const mapped = mappings[h] || 'ignore';
              const isRequiredField = ['occurred_at', 'amount', 'merchant_name'].includes(mapped);

              return (
                <tr key={h} className="hover:bg-[#151C25]/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-200">
                    "{h}"
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={mapped}
                      onChange={(e) => onMappingChange(h, e.target.value)}
                      className="bg-[#151C25] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 w-full max-w-xs"
                    >
                      {SPENDIQ_FIELDS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label} {f.required ? '*' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {mapped !== 'ignore' ? (
                      <Badge variant={isRequiredField ? 'ai' : 'default'} size="sm">
                        {isRequiredField ? 'Primary' : 'Mapped'}
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-slate-500">Ignored</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-[#151C25] hover:bg-[#1E293B] border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
        >
          Back
        </button>

        <button
          type="button"
          disabled={!canProceed}
          onClick={onProceed}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold shadow-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Review Preview & Duplicates</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
