import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import type { ImportPreviewResponse, ImportJobOut } from '../api/imports';
import {
  useImportPreviewRaw,
  useExecuteImport,
  useImportHistory,
} from '../api/imports';
import { useAccounts } from '../api/transactions';
import { ImportDropzone } from '../components/import/ImportDropzone';
import { ImportMappingStep } from '../components/import/ImportMappingStep';
import { ImportPreviewTable } from '../components/import/ImportPreviewTable';
import { ImportSummaryCard } from '../components/import/ImportSummaryCard';
import { ImportHistoryList } from '../components/import/ImportHistoryList';

export const ImportPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [filename, setFilename] = useState('statement.csv');
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [completedJob, setCompletedJob] = useState<ImportJobOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewMutation = useImportPreviewRaw();
  const executeMutation = useExecuteImport();
  const { data: accounts = [] } = useAccounts();
  const { data: history = [], isLoading: isHistoryLoading } = useImportHistory();

  const handleFileSelected = async (content: string, name: string) => {
    setFilename(name);
    setError(null);

    try {
      const res = await previewMutation.mutateAsync({
        csv_text: content,
        filename: name,
      });
      setPreviewData(res);
      setMappings(res.suggested_mappings);
      setStep(2);
    } catch (err: any) {
      setError(err?.message || 'Failed to parse statement content.');
    }
  };

  const handleMappingChange = (header: string, field: string) => {
    setMappings((prev) => ({
      ...prev,
      [header]: field,
    }));
  };

  const handleProceedToPreview = () => {
    setStep(3);
  };

  const handleExecuteImport = async () => {
    if (!previewData) return;
    setError(null);

    try {
      // Map preview rows into execute rows
      const executeRows = previewData.preview_rows
        .filter((r) => !r.validation_error && r.amount !== null && r.amount !== undefined)
        .map((r) => ({
          occurred_at: r.occurred_at || new Date().toISOString(),
          amount: Number(r.amount),
          currency: r.currency || 'USD',
          direction: r.direction,
          category_name: r.category_name,
          merchant_name: r.merchant_name,
          description: r.description || '',
          is_duplicate: r.is_duplicate,
        }));

      const job = await executeMutation.mutateAsync({
        filename,
        account_id: selectedAccountId || null,
        skip_duplicates: skipDuplicates,
        rows: executeRows,
      });

      setCompletedJob(job);
      setStep(4);
    } catch (err: any) {
      setError(err?.message || 'Import execution failed. Please retry.');
    }
  };

  const handleReset = () => {
    setStep(1);
    setFilename('statement.csv');
    setPreviewData(null);
    setMappings({});
    setCompletedJob(null);
    setError(null);
  };

  const STEPS = [
    { num: 1, label: 'Upload' },
    { num: 2, label: 'Map Columns' },
    { num: 3, label: 'Review & Deduplicate' },
    { num: 4, label: 'Confirmation' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Import Statement</h1>
            <p className="text-xs text-slate-400">
              Ingest bank & credit card CSV statements with automated duplicate detection
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/transactions')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151C25] hover:bg-[#1E293B] border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ledger</span>
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between max-w-xl mx-auto py-2">
        {STEPS.map((s, idx) => {
          const isCurrent = step === s.num;
          const isDone = step > s.num;

          return (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isCurrent
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:inline ${
                    isCurrent ? 'text-white' : isDone ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    step > idx + 1 ? 'bg-emerald-500/40' : 'bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="rounded-2xl border border-slate-800 bg-[#111720]/60 p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-6">
            <ImportDropzone
              onFileSelected={handleFileSelected}
              isLoading={previewMutation.isPending}
            />
            <ImportHistoryList history={history} isLoading={isHistoryLoading} />
          </div>
        )}

        {step === 2 && previewData && (
          <ImportMappingStep
            headers={previewData.headers}
            mappings={mappings}
            onMappingChange={handleMappingChange}
            onProceed={handleProceedToPreview}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && previewData && (
          <ImportPreviewTable
            preview={previewData}
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onAccountSelect={setSelectedAccountId}
            skipDuplicates={skipDuplicates}
            onToggleSkipDuplicates={setSkipDuplicates}
            onExecute={handleExecuteImport}
            onBack={() => setStep(2)}
            isLoading={executeMutation.isPending}
          />
        )}

        {step === 4 && completedJob && (
          <ImportSummaryCard job={completedJob} onReset={handleReset} />
        )}
      </div>
    </div>
  );
};
