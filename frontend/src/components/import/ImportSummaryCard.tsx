import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, BarChart2, Receipt, RotateCcw } from 'lucide-react';
import type { ImportJobOut } from '../../api/imports';

interface ImportSummaryCardProps {
  job: ImportJobOut;
  onReset: () => void;
}

export const ImportSummaryCard: React.FC<ImportSummaryCardProps> = ({ job, onReset }) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111720] p-8 text-center max-w-lg mx-auto space-y-6 animate-fade-in shadow-xl">
      {/* Icon Ring */}
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div>
        <h2 className="text-lg font-bold text-white mb-1">Import Successfully Completed</h2>
        <p className="text-xs text-slate-400">
          Statement <span className="font-mono text-slate-200">"{job.filename}"</span> has been ingested and normalized.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#0E141D] border border-slate-800">
        <div>
          <div className="text-[11px] text-slate-400">Imported</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {job.imported_rows}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Duplicates Skipped</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {job.duplicate_rows}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Total Processed</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {job.total_rows}
          </div>
        </div>
      </div>

      {/* Automatic Analytics Refresh Note */}
      <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-300 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span>Cash flow, spending velocity, ML forecasts & AI co-pilot telemetry updated.</span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={() => navigate('/transactions')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold shadow-md transition-colors"
        >
          <Receipt className="w-4 h-4" />
          <span>View Transactions Ledger</span>
        </button>

        <button
          onClick={() => navigate('/analytics')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#151C25] hover:bg-[#1E293B] border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
        >
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <span>Explore Analytics</span>
        </button>

        <button
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Import Another</span>
        </button>
      </div>
    </div>
  );
};
