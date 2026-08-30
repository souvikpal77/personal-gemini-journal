import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Parse incoming JSON requests with safe limits
app.use(express.json({ limit: '2mb' }));

// Lazy GoogleGenAI client singleton with user-agent header
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Valid models for basic text & summarization tasks in Google AI Studio
const TEXT_MODELS = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

// Helper to execute generation with model fallback and retry
async function generateWithFallback(
  ai: GoogleGenAI,
  requestConfig: {
    contents: any;
    config?: any;
  }
): Promise<string> {
  let lastError: any = null;

  for (const model of TEXT_MODELS) {
    // Up to 2 attempts per model for transient errors
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: requestConfig.contents,
          config: requestConfig.config,
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini API] Attempt ${attempt} with model ${model} failed:`, err?.message || err);
        // If error is 404 (model not found), don't retry same model
        const errMsg = String(err?.message || '');
        if (errMsg.includes('404') || errMsg.includes('NOT_FOUND')) {
          break;
        }
        // Small pause before retry on transient network errors
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }
    }
  }

  throw lastError || new Error('All Gemini model candidates failed to generate a response');
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Gemini Chat Endpoint for journaling and reflective conversation
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { messages, mood } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Valid messages array is required' });
    }

    const validMessages = messages.filter(
      (m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0
    );

    if (validMessages.length === 0) {
      return res.status(400).json({ error: 'At least one non-empty message is required' });
    }

    const ai = getGenAI();

    // Prepare system instructions for empathetic, mindful, and insightful journaling companion
    const systemInstruction = `You are a supportive, mindful, and empathetic personal AI journaling partner named "Gemini Journal Companion".
Your purpose is to help the user introspect, process emotions, organize thoughts, gain clarity, and foster personal growth.

Guidelines:
- Tone: Warm, thoughtful, respectful, non-judgmental, and constructive.
- Response structure: Acknowledge feelings genuinely, offer gentle reflective perspectives, ask 1 focused open-ended follow-up question when appropriate to deepen insight.
- Keep responses engaging yet concise (usually 2-4 short paragraphs or key bullet insights).
- Current user mood state context: ${mood ? String(mood) : 'Not specified'}.
- Format: Clean Markdown with subtle emphasis where appropriate.`;

    // Map conversation turns to Gemini API contents format
    const contents = validMessages.map((m: any) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content).trim() }]
    }));

    const responseText = await generateWithFallback(ai, {
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.95
      }
    });

    return res.json({ reply: responseText });
  } catch (error: any) {
    console.error('API /api/gemini/chat error:', error?.message || error);
    return res.status(500).json({
      error: error?.message || 'An error occurred while communicating with Gemini AI'
    });
  }
});

// Gemini Summarization & Insights Endpoint
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  try {
    const { messages, title } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Valid messages array is required for summary' });
    }

    const validMessages = messages.filter(
      (m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0
    );

    if (validMessages.length === 0) {
      return res.status(400).json({ error: 'Valid message history is required' });
    }

    const ai = getGenAI();

    // Create transcript of the conversation
    const transcript = validMessages
      .map((m: any) => `${m.role === 'model' || m.role === 'assistant' ? 'Gemini' : 'User'}: ${m.content}`)
      .join('\n\n');

    const prompt = `Analyze this personal journal reflection session and provide a structured synthesis.
Journal Title/Topic: ${title || 'Personal Reflection'}

TRANSCRIPT:
${transcript}

Output a structured JSON object containing:
- title: A short, evocative 3-6 word title capturing the essence of this journal entry
- summary: A cohesive 2-3 sentence executive summary of the thoughts, feelings, and insights explored
- keyTakeaway: The core insight or emotional breakthrough achieved in this reflection
- emotionalTheme: 1-3 descriptive emotional states (e.g., Growth & Resilience, Clarifying Doubt, Calm Gratitude)
- actionItems: Array of 1-3 actionable steps or reflection prompts`;

    let parsedResult: any = null;

    try {
      const responseText = await generateWithFallback(ai, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'A short, evocative 3-6 word title capturing the essence of this journal entry'
              },
              summary: {
                type: Type.STRING,
                description: 'A cohesive 2-3 sentence executive summary of the thoughts, feelings, and insights explored'
              },
              keyTakeaway: {
                type: Type.STRING,
                description: 'The core insight or emotional breakthrough achieved in this reflection'
              },
              emotionalTheme: {
                type: Type.STRING,
                description: '1-3 descriptive emotional states'
              },
              actionItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '1-3 actionable steps or reflection prompts'
              }
            },
            required: ['title', 'summary', 'keyTakeaway', 'emotionalTheme', 'actionItems']
          }
        }
      });

      if (responseText) {
        try {
          parsedResult = JSON.parse(responseText);
        } catch (jsonErr) {
          const match = responseText.match(/\{[\s\S]*\}/);
          if (match) {
            parsedResult = JSON.parse(match[0]);
          }
        }
      }
    } catch (genErr: any) {
      console.warn('Structured summary generation error:', genErr?.message || genErr);
    }

    if (!parsedResult) {
      // Graceful fallback synthesis if AI JSON parsing failed
      parsedResult = {
        title: title || 'Personal Journal Reflection',
        summary: 'Reflection session completed with actionable takeaways and self-exploration.',
        keyTakeaway: 'Mindful observation and ongoing personal growth.',
        emotionalTheme: 'Thoughtful Introspection',
        actionItems: ['Revisit reflections tomorrow', 'Act on personal insights']
      };
    }

    return res.json(parsedResult);
  } catch (error: any) {
    console.error('API /api/gemini/summarize error:', error?.message || error);
    return res.status(500).json({
      error: error?.message || 'Failed to synthesize journal summary'
    });
  }
});

// Explicit 404 handler for all /api/* routes so they NEVER fall through to HTML SPA fallback
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Express global error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

// Vite middleware / Static serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Personal Gemini Journal server running on http://localhost:${PORT}`);
  });
}

setupServer();

