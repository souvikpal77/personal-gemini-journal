import type { PromptTemplate } from '../types';

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'daily-checkin',
    title: 'Daily Evening Retrospective',
    description: 'Unwind your thoughts, process what went well, and acknowledge what felt challenging.',
    initialPrompt: 'I would like to do an evening check-in. Today felt meaningful in some ways and demanding in others. Can you guide me through a gentle reflection on my day?',
    suggestedMood: 'thoughtful',
    category: 'daily'
  },
  {
    id: 'mindful-gratitude',
    title: 'Gratitude & Joy Anchors',
    description: 'Anchor yourself in three micro-moments of peace or appreciation from today.',
    initialPrompt: 'I want to focus on gratitude right now. Help me identify and appreciate small moments or people that brought peace or energy to my day.',
    suggestedMood: 'grateful',
    category: 'mindfulness'
  },
  {
    id: 'anxiety-processing',
    title: 'Calming an Overactive Mind',
    description: 'Externalize worries and separate what you can control from what you cannot.',
    initialPrompt: 'I am feeling somewhat anxious and my mind is racing with thoughts. Can you help me unpack what is on my mind and ground myself?',
    suggestedMood: 'anxious',
    category: 'clarity'
  },
  {
    id: 'decision-clarity',
    title: 'Decision Crossroads',
    description: 'Clarify a difficult choice by exploring your core values and long-term intentions.',
    initialPrompt: 'I am facing a decision and feeling torn between options. Can you act as a sounding board to help me evaluate my choices and priorities?',
    suggestedMood: 'thoughtful',
    category: 'clarity'
  },
  {
    id: 'growth-wins',
    title: 'Celebrating Progress & Growth',
    description: 'Reflect on a recent win, challenge overcome, or skill developed.',
    initialPrompt: 'I want to celebrate a milestone and examine how much I have grown recently. Help me extract the key lessons and reinforce my momentum.',
    suggestedMood: 'motivated',
    category: 'growth'
  },
  {
    id: 'creative-brainstorm',
    title: 'Creative Flow & Visioning',
    description: 'Explore new ideas, unblock creative stagnation, and sketch out possibilities.',
    initialPrompt: 'I have a seed of an idea that I want to explore freely without self-judgment. Let us bounce thoughts back and forth to expand it.',
    suggestedMood: 'joyful',
    category: 'growth'
  }
];

export const MOOD_CONFIG: Record<string, { label: string; emoji: string; bg: string; text: string; border: string }> = {
  peaceful: { label: 'Peaceful', emoji: '🌿', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  grateful: { label: 'Grateful', emoji: '✨', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  thoughtful: { label: 'Thoughtful', emoji: '🌌', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  motivated: { label: 'Motivated', emoji: '🔥', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  joyful: { label: 'Joyful', emoji: '☀️', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  anxious: { label: 'Anxious', emoji: '🌊', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  exhausted: { label: 'Exhausted', emoji: '🌙', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};
