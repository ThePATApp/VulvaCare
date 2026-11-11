import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { ZodError } from 'zod';
import { aiMode, config } from './config.js';
import { hasDatabase, query } from './db/pool.js';
import { saveProductCheck } from './db/product-checks.js';
import { getModel, friendlyAiError } from './ai/model.js';
import { AnalyzeAssessment, AnalyzeRequest, firstError } from './validation.js';
import { redactPii } from '../skills/safety-guardrail/tool.js';

const DATABASE_UNAVAILABLE = 'The database is unavailable, so this check cannot be saved.';
const FORMAT_ERROR = 'The AI result did not match the expected assessment format.';
const SAVE_ERROR = 'The assessment was not saved. Try again when the database is available.';
const ANALYSIS_TEMPERATURE = 0.2;

const MOCK_ASSESSMENT = {
  status: 'unknown',
  headline: 'Live ingredient check is off',
  explanation: 'This preview cannot verify a formulation or judge ingredients. Add a Gemini key for a real educational assessment, or paste an ingredient list once the live check is on.',
  flaggedIngredients: [],
};

export function analysisSystemPrompt() {
  return [
    'You are VulvaCare, an AI educational checker for personal care products. You are not a doctor, nurse, or clinician.',
    'Return only the structured fields. No markdown and no extra keys.',
    'Use only lower_concern, caution, or unknown.',
    'lower_concern means the checked ingredients do not stand out for common vulvar irritation. Say plainly that this is not a statement that the product is safe.',
    'caution means one or more checked ingredients are associated with irritation or are commonly flagged for sensitive vulvar or mucosal skin. Put only those ingredients in flaggedIngredients.',
    'unknown means the product name cannot be reliably matched, the text is too vague, or you are not confident. flaggedIngredients must be an empty array.',
    'The headline is one short line. Aim for 40 to 60 words in the explanation, and keep it under 600 characters.',
    'Never say a product is safe, guaranteed safe, risk-free, doctor-approved, or clinically approved.',
    'Never invent a formulation or an ingredient that was not supplied and cannot be tied to a verified formula.',
    'If inputType is product and a real formulation cannot be verified, return unknown, an empty flaggedIngredients array, and ask for the ingredient list.',
    'If inputType is ingredients, base the assessment on the pasted list and say that it is an ingredient-based observation.',
    'If inputType is product and a verified formula is used, say that the observation is about that product\'s listed ingredients.',
    'Do not diagnose, prescribe, or tell someone to stop or start a medicine.',
    'Do not ask for a name, contact information, location, age, symptoms, pregnancy status, or medical history.',
    'This is educational information from an AI, not a medical diagnosis, and not a guarantee of safety.',
    'Assess ordinary ingredient language. Do not refuse a list because a word would have tripped a medical or crisis classifier.',
    'Do not use community-resource listings as ingredient evidence.',
  ].join('\n');
}

export async function analyzeProduct(body, deps = {}) {
  const parsed = AnalyzeRequest.safeParse(body);
  if (!parsed.success) return { status: 400, body: { error: firstError(parsed) } };

  const production = deps.isProduction ?? config.isProduction;
  const databaseConfigured = deps.hasDatabase ?? hasDatabase;
  if (production) {
    const ready = databaseConfigured && await databaseIsReady(deps.probeDatabase);
    if (!ready) return { status: 503, body: { error: DATABASE_UNAVAILABLE } };
  }

  const inputType = parsed.data.inputType;
  const userInput = redactPii(parsed.data.userInput);
  const mode = deps.aiMode ? deps.aiMode() : aiMode();
  const started = Date.now();

  let assessment;
  try {
    assessment = mode === 'mock'
      ? AnalyzeAssessment.parse(MOCK_ASSESSMENT)
      : await assessLive({ inputType, userInput, model: deps.model });
  } catch (err) {
    if (isFormatError(err)) return { status: 502, body: { error: FORMAT_ERROR } };
    console.error('[analyze] model call failed');
    return { status: 502, body: { error: friendlyAiError(err) } };
  }

  const responseTimeMs = Math.max(0, Date.now() - started);
  try {
    const save = deps.save ?? saveProductCheck;
    const id = toSavedId(await save({
      inputType,
      userInput,
      status: assessment.status,
      headline: assessment.headline,
      explanation: assessment.explanation,
      flaggedIngredients: assessment.flaggedIngredients,
      responseTimeMs,
    }));
    return {
      status: 200,
      body: {
        id,
        inputType,
        userInput,
        status: assessment.status,
        headline: assessment.headline,
        explanation: assessment.explanation,
        flaggedIngredients: assessment.flaggedIngredients,
      },
    };
  } catch {
    console.error('[analyze] save failed');
    return { status: 500, body: { error: SAVE_ERROR } };
  }
}

async function assessLive({ inputType, userInput, model }) {
  const chat = model ?? await getModel({ temperature: ANALYSIS_TEMPERATURE });
  const result = await chat.withStructuredOutput(AnalyzeAssessment).invoke([
    new SystemMessage(analysisSystemPrompt()),
    new HumanMessage(`inputType: ${inputType}\nText to assess:\n${userInput}`),
  ]);
  return AnalyzeAssessment.parse(result);
}

async function databaseIsReady(probeDatabase) {
  try {
    if (probeDatabase) await probeDatabase();
    else await query('SELECT 1');
    return true;
  } catch {
    console.error('[analyze] database is unavailable');
    return false;
  }
}

function isFormatError(err) {
  return err instanceof ZodError || err?.name === 'ZodError' || err?.name === 'MalformedOutputError';
}

function toSavedId(id) {
  const parsed = Number(id);
  if (!Number.isSafeInteger(parsed)) throw new Error('The saved check id was not a safe JSON number.');
  return parsed;
}
