import React from 'react';
import { Sparkles, CheckCircle2, Heart, Tag, RefreshCw, Copy, Check } from 'lucide-react';
import type { JournalInsight } from '../types';

interface SummaryCardProps {
  summary: string;
  insights?: JournalInsight;
  tags?: string[];
  isGenerating?: boolean;
  onRegenerate?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  insights,
  tags = [],
  isGenerating = false,
  onRegenerate,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const textToCopy = `JOURNAL SUMMARY:\n${summary}\n\nKEY TAKEAWAY:\n${insights?.keyTakeaway || 'N/A'}\n\nEMOTIONAL THEME:\n${insights?.emotionalTheme || 'N/A'}\n\nACTION ITEMS:\n${insights?.actionItems?.map(i => `- ${i}`).join('\n') || 'None'}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  return (
    <div id="reflection-summary-card" className="rounded-2xl bg-slate-900/60 border border-white/15 p-5 shadow-2xl text-slate-100 mb-6 backdrop-blur-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-white/10 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-white text-sm tracking-tight">
            Gemini Reflection Synthesis
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {onRegenerate && (
            <button
              id="regenerate-summary-btn"
              onClick={onRegenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
              title="Refresh AI analysis"
            >
              <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          <button
            id="copy-summary-btn"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            title="Copy reflection summary to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Narrative */}
      <div className="mb-4">
        <p className="text-slate-200 text-sm leading-relaxed">
          {summary}
        </p>
      </div>

      {/* Structured Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {insights?.keyTakeaway && (
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Key Breakthrough</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {insights.keyTakeaway}
            </p>
          </div>
        )}

        {insights?.emotionalTheme && (
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 mb-1.5">
              <Heart className="w-3.5 h-3.5" />
              <span>Emotional Resonance</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {insights.emotionalTheme}
            </p>
          </div>
        )}
      </div>

      {/* Action Items */}
      {insights?.actionItems && insights.actionItems.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-white/10">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Actionable Next Steps</span>
          </div>
          <ul className="space-y-1.5">
            {insights.actionItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
