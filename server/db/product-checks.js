import { config } from '../config.js';
import { hasDatabase, query } from './pool.js';

// Saves one completed product check.
// The caller passes already-redacted userInput. This module does not keep a second, original copy.
// Local development with no DATABASE_URL uses memory. Production always uses PostgreSQL.

const INSERT_PRODUCT_CHECK = `
INSERT INTO product_checks
  (input_type, user_input, result, headline, explanation, flagged_ingredients, response_time_ms)
VALUES
  ($1, $2, $3, $4, $5, $6::jsonb, $7)
RETURNING id`;

const UPDATE_SURVEY_ANSWER = `
UPDATE product_checks
   SET survey_answer = $2
 WHERE id = $1
RETURNING id, survey_answer`;

const defaultStore = { rows: [], nextId: 1 };

export async function saveProductCheck(check, options = {}) {
  const databaseConfigured = options.hasDatabase ?? hasDatabase;
  const production = options.isProduction ?? config.isProduction;
  const queryFn = options.query ?? query;
  const store = options.store ?? defaultStore;

  if (production && !databaseConfigured) {
    throw new Error('No DATABASE_URL. Create a database in Replit (Tools > Database).');
  }

  if (!databaseConfigured) {
    return remember(store, check);
  }

  const { rows } = await queryFn(INSERT_PRODUCT_CHECK, insertParams(check));
  if (!rows?.[0] || rows[0].id == null) {
    throw new Error('The assessment was not saved. Try again when the database is available.');
  }
  return toJsonId(rows[0].id);
}

function insertParams(check) {
  return [
    check.inputType,
    check.userInput,
    check.status,
    check.headline,
    check.explanation,
    JSON.stringify(check.flaggedIngredients ?? []),
    check.responseTimeMs ?? null,
  ];
}

function remember(store, check) {
  const id = store.nextId++;
  store.rows.push({
    id,
    created_at: new Date().toISOString(),
    input_type: check.inputType,
    user_input: check.userInput,
    result: check.status,
    headline: check.headline,
    explanation: check.explanation,
    flagged_ingredients: [...(check.flaggedIngredients ?? [])],
    survey_answer: null,
    response_time_ms: check.responseTimeMs ?? null,
  });
  return id;
}

export async function saveProductFeedback({ id, helpful }, options = {}) {
  const databaseConfigured = options.hasDatabase ?? hasDatabase;
  const production = options.isProduction ?? config.isProduction;
  const queryFn = options.query ?? query;
  const store = options.store ?? defaultStore;
  const surveyAnswer = helpful ? 'yes' : 'no';

  if (production && !databaseConfigured) {
    throw feedbackError('Could not save feedback.', 'FEEDBACK_DB');
  }

  if (!databaseConfigured) {
    const row = store.rows.find((item) => item.id === id);
    if (!row) throw feedbackError('No matching check was found.', 'FEEDBACK_NOT_FOUND');
    row.survey_answer = surveyAnswer;
    return { id: row.id, helpful };
  }

  let rows;
  try {
    ({ rows } = await queryFn(UPDATE_SURVEY_ANSWER, [id, surveyAnswer]));
  } catch {
    throw feedbackError('Could not save feedback.', 'FEEDBACK_DB');
  }
  if (!rows?.[0]) throw feedbackError('No matching check was found.', 'FEEDBACK_NOT_FOUND');
  return { id: toJsonId(rows[0].id), helpful: rows[0].survey_answer === 'yes' };
}

function feedbackError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function toJsonId(id) {
  const parsed = Number(id);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error('The saved check id was not a safe JSON number.');
  }
  return parsed;
}
