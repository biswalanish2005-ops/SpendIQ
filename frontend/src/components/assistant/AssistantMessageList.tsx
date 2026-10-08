import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  User,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  ArrowRight,
  Loader2,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type {
  AssistantMessage,
  AssistantResponseBlock,
  AssistantMetricData,
  AssistantChartData,
  AssistantActionData,
  AssistantRecommendationData,
} from '../../api/assistant';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/utils';

interface AssistantMessageListProps {
  messages: AssistantMessage[];
  isThinking?: boolean;
}

export const AssistantMessageList: React.FC<AssistantMessageListProps> = ({
  messages,
  isThinking = false,
}) => {
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const renderSimpleMarkdown = (text: string) => {
    // Basic markdown helper for paragraphs and bold text
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed text-slate-200">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;
          
          // Handle bullet items
          const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
          const content = isBullet ? line.trim().substring(2) : line;

          // Parse **bold** and *italic*
          const parts = content.split(/(\*\*.*?\*\*|\*.*?\*)/g);
          const renderedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <em key={pIdx} className="italic text-cyan-200">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>{renderedLine}</span>
              </div>
            );
          }

          return <p key={idx}>{renderedLine}</p>;
        })}
      </div>
    );
  };

  const renderMetricBlock = (data: AssistantMetricData, idx: number) => {
    const isImproving = data.status === 'IMPROVING';
    const isConcerning = data.status === 'CONCERNING';
    const isAttention = data.status === 'ATTENTION_REQUIRED';

    const statusBorder = isImproving
      ? 'border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
      : isConcerning
      ? 'border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
      : isAttention
      ? 'border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
      : 'border-slate-800';

    return (
      <div
        key={`metric-${idx}`}
        className={`p-3.5 rounded-xl bg-[#0D131B] border ${statusBorder} flex flex-col gap-2 my-2.5`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-400">{data.label}</span>
          {data.trend && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                data.trend === 'UP'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : data.trend === 'DOWN'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {data.trend === 'UP' && <TrendingUp className="w-3 h-3" />}
              {data.trend === 'DOWN' && <TrendingDown className="w-3 h-3" />}
              {data.trend === 'STABLE' && <Minus className="w-3 h-3" />}
              <span>{data.trend}</span>
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-white">
            {data.value}
          </span>
          {data.status && (
            <Badge
              variant={
                isImproving
                  ? 'positive'
                  : isConcerning
                  ? 'negative'
                  : isAttention
                  ? 'warning'
                  : 'neutral'
              }
              size="sm"
            >
              {data.status.replace('_', ' ')}
            </Badge>
          )}
        </div>

        {data.comparison_label && data.comparison_value && (
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
            <span>{data.comparison_label}:</span>
            <span className="font-mono text-slate-300 font-medium">
              {data.comparison_value}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderChartBlock = (data: AssistantChartData, idx: number) => {
    if (!data.data || data.data.length === 0) return null;

    return (
      <div
        key={`chart-${idx}`}
        className="p-3 rounded-xl bg-[#0D131B] border border-slate-800 my-2.5"
      >
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{data.title}</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
            {data.chart_type}
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {data.chart_type === 'SPENDING_TREND' ? (
              <BarChart data={data.data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="period" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151C25',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F8FAFC',
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Spend']}
                />
                <Bar dataKey="spend" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Actual Spend" />
              </BarChart>
            ) : (
              <LineChart data={data.data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="period" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151C25',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F8FAFC',
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Amount']}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#38BDF8' }}
                  name="Trend"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderRecommendationBlock = (data: AssistantRecommendationData, idx: number) => {
    return (
      <div
        key={`rec-${idx}`}
        className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3 my-2"
      >
        <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-cyan-300 mb-0.5">{data.title}</h4>
          <p className="text-xs text-slate-300 leading-relaxed">{data.text}</p>
        </div>
      </div>
    );
  };

  const renderActionBlock = (data: AssistantActionData, idx: number) => {
    return (
      <div key={`act-${idx}`} className="my-2">
        <button
          onClick={() => navigate(data.route)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151C25] hover:bg-[#1E293B] border border-cyan-500/40 hover:border-cyan-400 text-xs font-medium text-cyan-300 hover:text-cyan-200 transition-all duration-150 shadow-sm hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]"
        >
          <span>{data.label}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  const renderBlock = (block: AssistantResponseBlock, idx: number) => {
    switch (block.block_type) {
      case 'METRIC':
        return renderMetricBlock(block.data as AssistantMetricData, idx);
      case 'CHART':
        return renderChartBlock(block.data as AssistantChartData, idx);
      case 'RECOMMENDATION':
        return renderRecommendationBlock(block.data as AssistantRecommendationData, idx);
      case 'ACTION':
        return renderActionBlock(block.data as AssistantActionData, idx);
      case 'TEXT':
        return block.data?.markdown ? (
          <div key={`text-${idx}`} className="my-1">
            {renderSimpleMarkdown(block.data.markdown)}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      {messages.map((msg) => {
        const isUser = msg.role === 'USER';

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isUser
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              }`}
            >
              {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 transition-all duration-200 ${
                isUser
                  ? 'bg-[#151C25] border border-slate-800 text-slate-100 rounded-tr-sm'
                  : 'bg-[#111720] border border-slate-800 text-slate-200 rounded-tl-sm shadow-md'
              }`}
            >
              {/* Header / Name */}
              <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-slate-800/40">
                <span
                  className={`text-[11px] font-semibold tracking-wide uppercase ${
                    isUser ? 'text-slate-400' : 'text-cyan-400'
                  }`}
                >
                  {isUser ? 'You' : 'SpendIQ Co-Pilot'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Message Content */}
              {isUser ? (
                <p className="text-sm leading-relaxed text-slate-100 whitespace-pre-wrap">
                  {msg.content}
                </p>
              ) : (
                <div className="space-y-1">
                  {/* If no blocks, render raw content */}
                  {(!msg.blocks || msg.blocks.length === 0) && renderSimpleMarkdown(msg.content)}

                  {/* Render typed blocks */}
                  {msg.blocks && msg.blocks.map((block, bIdx) => renderBlock(block, bIdx))}

                  {/* Grounded Evidence Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center flex-wrap gap-1.5 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1 text-emerald-400 font-medium mr-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Grounding:</span>
                      </div>
                      {msg.sources.map((src, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-300"
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Thinking / Streaming Indicator */}
      {isThinking && (
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="bg-[#111720] border border-slate-800 rounded-2xl rounded-tl-sm p-3.5 flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-xs text-slate-400">
              Querying database telemetry & calculating verified statistics...
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
