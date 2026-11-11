import { config } from '../config.js';

// Restaurant analogy: the outside supplier. LangChain's ChatGoogle talks to Gemini.
// The key is read here, on the server, and never sent to the browser.

const models = new Map();

// Chat calls getModel() and keep config.temperature. Analyze may pass a lower one.
export async function getModel(options = {}) {
  if (!config.geminiApiKey) {
    throw new Error('No GEMINI_API_KEY. Add it in Replit Secrets (or your .env file).');
  }
  const temperature = options.temperature ?? config.temperature;
  const cacheKey = `${config.model}::${temperature}`;
  if (!models.has(cacheKey)) {
    // Loaded only when needed, so the app still starts in mock mode.
    const { ChatGoogle } = await import('@langchain/google/node');
    models.set(cacheKey, new ChatGoogle({
      model: config.model,
      apiKey: config.geminiApiKey,
      temperature,
      maxOutputTokens: config.maxOutputTokens,
    }));
  }
  return models.get(cacheKey);
}

// Turn provider errors into messages a student can act on.
export function friendlyAiError(err) {
  const status = err?.status ?? err?.response?.status;
  const text = String(err?.message ?? '');
  if (status === 429 || /quota|rate/i.test(text)) return 'Too many requests. Free Gemini keys have a rate limit, so wait a minute.';
  if (status === 400 || status === 401 || status === 403 || /api key/i.test(text)) return 'Gemini rejected the key or model. Check GEMINI_API_KEY and GEMINI_MODEL.';
  if (status === 404 || /not found/i.test(text)) return 'That Gemini model was not found. Set GEMINI_MODEL to a model listed in Google AI Studio.';
  return 'The AI could not answer right now. Try again in a moment.';
}
