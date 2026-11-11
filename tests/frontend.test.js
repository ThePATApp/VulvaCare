import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ANALYZE_ERROR_FALLBACK,
  canSubmit,
  checkerReducer,
  countSubmittedIngredients,
  createRequestGuard,
  flaggedNames,
  getStatusMeta,
  inferInputType,
  initialCheckerState,
  interpretAssessment,
  isLongInput,
  prepareAnalyzeRequest,
  validateUserInput,
} from '../src/lib/vulvacare.js';
import { api } from '../src/api.js';

const SAMPLE_14 = `Rayon
Purified cotton
Polypropylene
Polyethylene
Polyester
Ethoxylated fatty acid esters
Glycerin
PEG-100 stearate
Paraffin wax
Carnauba wax
Cotton or polyester sewing thread
Colorants
Plastic
Cardboard`;

test('product names and ingredient lists map to the API inputType values', () => {
  assert.equal(inferInputType('Example Gentle Body Wash'), 'product');
  assert.equal(inferInputType('Water, Glycerin, Fragrance'), 'ingredients');
  assert.equal(inferInputType(SAMPLE_14), 'ingredients');
  assert.equal(inferInputType('Water\nGlycerin\nFragrance'), 'ingredients');
});

test('client validation matches the documented analyze limits', () => {
  assert.equal(validateUserInput('   ').ok, false);
  assert.match(validateUserInput('').error, /product name or ingredient list first/);
  assert.equal(validateUserInput('Wash').ok, true);
  assert.equal(validateUserInput('a'.repeat(5000)).ok, true);
  assert.equal(validateUserInput('a'.repeat(5001)).ok, false);
});

test('flagged ingredient names are strings and omit empty or malformed entries', () => {
  assert.deepEqual(flaggedNames([]), []);
  assert.deepEqual(flaggedNames(['Fragrance', 'SLS']), ['Fragrance', 'SLS']);
  assert.deepEqual(flaggedNames(['ok', '', null, { name: 'skip objects' }, 4]), ['ok']);
  assert.deepEqual(flaggedNames(undefined), []);
});

test('status mapping covers caution, lower_concern, unknown, and unexpected values', () => {
  assert.equal(getStatusMeta('caution').label, 'Caution');
  assert.equal(getStatusMeta('caution').className, 'caution');
  assert.equal(getStatusMeta('lower_concern').label, 'Lower concern');
  assert.equal(getStatusMeta('unknown').label, 'Unknown');
  assert.equal(getStatusMeta('mystery').unexpected, true);
});

test('long original input is detected for a 14-item list and a much longer list', () => {
  assert.equal(isLongInput('Short wash'), false);
  assert.equal(isLongInput(SAMPLE_14), true);
  assert.equal(isLongInput(Array.from({ length: 50 }, (_, i) => `Ingredient ${i + 1}`).join('\n')), true);
  assert.equal(countSubmittedIngredients(SAMPLE_14, 'ingredients'), 14);
  assert.equal(countSubmittedIngredients('Mystery Wash', 'product'), null);
});

test('loading, error, success, feedback, and reset states clear stale results', () => {
  let state = checkerReducer(initialCheckerState, { type: 'set_draft', draft: 'Wash' });
  state = checkerReducer(state, {
    type: 'analyze_start',
    originalInput: 'Wash',
    inputType: 'product',
  });
  assert.equal(state.phase, 'loading');
  assert.equal(state.result, null);

  state = checkerReducer(state, {
    type: 'analyze_success',
    result: { id: 1, status: 'unknown', headline: 'H', explanation: 'E', flaggedIngredients: [] },
  });
  assert.equal(state.phase, 'success');

  state = checkerReducer(state, { type: 'feedback_start', helpful: true });
  state = checkerReducer(state, { type: 'feedback_success', helpful: true });
  assert.equal(state.feedbackStatus, 'success');
  assert.equal(state.feedbackValue, true);

  state = checkerReducer(state, { type: 'feedback_start', helpful: false });
  state = checkerReducer(state, { type: 'feedback_error', error: 'Could not save feedback.' });
  assert.equal(state.result.id, 1);
  assert.equal(state.feedbackStatus, 'error');

  state = checkerReducer(state, {
    type: 'analyze_start',
    originalInput: 'Another',
    inputType: 'product',
  });
  assert.equal(state.result, null);
  assert.equal(state.feedbackStatus, 'idle');

  state = checkerReducer(state, {
    type: 'analyze_error',
    error: 'The AI result did not match the expected assessment format.',
  });
  assert.equal(state.phase, 'error');
  assert.match(state.error, /did not match/);

  state = checkerReducer(state, { type: 'reset' });
  assert.deepEqual(state, initialCheckerState);
  assert.equal(state.draft, '');
  assert.equal(state.inputExpanded, false);
});

function jsonResponse(body, ok = true, status = ok ? 200 : 400) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

test('product and multiline submissions post the analyze contract and keep the original text', async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    const sent = calls.at(-1).body;
    return jsonResponse({
      id: calls.length,
      inputType: sent.inputType,
      userInput: sent.userInput.trim(),
      status: 'unknown',
      headline: 'Formulation could not be verified',
      explanation: 'Please provide the ingredient list for a more reliable assessment.',
      flaggedIngredients: [],
    });
  };

  try {
    const product = 'Example Gentle Body Wash';
    const productRequest = prepareAnalyzeRequest(product);
    assert.equal(productRequest.ok, true);
    assert.deepEqual(productRequest.body, { inputType: 'product', userInput: product });
    const productData = await api.analyze(productRequest.body);
    const productView = interpretAssessment(productData);
    assert.equal(productView.kind, 'success');
    assert.equal(productView.result.status, 'unknown');
    assert.deepEqual(productView.result.flaggedIngredients, []);

    let state = checkerReducer(initialCheckerState, { type: 'set_draft', draft: product });
    state = checkerReducer(state, {
      type: 'analyze_start',
      originalInput: productRequest.originalInput,
      inputType: productRequest.inputType,
    });
    state = checkerReducer(state, { type: 'analyze_success', result: productView.result });
    assert.equal(state.originalInput, product);
    assert.equal(state.phase, 'success');

    const padded = '  Example Gentle Body Wash  \n';
    const exact = prepareAnalyzeRequest(padded);
    assert.equal(exact.body.userInput, padded);
    await api.analyze(exact.body);
    state = checkerReducer(state, { type: 'set_draft', draft: padded });
    state = checkerReducer(state, {
      type: 'analyze_start',
      originalInput: exact.originalInput,
      inputType: exact.inputType,
    });
    state = checkerReducer(state, {
      type: 'analyze_success',
      result: {
        ...interpretAssessment({
          id: 9,
          status: 'unknown',
          headline: 'Saved',
          explanation: 'Educational only.',
          flaggedIngredients: [],
          userInput: padded.trim(),
        }).result,
      },
    });
    assert.equal(state.originalInput, padded);

    const listRequest = prepareAnalyzeRequest(SAMPLE_14);
    assert.equal(listRequest.body.inputType, 'ingredients');
    assert.equal(listRequest.body.userInput, SAMPLE_14);
    const listData = await api.analyze(listRequest.body);
    assert.equal(listData.inputType, 'ingredients');
    assert.equal(calls[0].url, '/api/analyze');
    assert.equal(calls[2].url, '/api/analyze');
    assert.equal(calls[2].body.userInput, SAMPLE_14);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('caution, lower concern, unknown, and an empty flag list map onto the existing result', () => {
  const caution = interpretAssessment({
    id: 3,
    inputType: 'ingredients',
    status: 'caution',
    headline: 'Potential irritation concerns',
    explanation: 'Two ingredients are commonly flagged for sensitive skin.',
    flaggedIngredients: ['Ethoxylated fatty acid esters', 'Colorants'],
  });
  assert.equal(caution.kind, 'success');
  assert.equal(getStatusMeta(caution.result.status).className, 'caution');
  assert.deepEqual(flaggedNames(caution.result.flaggedIngredients), [
    'Ethoxylated fatty acid esters',
    'Colorants',
  ]);

  const lower = interpretAssessment({
    id: 4,
    status: 'lower_concern',
    headline: 'Nothing stood out',
    explanation: 'This is not a statement that the product is safe.',
    flaggedIngredients: [],
  });
  assert.equal(lower.kind, 'success');
  assert.equal(getStatusMeta(lower.result.status).label, 'Lower concern');
  assert.deepEqual(flaggedNames(lower.result.flaggedIngredients), []);

  const unknown = interpretAssessment({
    id: 5,
    status: 'unknown',
    headline: 'Formulation could not be verified',
    explanation: 'Please provide the ingredient list for a more reliable assessment.',
    flaggedIngredients: [],
  });
  assert.equal(unknown.kind, 'success');
  assert.equal(unknown.unexpected, false);
  assert.equal(getStatusMeta(unknown.result.status).className, 'unknown');
  assert.equal(flaggedNames(unknown.result.flaggedIngredients).length, 0);

  const malformed = interpretAssessment({
    id: 6,
    status: 'caution',
    headline: 'Check',
    explanation: 'Names only.',
    flaggedIngredients: ['Glycerin', { name: 'ignore objects' }, '', 4],
  });
  assert.deepEqual(flaggedNames(malformed.result.flaggedIngredients), ['Glycerin']);
});

test('whitespace-only input is rejected before a mock request', () => {
  assert.equal(validateUserInput('').ok, false);
  assert.equal(validateUserInput('   \n\t  ').ok, false);
  const kept = '  Example Product';
  const validation = validateUserInput(kept);
  assert.equal(validation.ok, true);
  assert.notEqual(validation.userInput, kept);
});

test('loading blocks another submission, errors keep the draft, and reset clears the check', () => {
  const guard = createRequestGuard();
  const draft = `  ${SAMPLE_14}`;
  const prepared = prepareAnalyzeRequest(draft);
  let state = checkerReducer(initialCheckerState, { type: 'set_draft', draft });
  assert.equal(canSubmit(state.phase), true);

  const first = guard.begin();
  state = checkerReducer(state, {
    type: 'analyze_start',
    originalInput: prepared.originalInput,
    inputType: prepared.inputType,
  });
  assert.equal(state.phase, 'loading');
  assert.equal(state.result, null);
  assert.equal(canSubmit(state.phase), false);
  assert.equal(guard.begin(), null);

  state = checkerReducer(state, {
    type: 'analyze_error',
    error: 'The assessment was not saved. Try again when the database is available.',
  });
  guard.settle(first);
  assert.equal(state.phase, 'error');
  assert.equal(state.draft, draft);
  assert.equal(state.originalInput, draft);
  assert.equal(state.result, null);
  assert.equal(canSubmit(state.phase), true);
  assert.equal(typeof guard.begin(), 'number');

  state = checkerReducer(state, { type: 'reset' });
  assert.deepEqual(state, initialCheckerState);
});

test('an older analyze response cannot replace the latest result', async () => {
  const guard = createRequestGuard();
  let releaseFirst;
  const firstDone = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push(body.userInput);
    if (body.userInput === 'First Product') await firstDone;
    return jsonResponse({
      id: body.userInput === 'First Product' ? 1 : 2,
      inputType: 'product',
      userInput: body.userInput,
      status: 'unknown',
      headline: body.userInput,
      explanation: 'Educational only.',
      flaggedIngredients: [],
    });
  };

  try {
    const older = prepareAnalyzeRequest('First Product');
    const olderId = guard.begin();
    const olderPromise = api.analyze(older.body);
    guard.invalidate();
    const newer = prepareAnalyzeRequest('Second Product');
    const newerId = guard.begin();
    const newerData = await api.analyze(newer.body);
    assert.equal(guard.isCurrent(olderId), false);
    assert.equal(guard.isCurrent(newerId), true);
    releaseFirst();
    const olderData = await olderPromise;
    assert.equal(guard.isCurrent(olderId), false);
    const applied = guard.isCurrent(newerId)
      ? interpretAssessment(newerData)
      : interpretAssessment(olderData);
    assert.equal(applied.result.id, 2);
    assert.equal(applied.result.headline, 'Second Product');
    assert.deepEqual(calls, ['First Product', 'Second Product']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('a saved assessment id is what feedback posts, and an unsaved result cannot be rated', async () => {
  const saved = interpretAssessment({
    id: 101,
    status: 'lower_concern',
    headline: 'Nothing stood out',
    explanation: 'Not a safety guarantee.',
    flaggedIngredients: [],
  });
  assert.equal(typeof saved.result.id, 'number');

  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return jsonResponse({ id: 101, helpful: true });
  };
  try {
    await api.feedback({ id: saved.result.id, helpful: true });
    assert.equal(calls[0].url, '/api/feedback');
    assert.deepEqual(calls[0].body, { id: 101, helpful: true });
  } finally {
    globalThis.fetch = originalFetch;
  }

  const unsaved = interpretAssessment({
    status: 'unknown',
    headline: 'Missing id',
    explanation: 'Nothing was stored.',
    flaggedIngredients: [],
  });
  assert.equal(unsaved.kind, 'error');
  assert.match(unsaved.error, /incomplete/);
});

test('the production page does not call the frontend mock', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const checker = readFileSync(new URL('../src/components/vulvacare/ProductChecker.jsx', import.meta.url), 'utf8');
  assert.equal(app.includes('mockAnalyze'), false);
  assert.match(app, /api\.analyze\(/);
  assert.equal(checker.includes('We’ll check this as'), false);
  assert.equal(checker.includes('a ingredient list'), false);
  assert.equal(ANALYZE_ERROR_FALLBACK.includes('Gemini'), false);
});

test('analyze and feedback helpers post the documented JSON bodies', async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({ id: 101, helpful: true, status: 'unknown', headline: 'h', explanation: 'e', flaggedIngredients: [] }),
    };
  };

  try {
    const analysis = await api.analyze({
      inputType: 'product',
      userInput: 'Example Gentle Body Wash',
    });
    assert.equal(analysis.id, 101);
    assert.equal(calls[0].url, '/api/analyze');
    assert.equal(calls[0].options.method, 'POST');
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      inputType: 'product',
      userInput: 'Example Gentle Body Wash',
    });

    await api.feedback({ id: 101, helpful: false });
    assert.equal(calls[1].url, '/api/feedback');
    assert.deepEqual(JSON.parse(calls[1].options.body), { id: 101, helpful: false });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('analyze helper surfaces the API error sentence', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ error: 'Type a product name or ingredient list first.' }),
  });
  try {
    await assert.rejects(() => api.analyze({ inputType: 'product', userInput: '' }), {
      message: 'Type a product name or ingredient list first.',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
