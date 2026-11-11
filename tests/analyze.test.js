import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { ZodError } from 'zod';
import { analyzeProduct, analysisSystemPrompt } from '../server/analyze.js';
import { saveProductCheck } from '../server/db/product-checks.js';
import { AnalyzeAssessment } from '../server/validation.js';
import { api } from '../server/routes/api.js';

const MOCK_EXPLANATION = 'This preview cannot verify a formulation or judge ingredients. Add a Gemini key for a real educational assessment, or paste an ingredient list once the live check is on.';

function localSave(store) {
  return (check) => saveProductCheck(check, { hasDatabase: false, isProduction: false, store });
}

test('the analysis prompt states the educational rules', () => {
  const prompt = analysisSystemPrompt();
  assert.match(prompt, /not a medical diagnosis/);
  assert.match(prompt, /lower_concern, caution, or unknown/);
  assert.match(prompt, /Never say a product is safe/);
  assert.match(prompt, /Never invent a formulation/);
  assert.match(prompt, /ask for the ingredient list/);
  assert.match(prompt, /40 to 60 words/);
  assert.match(prompt, /medical history/);
  assert.match(prompt, /not a guarantee of safety/);
});

test('mock mode saves the fixed unknown result and returns it', async () => {
  const store = { rows: [], nextId: 1 };
  const outcome = await analyzeProduct(
    { inputType: 'product', userInput: '  Example Gentle Body Wash  ', extra: 'ignored' },
    { aiMode: () => 'mock', isProduction: false, hasDatabase: false, save: localSave(store) },
  );
  assert.equal(outcome.status, 200);
  assert.deepEqual(outcome.body, {
    id: 1,
    inputType: 'product',
    userInput: 'Example Gentle Body Wash',
    status: 'unknown',
    headline: 'Live ingredient check is off',
    explanation: MOCK_EXPLANATION,
    flaggedIngredients: [],
  });
  assert.equal(store.rows[0].result, 'unknown');
  assert.equal(store.rows[0].user_input, 'Example Gentle Body Wash');
  assert.equal(typeof store.rows[0].response_time_ms, 'number');
});

test('invalid analyze requests are rejected and nothing is saved', async () => {
  let saved = false;
  const save = async () => {
    saved = true;
    return 1;
  };
  const blank = await analyzeProduct(
    { inputType: 'ingredients', userInput: '   ' },
    { aiMode: () => 'mock', save },
  );
  assert.equal(blank.status, 400);
  assert.deepEqual(blank.body, { error: 'Type a product name or ingredient list first.' });
  const badType = await analyzeProduct(
    { inputType: 'formula', userInput: 'Example Wash' },
    { aiMode: () => 'mock', save },
  );
  assert.equal(badType.status, 400);
  assert.equal(badType.body.error, 'inputType must be "product" or "ingredients".');
  assert.equal(saved, false);
});

test('personal details are redacted before save and in the response', async () => {
  const store = { rows: [], nextId: 1 };
  const outcome = await analyzeProduct(
    { inputType: 'ingredients', userInput: 'Water, Glycerin, Fragrance, maria@example.com, 312-555-0199' },
    { aiMode: () => 'mock', isProduction: false, hasDatabase: false, save: localSave(store) },
  );
  assert.equal(outcome.status, 200);
  assert.equal(outcome.body.userInput.includes('maria@example.com'), false);
  assert.equal(outcome.body.userInput.includes('312-555-0199'), false);
  assert.ok(outcome.body.userInput.includes('[email removed]'));
  assert.ok(outcome.body.userInput.includes('[phone removed]'));
  assert.ok(outcome.body.userInput.includes('Glycerin'));
  assert.equal(store.rows[0].user_input, outcome.body.userInput);
});

test('ordinary ingredient wording is still assessed in mock mode', async () => {
  const outcome = await analyzeProduct(
    { inputType: 'ingredients', userInput: 'Water, Glycerin, Sodium Lauryl Sulfate, Fragrance' },
    { aiMode: () => 'mock', isProduction: false, hasDatabase: false, save: async () => 4 },
  );
  assert.equal(outcome.status, 200);
  assert.equal(outcome.body.status, 'unknown');
  assert.equal(outcome.body.userInput, 'Water, Glycerin, Sodium Lauryl Sulfate, Fragrance');
});

test('a failed save does not return an assessment or an id', async () => {
  const outcome = await analyzeProduct(
    { inputType: 'product', userInput: 'Example Gentle Body Wash' },
    {
      aiMode: () => 'mock',
      isProduction: false,
      hasDatabase: false,
      save: async () => {
        throw new Error('insert failed');
      },
    },
  );
  assert.equal(outcome.status, 500);
  assert.deepEqual(outcome.body, { error: 'The assessment was not saved. Try again when the database is available.' });
});

test('production does not call the model when the database is unavailable', async () => {
  let modelCalled = false;
  let saved = false;
  const model = {
    withStructuredOutput() {
      modelCalled = true;
      throw new Error('model should not be called');
    },
  };
  const missing = await analyzeProduct(
    { inputType: 'product', userInput: 'Example Gentle Body Wash' },
    { aiMode: () => 'live', isProduction: true, hasDatabase: false, model, save: async () => { saved = true; return 1; } },
  );
  assert.equal(missing.status, 503);
  assert.deepEqual(missing.body, { error: 'The database is unavailable, so this check cannot be saved.' });

  const down = await analyzeProduct(
    { inputType: 'product', userInput: 'Example Gentle Body Wash' },
    {
      aiMode: () => 'live',
      isProduction: true,
      hasDatabase: true,
      model,
      probeDatabase: async () => {
        throw new Error('connection refused');
      },
      save: async () => { saved = true; return 1; },
    },
  );
  assert.equal(down.status, 503);
  assert.equal(down.body.error, 'The database is unavailable, so this check cannot be saved.');
  assert.equal(modelCalled, false);
  assert.equal(saved, false);
});

test('live mode parses structured output and saves that result', async () => {
  let sawSchema = false;
  const model = {
    withStructuredOutput(schema) {
      sawSchema = schema === AnalyzeAssessment;
      return {
        async invoke(messages) {
          assert.match(String(messages[0].content), /educational information from an AI/);
          assert.match(String(messages[1].content), /inputType: ingredients/);
          assert.match(String(messages[1].content), /\[email removed\]/);
          return {
            status: 'caution',
            headline: 'Fragrance may irritate',
            explanation: 'The pasted list includes fragrance, which is often flagged for sensitive skin. This is an ingredient-based observation, not a promise of safety.',
            flaggedIngredients: ['Fragrance'],
          };
        },
      };
    },
  };
  let saved = null;
  const outcome = await analyzeProduct(
    { inputType: 'ingredients', userInput: 'Water, Fragrance, maria@example.com' },
    {
      aiMode: () => 'live',
      isProduction: false,
      hasDatabase: true,
      model,
      save: async (check) => {
        saved = check;
        return '12';
      },
    },
  );
  assert.equal(sawSchema, true);
  assert.equal(outcome.status, 200);
  assert.equal(outcome.body.id, 12);
  assert.equal(outcome.body.status, 'caution');
  assert.deepEqual(outcome.body.flaggedIngredients, ['Fragrance']);
  assert.equal(saved.userInput.includes('maria@example.com'), false);
  assert.equal(typeof saved.responseTimeMs, 'number');
});

test('invalid structured output and provider failures are not saved', async () => {
  let saved = false;
  const save = async () => {
    saved = true;
    return 1;
  };
  const badShape = {
    withStructuredOutput() {
      return { async invoke() { return { status: 'safe', headline: 'Looks fine', explanation: 'No.', flaggedIngredients: [] }; } };
    },
  };
  const format = await analyzeProduct(
    { inputType: 'product', userInput: 'Example Wash' },
    { aiMode: () => 'live', isProduction: false, hasDatabase: false, model: badShape, save },
  );
  assert.equal(format.status, 502);
  assert.deepEqual(format.body, { error: 'The AI result did not match the expected assessment format.' });

  const rateLimited = {
    withStructuredOutput() {
      return {
        async invoke() {
          const err = new Error('quota exceeded');
          err.status = 429;
          throw err;
        },
      };
    },
  };
  const provider = await analyzeProduct(
    { inputType: 'product', userInput: 'Example Wash' },
    { aiMode: () => 'live', isProduction: false, hasDatabase: false, model: rateLimited, save },
  );
  assert.equal(provider.status, 502);
  assert.equal(provider.body.error, 'Too many requests. Free Gemini keys have a rate limit, so wait a minute.');

  const zodFailure = {
    withStructuredOutput() {
      return { async invoke() { throw new ZodError([]); } };
    },
  };
  const parsed = await analyzeProduct(
    { inputType: 'product', userInput: 'Example Wash' },
    { aiMode: () => 'live', isProduction: false, hasDatabase: false, model: zodFailure, save },
  );
  assert.equal(parsed.status, 502);
  assert.equal(parsed.body.error, 'The AI result did not match the expected assessment format.');
  assert.equal(saved, false);
});

test('POST /api/analyze rejects a blank body', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', api);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ inputType: 'product', userInput: ' ' }),
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.error, 'Type a product name or ingredient list first.');
    assert.equal(Object.hasOwn(body, 'id'), false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
