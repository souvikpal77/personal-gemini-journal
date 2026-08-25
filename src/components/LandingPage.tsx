import React from 'react';
import { Sparkles, Lock, RefreshCw, Key, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  isLoading,
  errorMessage,
}) => {
  return (
    <div id="landing-page" className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-transparent text-slate-100">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 pb-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-indigo-300 text-xs font-medium mb-6 backdrop-blur-xl shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span>AI-Powered Mindful Introspection & Structured Synthesis</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white max-w-2xl mx-auto leading-tight mb-4">
          A private sanctuary for your deepest thoughts & reflections.
        </h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-8">
          Converse with Gemini 3.7 Flash to process daily events, unblock complex decisions, and extract automatic executive takeaways—strictly protected with owner-bound Cloud Firestore isolation.
        </p>

        {/* Error Alert if sign in failed */}
        {errorMessage && (
          <div id="landing-error-alert" className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs text-left flex items-start gap-2.5 backdrop-blur-xl shadow-lg">
            <span className="font-bold">Error:</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary Google Sign In CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="google-signin-primary-btn"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-2xl font-semibold text-sm bg-white hover:bg-slate-100 text-slate-950 transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                <span>Connecting to Google Account...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google Sign-In</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </>
            )}
          </button>
        </div>

        {/* Security Highlights Bar */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl hover:border-indigo-400/40 transition-all shadow-lg hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)]">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-white mb-1">Strict UID Isolation</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every reflection is stored under <code className="text-indigo-300 font-mono">users/&#123;uid&#125;/interactions</code>. Only your verified Google UID can query or edit.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl hover:border-indigo-400/40 transition-all shadow-lg hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)]">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Key className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-white mb-1">Server-Side Secret Hygiene</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gemini API tokens and server credentials reside strictly in Google Cloud Secret Manager. The client bundle never exposes keys.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl hover:border-indigo-400/40 transition-all shadow-lg hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)]">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-white mb-1">Automatic Synthesis</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Generates executive takeaways, emotional themes, and action points on demand with one click.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="border-t border-white/10 py-6 px-4 text-center text-xs text-slate-400 backdrop-blur-md">
        Personal Gemini Journal • Cloud Run & Firebase Firestore Architecture
      </div>
    </div>
  );
};
