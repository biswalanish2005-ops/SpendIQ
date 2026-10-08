import React from 'react';
import {
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  BrainCircuit,
  PieChart,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import type { AssistantSuggestedPrompt } from '../../api/assistant';

interface AssistantSuggestionsProps {
  suggestions: AssistantSuggestedPrompt[];
  onSelectPrompt: (prompt: string) => void;
  isLoading?: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  TrendingDown: <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />,
  ShieldCheck: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
  AlertTriangle: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
  BrainCircuit: <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />,
  PieChart: <PieChart className="w-3.5 h-3.5 text-blue-400" />,
};

export const AssistantSuggestions: React.FC<AssistantSuggestionsProps> = ({
  suggestions,
  onSelectPrompt,
  isLoading = false,
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-2.5">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>Suggested Inquiries Grounded in Your Telemetry</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((sug) => {
          const icon = ICON_MAP[sug.icon] || <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />;
          return (
            <button
              key={sug.id}
              onClick={() => onSelectPrompt(sug.prompt)}
              disabled={isLoading}
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151C25] hover:bg-[#1E293B] border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-white transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-[0_0_12px_rgba(6,182,212,0.12)]"
            >
              <span className="p-1 rounded bg-slate-900/60 border border-slate-800/80 group-hover:border-cyan-500/30 transition-colors">
                {icon}
              </span>
              <span>{sug.prompt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
