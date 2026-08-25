import React from 'react';
import { Sparkles, BookOpen, LogOut, ShieldCheck, Plus, History } from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onNewSession: () => void;
  onOpenHistory: () => void;
  onOpenSecurity: () => void;
  onSignOut: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onNewSession,
  onOpenHistory,
  onOpenSecurity,
  onSignOut,
  historyCount,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-30 w-full bg-slate-950/60 text-slate-100 border-b border-white/10 backdrop-blur-2xl shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(129,140,248,0.4)]">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-white text-lg">
                Gemini Journal
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                <Sparkles className="w-3 h-3 text-purple-300" />
                Gemini 3.7 Flash
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="nav-new-entry-btn"
              onClick={onNewSession}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.35)] active:scale-98"
              title="Start a new reflection"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Entry</span>
            </button>

            <button
              id="nav-history-btn"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md transition-colors"
              title="View past journal reflections"
            >
              <History className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              id="nav-security-btn"
              onClick={onOpenSecurity}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md transition-colors"
              title="Security & Isolation details"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">UID Isolated</span>
            </button>

            <div className="h-5 w-[1px] bg-white/10 mx-1 hidden sm:block" />

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-2 pl-1">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User profile'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-indigo-400/40 object-cover shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-indigo-400 flex items-center justify-center text-xs font-semibold text-indigo-200">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div className="hidden lg:block text-left max-w-[140px] truncate">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {user.displayName || 'Journaler'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user.email}
                </div>
              </div>

              <button
                id="nav-signout-btn"
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                title="Sign out of account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              id="nav-security-badge-unauth"
              onClick={onOpenSecurity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Trust Architecture</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
