import React, { useState } from 'react';
import { Sparkles, ShieldCheck, RotateCcw, Database } from 'lucide-react';
import type { AssistantMessage } from '../api/assistant';
import {
  useAssistantSuggestions,
  useSendAssistantMessage,
} from '../api/assistant';
import { AssistantSuggestions } from '../components/assistant/AssistantSuggestions';
import { AssistantMessageList } from '../components/assistant/AssistantMessageList';
import { AssistantInputBar } from '../components/assistant/AssistantInputBar';
import { Badge } from '../components/ui/Badge';

const INITIAL_GREETING: AssistantMessage = {
  id: 'greeting_001',
  role: 'ASSISTANT',
  content:
    'Hello! I am your **SpendIQ Grounded Financial Co-Pilot**.\n\n' +
    'Unlike generic AI chatbots, I do **not** hallucinate financial metrics. Every answer, trend, and recommendation I generate is computed on-demand directly from your **verified database transactions, accounts, Holt-Winters predictive models, and anomaly detectors**.\n\n' +
    'Choose one of the inquiry suggestions below, or type any specific question about your expenses, runway, savings cadence, or detected anomalies.',
  blocks: [
    {
      block_type: 'RECOMMENDATION',
      data: {
        title: 'Zero-Hallucination Grounding Standard',
        text: 'Every quantitative figure cited in responses contains direct citations to internal analytical subsystems (e.g. CashFlowAnalytics, SavingsAnalytics, AnomalyService).',
      },
    },
  ],
  sources: ['SpendIQ.AnalyticsEngine', 'DeterministicDataGrounding'],
  created_at: new Date().toISOString(),
};

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<AssistantMessage[]>([INITIAL_GREETING]);
  const { data: suggestions = [], isLoading: isSuggestionsLoading } = useAssistantSuggestions();
  const sendMutation = useSendAssistantMessage();

  const handleSendMessage = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || sendMutation.isPending) return;

    // 1. Add User Message
    const userMessage: AssistantMessage = {
      id: `user_${Date.now()}`,
      role: 'USER',
      content: trimmed,
      blocks: [],
      sources: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // 2. Query Backend Assistant
    try {
      const assistantReply = await sendMutation.mutateAsync({ query: trimmed });
      setMessages((prev) => [...prev, assistantReply]);
    } catch (err: any) {
      const errorMessage: AssistantMessage = {
        id: `err_${Date.now()}`,
        role: 'ASSISTANT',
        content:
          '**Sorry, I encountered an issue querying your financial telemetry.**\n\n' +
          (err?.message || 'Please check your connection and try again.'),
        blocks: [],
        sources: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        ...INITIAL_GREETING,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] max-w-5xl mx-auto space-y-4">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Grounded AI Financial Assistant
              </h1>
              <Badge variant="ai" size="sm" className="hidden sm:inline-flex">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                <span>Zero Hallucination</span>
              </Badge>
              <Badge variant="positive" size="sm" className="hidden md:inline-flex">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Live Telemetry</span>
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Interactive financial co-pilot synthesising cash flow, forecasting, runway, and anomalies
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleResetChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151C25] hover:bg-[#1E293B] border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset conversation session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Suggested Inquiries Bar */}
      <div className="shrink-0">
        <AssistantSuggestions
          suggestions={suggestions}
          onSelectPrompt={handleSendMessage}
          isLoading={sendMutation.isPending || isSuggestionsLoading}
        />
      </div>

      {/* Message History Window */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 rounded-xl bg-[#0B0F14]/60 border border-slate-800/40 p-4 min-h-0 shadow-inner">
        <AssistantMessageList
          messages={messages}
          isThinking={sendMutation.isPending}
        />
      </div>

      {/* Input Bar & Grounding Notice */}
      <div className="shrink-0 space-y-2 pt-1">
        <AssistantInputBar
          onSendMessage={handleSendMessage}
          isLoading={sendMutation.isPending}
        />
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>All responses grounded in verified SQL transactions and ML models</span>
          </div>
          <span className="hidden sm:inline-block">Press Enter to send</span>
        </div>
      </div>
    </div>
  );
};
