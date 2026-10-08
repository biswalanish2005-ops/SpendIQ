import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface AssistantInputBarProps {
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const AssistantInputBar: React.FC<AssistantInputBarProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !disabled) {
      inputRef.current?.focus();
    }
  }, [isLoading, disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isLoading || disabled) return;
    onSendMessage(trimmed);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center w-full bg-[#111720]/90 backdrop-blur-md rounded-xl border border-slate-800 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/40 transition-all duration-200 shadow-lg shadow-black/40"
    >
      <div className="pl-4 pr-2 text-cyan-400">
        <Sparkles className="w-4 h-4 opacity-80" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask SpendIQ anything about your spending, runway, forecasts, or anomalies..."
        disabled={isLoading || disabled}
        className="flex-1 bg-transparent py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      />

      <div className="pr-2.5">
        <button
          type="submit"
          disabled={!query.trim() || isLoading || disabled}
          aria-label="Send financial prompt"
          className="flex items-center justify-center p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-cyan-500 shadow-sm hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
};
