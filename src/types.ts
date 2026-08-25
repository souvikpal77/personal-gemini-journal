export type MoodType = 'peaceful' | 'motivated' | 'anxious' | 'thoughtful' | 'grateful' | 'exhausted' | 'joyful';

export interface JournalMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface JournalInsight {
  keyTakeaway: string;
  emotionalTheme: string;
  actionItems: string[];
}

export interface JournalSession {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  insights?: JournalInsight;
  mood?: MoodType;
  messages: JournalMessage[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  initialPrompt: string;
  suggestedMood: MoodType;
  category: 'daily' | 'clarity' | 'growth' | 'mindfulness';
}
