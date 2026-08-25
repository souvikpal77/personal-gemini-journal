import type { JournalMessage, MoodType } from '../types';

export interface SummarizeResponse {
  title: string;
  summary: string;
  keyTakeaway: string;
  emotionalTheme: string;
  actionItems: string[];
}

async function parseResponsePayload(response: Response, defaultError: string): Promise<any> {
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let errorMsg = `${defaultError} (${response.status})`;
    if (contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        if (errorData?.error) {
          errorMsg = errorData.error;
        }
      } catch {
        // Fallback to default
      }
    } else {
      try {
        const rawText = await response.text();
        if (rawText && !rawText.startsWith('<!doctype') && !rawText.startsWith('<html')) {
          errorMsg = rawText.slice(0, 200);
        }
      } catch {
        // Fallback to default
      }
    }
    throw new Error(errorMsg);
  }

  if (contentType.includes('application/json')) {
    return await response.json();
  }

  const rawText = await response.text();
  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error('Unexpected non-JSON response from server');
  }
}

export async function sendChatMessage(
  messages: JournalMessage[],
  mood?: MoodType
): Promise<string> {
  const validMessages = messages.filter(
    (m) => m && typeof m.content === 'string' && m.content.trim().length > 0
  );

  if (validMessages.length === 0) {
    throw new Error('Please enter a thought or reflection to send.');
  }

  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: validMessages.map((m) => ({ role: m.role, content: m.content })),
      mood,
    }),
  });

  const data = await parseResponsePayload(response, 'AI service is temporarily unavailable');
  if (!data || typeof data.reply !== 'string') {
    throw new Error('Invalid reflection response received from Gemini AI');
  }
  return data.reply;
}

export async function summarizeSession(
  messages: JournalMessage[],
  title?: string
): Promise<SummarizeResponse> {
  const validMessages = messages.filter(
    (m) => m && typeof m.content === 'string' && m.content.trim().length > 0
  );

  if (validMessages.length === 0) {
    throw new Error('At least one journal message is required to generate a summary.');
  }

  const response = await fetch('/api/gemini/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: validMessages.map((m) => ({ role: m.role, content: m.content })),
      title,
    }),
  });

  return await parseResponsePayload(response, 'Failed to synthesize journal reflection');
}

