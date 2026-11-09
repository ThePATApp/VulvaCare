import 'dotenv/config';

// Every setting the server reads, in one place.
// On Replit these come from Secrets. Locally they come from .env.
export const config = {
  port: Number(process.env.PORT) || 3000,
  isProduction: process.env.NODE_ENV === 'production',

  // ---- AI (Google Gemini through LangChain) ----
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  // Lower = steadier answers. Google recommends 1.0 for Gemini 3.x; we use a
  // little lower for a helpful-facts app. Change it and compare!
  temperature: Number(process.env.GEMINI_TEMPERATURE ?? 0.7),
  maxOutputTokens: 600,
  forceMock: process.env.AI_MODE === 'mock',

  // ---- Database (Replit PostgreSQL) ----
  databaseUrl: process.env.DATABASE_URL || '',
};

// "live" when a key is set, "mock" otherwise, so the app runs on day one.
export const aiMode = () => (config.geminiApiKey && !config.forceMock ? 'live' : 'mock');
