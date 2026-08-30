import React, { useState, useEffect, useCallback } from 'react';
import { 
  onAuthChange, 
  signInWithGoogle, 
  signOutUser, 
  saveJournalSession, 
  fetchUserJournalSessions,
  deleteJournalSession,
  updateJournalTitle 
} from './lib/firebase';
import { sendChatMessage, summarizeSession } from './lib/geminiApi';
import type { UserProfile, JournalSession, JournalMessage, MoodType } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { JournalChat } from './components/JournalChat';
import { HistorySidebar } from './components/HistorySidebar';
import { SecurityModal } from './components/SecurityModal';
import { RefreshCw } from 'lucide-react';

function createNewSession(userId: string): JournalSession {
  const timestamp = new Date().toISOString();
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    title: 'New Reflection',
    messages: [],
    tags: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Journal state
  const [sessions, setSessions] = useState<JournalSession[]>([]);
  const [currentSession, setCurrentSession] = useState<JournalSession | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Operation states
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSavingToDb, setIsSavingToDb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserPrompt, setLastUserPrompt] = useState<string | null>(null);

  // Modals & Panels
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        };
        setUser(userProfile);
        setAuthError(null);
        await loadUserSessions(firebaseUser.uid);
      } else {
        setUser(null);
        setSessions([]);
        setCurrentSession(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Firestore sessions for current user
  const loadUserSessions = async (userId: string) => {
    try {
      setHistoryLoading(true);
      const userSessions = await fetchUserJournalSessions(userId);
      setSessions(userSessions);

      if (userSessions.length > 0) {
        setCurrentSession(userSessions[0]);
      } else {
        const fresh = createNewSession(userId);
        setCurrentSession(fresh);
      }
    } catch (err: any) {
      console.error('Error loading Firestore sessions:', err);
      setError(err?.message || 'Failed to load journal history from Firestore');
      // Create empty fallback session
      if (userId) {
        setCurrentSession(createNewSession(userId));
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      const signedInUser = await signInWithGoogle();
      if (!signedInUser) {
        // Sign-in popup was closed by user or cancelled; cleanly reset loading state
        setAuthLoading(false);
        return;
      }
    } catch (err: any) {
      const errorCode = err?.code || '';
      const errorMsg = err?.message || '';
      if (
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/cancelled-popup-request' ||
        errorCode === 'auth/user-cancelled' ||
        errorCode === 'auth/popup-blocked' ||
        errorMsg.includes('popup-closed-by-user') ||
        errorMsg.includes('cancelled-popup-request')
      ) {
        setAuthLoading(false);
        return;
      }
      console.error('Sign in failed:', err);
      setAuthError(err?.message || 'Google sign-in encountered an issue. Please try again.');
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const handleNewSession = () => {
    if (!user) return;
    const fresh = createNewSession(user.uid);
    setCurrentSession(fresh);
    setError(null);
    setLastUserPrompt(null);
  };

  const handleSendMessage = async (content: string, mood?: MoodType) => {
    if (!user || !currentSession) return;

    setError(null);
    setLastUserPrompt(content);

    const userMessage: JournalMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    // Calculate auto title if this is the first user message
    let sessionTitle = currentSession.title;
    if (currentSession.messages.length === 0 || sessionTitle === 'New Reflection') {
      sessionTitle = content.length > 40 ? `${content.substring(0, 38)}...` : content;
    }

    const updatedMessages = [...currentSession.messages, userMessage];
    const updatedSession: JournalSession = {
      ...currentSession,
      title: sessionTitle,
      mood: mood || currentSession.mood,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    };

    // Optimistically update active session
    setCurrentSession(updatedSession);
    setIsLoadingAi(true);

    try {
      // 1. Send conversation history to Gemini backend
      const aiReply = await sendChatMessage(updatedMessages, updatedSession.mood);

      const aiMessage: JournalMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'model',
        content: aiReply,
        timestamp: new Date().toISOString()
      };

      const finalSession: JournalSession = {
        ...updatedSession,
        messages: [...updatedMessages, aiMessage],
        updatedAt: new Date().toISOString()
      };

      setCurrentSession(finalSession);

      // 2. Persist to Firestore under `users/{userId}/interactions/{interactionId}`
      setIsSavingToDb(true);
      try {
        await saveJournalSession(user.uid, finalSession);

        // Update in local sessions list
        setSessions((prev) => {
          const existingIdx = prev.findIndex((s) => s.id === finalSession.id);
          if (existingIdx >= 0) {
            const copy = [...prev];
            copy[existingIdx] = finalSession;
            return copy;
          }
          return [finalSession, ...prev];
        });

        setLastUserPrompt(null);
      } catch (dbErr: any) {
        console.error('Firestore save failed:', dbErr);
        setError('Your reflection was generated, but saving to Cloud Firestore failed. Please verify your connection.');
      }
    } catch (err: any) {
      console.error('Error during AI reflection turn:', err);
      setError(err?.message || 'Could not complete reflection with Gemini AI. Your text is preserved.');
    } finally {
      setIsLoadingAi(false);
      setIsSavingToDb(false);
    }
  };

  const handleRetryLastMessage = () => {
    if (lastUserPrompt) {
      handleSendMessage(lastUserPrompt, currentSession?.mood);
    }
  };

  const handleGenerateSummary = async () => {
    if (!user || !currentSession || currentSession.messages.length === 0) return;

    setIsGeneratingSummary(true);
    setError(null);

    try {
      const summaryResult = await summarizeSession(currentSession.messages, currentSession.title);

      const updatedSession: JournalSession = {
        ...currentSession,
        title: summaryResult.title || currentSession.title,
        summary: summaryResult.summary,
        insights: {
          keyTakeaway: summaryResult.keyTakeaway,
          emotionalTheme: summaryResult.emotionalTheme,
          actionItems: summaryResult.actionItems || []
        },
        updatedAt: new Date().toISOString()
      };

      setCurrentSession(updatedSession);

      // Persist summary to Firestore
      setIsSavingToDb(true);
      try {
        await saveJournalSession(user.uid, updatedSession);

        // Update sessions list
        setSessions((prev) =>
          prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
        );
      } catch (dbErr: any) {
        console.error('Firestore summary save failed:', dbErr);
        setError('Summary was synthesized, but saving to Cloud Firestore encountered an issue.');
      }
    } catch (err: any) {
      console.error('Error generating summary:', err);
      setError(err?.message || 'Failed to synthesize summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
      setIsSavingToDb(false);
    }
  };

  const handleUpdateMood = async (mood: MoodType) => {
    if (!user || !currentSession) return;

    const updatedSession: JournalSession = {
      ...currentSession,
      mood,
      updatedAt: new Date().toISOString()
    };

    setCurrentSession(updatedSession);
    if (currentSession.messages.length > 0) {
      await saveJournalSession(user.uid, updatedSession);
      setSessions((prev) =>
        prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
      );
    }
  };

  const handleUpdateTitle = async (newTitle: string) => {
    if (!user || !currentSession) return;

    const updatedSession: JournalSession = {
      ...currentSession,
      title: newTitle,
      updatedAt: new Date().toISOString()
    };

    setCurrentSession(updatedSession);
    if (currentSession.messages.length > 0) {
      await updateJournalTitle(user.uid, currentSession.id, newTitle);
      setSessions((prev) =>
        prev.map((s) => (s.id === updatedSession.id ? { ...s, title: newTitle } : s))
      );
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    try {
      await deleteJournalSession(user.uid, sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);

      if (currentSession?.id === sessionId) {
        if (remaining.length > 0) {
          setCurrentSession(remaining[0]);
        } else {
          setCurrentSession(createNewSession(user.uid));
        }
      }
    } catch (err: any) {
      console.error('Error deleting session:', err);
      setError(err?.message || 'Failed to delete journal entry from Firestore');
    }
  };

  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    if (!user) return;
    try {
      await updateJournalTitle(user.uid, sessionId, newTitle);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s))
      );
      if (currentSession?.id === sessionId) {
        setCurrentSession((prev) => (prev ? { ...prev, title: newTitle } : null));
      }
    } catch (err: any) {
      console.error('Error renaming session:', err);
      setError(err?.message || 'Failed to rename journal title in Firestore');
    }
  };

  // Initial Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-transparent text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-2xl shadow-2xl">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Personal Gemini Journal
          </h2>
          <p className="text-xs text-slate-400">Verifying secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation */}
      <Navbar
        user={user}
        onNewSession={handleNewSession}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onSignOut={handleSignOut}
        historyCount={sessions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {!user ? (
          <LandingPage
            onSignIn={handleSignIn}
            isLoading={authLoading}
            errorMessage={authError}
          />
        ) : currentSession ? (
          <JournalChat
            session={currentSession}
            onSendMessage={handleSendMessage}
            onGenerateSummary={handleGenerateSummary}
            onUpdateMood={handleUpdateMood}
            onUpdateTitle={handleUpdateTitle}
            isLoadingAi={isLoadingAi}
            isGeneratingSummary={isGeneratingSummary}
            isSavingToDb={isSavingToDb}
            error={error}
            onClearError={() => setError(null)}
            onRetryLastMessage={lastUserPrompt ? handleRetryLastMessage : undefined}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading reflection workspace...
          </div>
        )}
      </main>

      {/* History Archive Sidebar Drawer */}
      {user && (
        <HistorySidebar
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          sessions={sessions}
          currentSessionId={currentSession?.id || null}
          onSelectSession={(s) => {
            setCurrentSession(s);
            setError(null);
          }}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          isLoading={historyLoading}
        />
      )}

      {/* Security Architecture & Invariants Modal */}
      <SecurityModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        uid={user?.uid}
      />
    </div>
  );
}
