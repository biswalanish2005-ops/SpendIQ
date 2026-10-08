import React from 'react';
import { History, FileText } from 'lucide-react';
import type { ImportJobOut } from '../../api/imports';
import { Badge } from '../ui/Badge';

interface ImportHistoryListProps {
  history: ImportJobOut[];
  isLoading?: boolean;
}

export const ImportHistoryList: React.FC<ImportHistoryListProps> = ({
  history,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border border-slate-800 bg-[#111720] space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 rounded bg-[#151C25] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#111720] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-[#0E141D] text-xs font-semibold text-slate-300">
        <History className="w-3.5 h-3.5 text-cyan-400" />
        <span>Recent Import History & Audit Trail</span>
      </div>

      <div className="divide-y divide-slate-800/60">
        {history.slice(0, 5).map((job) => (
          <div
            key={job.id}
            className="flex items-center justify-between p-3 text-xs hover:bg-[#151C25]/60 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <div>
                <div className="font-medium text-slate-200">{job.filename}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {new Date(job.created_at).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right text-[11px]">
                <span className="font-semibold text-emerald-400 font-mono">
                  +{job.imported_rows}
                </span>{' '}
                <span className="text-slate-400">imported</span>
                {job.duplicate_rows > 0 && (
                  <span className="text-slate-500 text-[10px] block">
                    {job.duplicate_rows} dupes skipped
                  </span>
                )}
              </div>

              <Badge variant={job.status === 'COMPLETED' ? 'positive' : 'warning'} size="sm">
                {job.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
