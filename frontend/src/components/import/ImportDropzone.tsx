import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, Loader2 } from 'lucide-react';

interface ImportDropzoneProps {
  onFileSelected: (content: string, filename: string) => void;
  isLoading?: boolean;
}

export const ImportDropzone: React.FC<ImportDropzoneProps> = ({
  onFileSelected,
  isLoading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isManualPaste, setIsManualPaste] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const text = await file.text();
    onFileSelected(text, file.name);
  };

  const handleDownloadSample = () => {
    const sample =
      'Date,Merchant,Category,Amount,Direction,Description\n' +
      '2026-09-01,Trader Joe\'s,Groceries,85.40,EXPENSE,Weekly organic groceries\n' +
      '2026-09-02,Starbucks,Dining,6.75,EXPENSE,Morning latte\n' +
      '2026-09-03,Acme Corp,Salary,3500.00,INCOME,Bi-weekly payroll deposit\n' +
      '2026-09-04,Vanguard,Investment,500.00,INVESTMENT,Index fund recurring deposit\n' +
      '2026-09-05,Amazon,Shopping,42.99,EXPENSE,Household essentials\n';

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'spendiq_sample_statement.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;
    onFileSelected(pastedText.trim(), 'pasted_statement.csv');
  };

  return (
    <div className="space-y-4">
      {/* Tab switch between file upload & raw paste */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">Select Input Source</span>
        <div className="inline-flex rounded-lg p-0.5 bg-[#151C25] border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setIsManualPaste(false)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              !isManualPaste
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setIsManualPaste(true)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              isManualPaste
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste CSV Data
          </button>
        </div>
      </div>

      {!isManualPaste ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer text-center ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
              : 'border-slate-800 hover:border-cyan-500/40 bg-[#111720]/80 hover:bg-[#151C25]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Upload className="w-7 h-7" />}
          </div>

          <h3 className="text-sm font-semibold text-white mb-1">
            Drag & drop your bank statement CSV here
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Supports Chase, Bank of America, Wells Fargo, Amex, and any standard CSV statement format.
          </p>

          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-[#19222D] hover:bg-[#202B39] border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm"
          >
            Browse Computer
          </button>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <textarea
            rows={7}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Date,Merchant,Category,Amount,Direction&#10;2026-09-01,Trader Joe's,Groceries,85.40,EXPENSE&#10;2026-09-02,Salary,Income,3500.00,INCOME"
            className="w-full bg-[#111720] border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!pastedText.trim() || isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Parse CSV Text</span>
            </button>
          </div>
        </form>
      )}

      {/* Helper Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#0E141D] border border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Need a reference format?</span>
        </div>
        <button
          type="button"
          onClick={handleDownloadSample}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#151C25] hover:bg-[#1E293B] border border-slate-700 text-cyan-400 hover:text-cyan-300 font-medium transition-colors text-[11px]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Sample CSV</span>
        </button>
      </div>
    </div>
  );
};
