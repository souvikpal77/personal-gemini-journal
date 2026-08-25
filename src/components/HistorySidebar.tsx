import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Trash2, 
  Calendar, 
  Sparkles, 
  ChevronRight, 
  Edit3, 
  Check, 
  BookOpen, 
  Plus, 
  RefreshCw,
  Clock
} from 'lucide-react';
import type { JournalSession, MoodType } from '../types';
import { MOOD_CONFIG } from '../data/prompts';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: JournalSession[];
  currentSessionId: string | null;
  onSelectSession: (session: JournalSession) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onRenameSession: (sessionId: string, newTitle: string) => Promise<void>;
  isLoading: boolean;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.summary && session.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      session.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMood = !selectedMoodFilter || session.mood === selectedMoodFilter;

    return matchesSearch && matchesMood;
  });

  const handleStartEdit = (session: JournalSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitleText(session.title);
  };

  const handleSaveEdit = async (sessionId: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitleText.trim()) {
      await onRenameSession(sessionId, editTitleText.trim());
    }
    setEditingId(null);
  };

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to permanently delete this journal entry from your Firestore?')) {
      setDeletingId(sessionId);
      try {
        await onDeleteSession(sessionId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-md flex justify-end">
      <div 
        id="history-drawer-panel"
        className="w-full max-w-md bg-slate-900/80 border-l border-white/10 h-full flex flex-col shadow-2xl text-slate-100 animate-in slide-in-from-right duration-200 backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-white/10">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-base text-white tracking-tight">
              Journal Archive ({sessions.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="history-new-entry-btn"
              onClick={() => {
                onNewSession();
                onClose();
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>
            <button
              id="close-history-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Mood Filter */}
        <div className="p-4 border-b border-white/10 space-y-3 bg-slate-950/30">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="history-search-input"
              type="text"
              placeholder="Search thoughts, reflections, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          {/* Mood quick filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedMoodFilter(null)}
              className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap transition-colors ${
                selectedMoodFilter === null
                  ? 'bg-indigo-600 text-white font-semibold shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              All
            </button>
            {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setSelectedMoodFilter(selectedMoodFilter === key ? null : key)}
                className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap transition-colors flex items-center gap-1 ${
                  selectedMoodFilter === key
                    ? 'bg-white text-slate-900 font-semibold'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/10'
                }`}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
              <span className="text-xs">Fetching Firestore reflections...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-500" />
              <p className="text-xs font-medium text-slate-300">No reflections found</p>
              <p className="text-[11px] text-slate-500 mt-1">
                {searchQuery || selectedMoodFilter ? 'Try clearing your search filters' : 'Start your first journal conversation today!'}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isSelected = session.id === currentSessionId;
              const isEditing = editingId === session.id;
              const moodInfo = session.mood ? MOOD_CONFIG[session.mood] : null;

              return (
                <div
                  key={session.id}
                  id={`history-item-${session.id}`}
                  onClick={() => {
                    onSelectSession(session);
                    onClose();
                  }}
                  className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer backdrop-blur-md ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-400/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-indigo-400/30 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    {isEditing ? (
                      <form 
                        onSubmit={(e) => handleSaveEdit(session.id, e)} 
                        className="flex-1 flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitleText}
                          onChange={(e) => setEditTitleText(e.target.value)}
                          autoFocus
                          className="flex-1 bg-slate-900 border border-indigo-500/60 rounded-lg px-2.5 py-0.5 text-xs text-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <h4 className="font-semibold text-xs text-white line-clamp-1 flex-1">
                        {session.title || 'Untitled Reflection'}
                      </h4>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      {!isEditing && (
                        <button
                          onClick={(e) => handleStartEdit(session, e)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Rename title"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(session.id, e)}
                        disabled={deletingId === session.id}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                        title="Delete from Firestore"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Summary preview */}
                  {session.summary && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                      {session.summary}
                    </p>
                  )}

                  {/* Metadata footer */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(session.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatTime(session.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {moodInfo && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10">
                          <span>{moodInfo.emoji}</span>
                          <span>{moodInfo.label}</span>
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-slate-400 font-mono">
                        {session.messages.length} msgs
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
