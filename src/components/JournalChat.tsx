import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  Send, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Clock, 
  Compass, 
  BrainCircuit, 
  Tag, 
  Smile, 
  Save, 
  FileText,
  RotateCcw
} from 'lucide-react';
import type { JournalSession, JournalMessage, MoodType } from '../types';
import { PROMPT_TEMPLATES, MOOD_CONFIG } from '../data/prompts';
import { SummaryCard } from './SummaryCard';

interface JournalChatProps {
  session: JournalSession;
  onSendMessage: (content: string, mood?: MoodType) => Promise<void>;
  onGenerateSummary: () => Promise<void>;
  onUpdateMood: (mood: MoodType) => void;
  onUpdateTitle: (title: string) => void;
  isLoadingAi: boolean;
  isGeneratingSummary: boolean;
  isSavingToDb: boolean;
  error: string | null;
  onClearError: () => void;
  onRetryLastMessage?: () => void;
}

export const JournalChat: React.FC<JournalChatProps> = ({
  session,
  onSendMessage,
  onGenerateSummary,
  onUpdateMood,
  onUpdateTitle,
  isLoadingAi,
  isGeneratingSummary,
  isSavingToDb,
  error,
  onClearError,
  onRetryLastMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(session.title);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync title when session changes
  useEffect(() => {
    setTitleInput(session.title);
  }, [session.id, session.title]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages.length, isLoadingAi, isGeneratingSummary]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoadingAi) return;

    // Reset input immediately but retain text in parent if request fails
    setInputText('');
    await onSendMessage(trimmed, session.mood);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectTemplate = (template: typeof PROMPT_TEMPLATES[0]) => {
    if (template.suggestedMood) {
      onUpdateMood(template.suggestedMood);
    }
    onSendMessage(template.initialPrompt, template.suggestedMood);
  };

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const activeMood = session.mood ? MOOD_CONFIG[session.mood] : null;

  return (
    <div id="journal-workspace" className="flex-1 flex flex-col h-full bg-transparent text-slate-100 overflow-hidden">
      {/* Session Top Bar */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 bg-slate-950/40 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
        {/* Title & Edit */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center gap-2 flex-1 max-w-md">
              <input
                id="edit-session-title-input"
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                autoFocus
                onBlur={handleTitleSubmit}
                className="w-full bg-slate-900/90 border border-indigo-500/60 rounded-xl px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 backdrop-blur-md"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div 
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-2 cursor-pointer group"
              title="Click to rename reflection"
            >
              <h2 className="font-semibold text-base sm:text-lg text-white group-hover:text-indigo-300 transition-colors tracking-tight">
                {session.title || 'Untitled Journal Entry'}
              </h2>
              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                (edit)
              </span>
            </div>
          )}
        </div>

        {/* Action Controls & Mood Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Firestore Sync Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            {isSavingToDb ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                <span className="text-indigo-300 font-mono">Syncing to Firestore...</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3 text-emerald-400" />
                <span className="text-slate-400">Encrypted in Firestore</span>
              </>
            )}
          </div>

          {/* Mood Pill Trigger */}
          <div className="relative">
            <button
              id="mood-selector-btn"
              onClick={() => setShowMoodPicker(!showMoodPicker)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-md transition-all ${
                activeMood
                  ? 'bg-white/10 text-slate-100 border-white/20 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{activeMood ? activeMood.emoji : '🧘'}</span>
              <span>{activeMood ? activeMood.label : 'Set Mood'}</span>
            </button>

            {/* Mood Dropdown */}
            {showMoodPicker && (
              <div 
                id="mood-picker-dropdown"
                className="absolute right-0 mt-2 w-52 bg-slate-900/90 border border-white/15 rounded-2xl shadow-2xl p-2 z-40 grid grid-cols-1 gap-1 backdrop-blur-2xl"
              >
                <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Emotional State
                </div>
                {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => {
                      onUpdateMood(key as MoodType);
                      setShowMoodPicker(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors text-left ${
                      session.mood === key
                        ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 font-medium'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{cfg.emoji}</span>
                    <span>{cfg.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Summarize Action Button */}
          {session.messages.length >= 2 && (
            <button
              id="generate-summary-btn"
              onClick={onGenerateSummary}
              disabled={isGeneratingSummary || isLoadingAi}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 active:scale-98 cursor-pointer"
              title="Generate structured AI insights & executive summary"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
              <span>{session.summary ? 'Update Synthesis' : 'Synthesize Reflection'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Render Summary Card if existing */}
        {session.summary && (
          <SummaryCard
            summary={session.summary}
            insights={session.insights}
            tags={session.tags}
            isGenerating={isGeneratingSummary}
            onRegenerate={onGenerateSummary}
          />
        )}

        {/* Empty State / Prompt Templates */}
        {session.messages.length === 0 && (
          <div className="max-w-2xl mx-auto py-10 text-center space-y-6 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/15 text-indigo-300 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(99,102,241,0.25)] backdrop-blur-xl">
              <Compass className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                What is on your mind today?
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-md mx-auto leading-relaxed">
                Type your thoughts below, or choose a guided reflective prompt to begin your dialogue with Gemini.
              </p>
            </div>

            {/* Prompt Template Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left pt-2">
              {PROMPT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  id={`prompt-card-${tpl.id}`}
                  onClick={() => handleSelectTemplate(tpl)}
                  disabled={isLoadingAi}
                  className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-400/40 backdrop-blur-md transition-all text-left group disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {tpl.title}
                    </span>
                    <span className="text-sm">
                      {MOOD_CONFIG[tpl.suggestedMood]?.emoji || '✨'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                    {tpl.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Turns */}
        {session.messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              id={`message-${msg.id}`}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/15 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_15px_rgba(99,102,241,0.2)] backdrop-blur-md">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 sm:p-5 text-sm leading-relaxed max-w-[88%] sm:max-w-[80%] backdrop-blur-xl shadow-lg ${
                  isUser
                    ? 'bg-indigo-600/35 text-indigo-50 border border-indigo-400/40 rounded-2xl rounded-tr-xs shadow-[0_4px_20px_rgba(99,102,241,0.2)]'
                    : 'bg-slate-900/60 text-slate-100 border border-white/10 rounded-2xl rounded-tl-xs'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-2 border-b border-white/10 pb-1.5">
                  <span className="font-semibold uppercase tracking-wider text-slate-300">
                    {isUser ? 'You' : 'Gemini Companion'}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Content */}
                {isUser ? (
                  <p className="whitespace-pre-wrap font-sans text-slate-100 text-sm">
                    {msg.content}
                  </p>
                ) : (
                  <div className="prose prose-invert prose-slate max-w-none text-slate-100 text-sm prose-p:leading-relaxed prose-headings:text-white prose-ul:my-2 prose-li:my-0.5">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* AI Thinking Indicator */}
        {isLoadingAi && (
          <div className="flex gap-3 max-w-3xl mr-auto animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/15 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 backdrop-blur-md">
              <BrainCircuit className="w-4 h-4 animate-pulse text-indigo-300" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-slate-300 text-xs flex items-center gap-2.5 rounded-tl-xs backdrop-blur-xl shadow-lg">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Gemini is reflecting on your thoughts...</span>
            </div>
          </div>
        )}

        {/* Error Alert with Preservation & Retry */}
        {error && (
          <div id="chat-error-banner" className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-start justify-between gap-3 animate-in fade-in backdrop-blur-xl shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-rose-200">Notice:</span>
                <span className="text-rose-100">{error}</span>
                <p className="text-[11px] text-rose-300/80 mt-1">Your draft text has been preserved safely.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onRetryLastMessage && (
                <button
                  onClick={onRetryLastMessage}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-white text-xs font-semibold transition-colors border border-rose-700/50"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
              <button
                onClick={onClearError}
                className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/50"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto space-y-2">
          <div className="relative bg-slate-900/70 border border-white/15 focus-within:border-indigo-400/60 focus-within:shadow-[0_0_25px_rgba(99,102,241,0.25)] rounded-2xl shadow-2xl transition-all backdrop-blur-2xl">
            <textarea
              id="journal-input-textarea"
              ref={textareaRef}
              value={inputText}
              onChange={autoResizeTextarea}
              onKeyDown={handleKeyDown}
              placeholder={
                session.messages.length === 0
                  ? "Express your thoughts, emotions, challenges, or aspirations freely..."
                  : "Reply to Gemini, share another thought, or ask for perspective..."
              }
              rows={2}
              disabled={isLoadingAi}
              className="w-full bg-transparent text-slate-100 placeholder-slate-400 px-4 py-3 text-sm focus:outline-none resize-none min-h-[56px] max-h-[180px] disabled:opacity-50"
            />

            <div className="flex items-center justify-between px-3 py-2 border-t border-white/10 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[11px] text-slate-400">
                  Press <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 text-slate-200 font-mono text-[10px] border border-white/10">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 text-slate-200 font-mono text-[10px] border border-white/10">Shift+Enter</kbd> for newline
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="journal-send-btn"
                  type="submit"
                  disabled={!inputText.trim() || isLoadingAi}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.35)] active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Reflect</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
