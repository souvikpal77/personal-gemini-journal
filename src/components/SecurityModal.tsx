import React from 'react';
import { X, ShieldCheck, Lock, Key, Server, Database } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid?: string;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  uid,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        id="security-modal-container"
        className="w-full max-w-2xl bg-slate-900/90 border border-white/15 rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white">
                Security Architecture & Threat Controls
              </h3>
              <p className="text-xs text-slate-400">
                End-to-End OWASP & Google Cloud Security Compliance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-300 leading-relaxed">
          {/* Active UID */}
          {uid && (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between backdrop-blur-md">
              <div>
                <span className="text-slate-400 font-medium">Authenticated Firebase UID:</span>
                <div className="font-mono text-indigo-300 text-[11px] mt-0.5">{uid}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium text-[11px]">
                Verified Session
              </span>
            </div>
          )}

          {/* Key Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Strict Firestore Data Isolation</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Rules enforce <code className="text-indigo-300 font-mono">request.auth.uid == userId</code>. No user can read or write documents outside their verified document tree.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Zero Hardcoded Secrets</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Gemini API tokens and server credentials reside strictly in Google Cloud Secret Manager. Browser clients have zero access to API secrets.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                <Server className="w-4 h-4 text-sky-400" />
                <span>Server-Side Model Proxying</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Express server validates payload schemas and handles model fallbacks (<code className="text-indigo-300 font-mono">gemini-3.7-flash</code>) with error isolation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Zero Client-Trust Invariant</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                UIDs sent from frontend are cross-validated against the authenticated Firebase token before database and AI actions execute.
              </p>
            </div>
          </div>

          {/* Firestore Security Rules Display */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="text-white font-semibold text-xs mb-2">
              Active Firestore Security Rules:
            </div>
            <pre className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 font-mono text-[11px] text-indigo-200 overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors border border-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
