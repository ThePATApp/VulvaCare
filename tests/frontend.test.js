import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkerReducer,
  countSubmittedIngredients,
  flaggedNames,
  getStatusMeta,
  inferInputType,
  initialCheckerState,
  isLongInput,
  validateUserInput,
} from '../src/lib/vulvacare.js';
import { api } from '../src/api.js';
import { MOCK_ASSESSMENT, mockAnalyze } from '../src/lib/mockAnalyze.js';

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

test('mock analyze echoes the exact submission and a fixed unknown sample', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('mock analyze must not call the network');
  };

  const product = 'Example Product';
  const ingredients = 'Water, Glycerin, Fragrance';
  const longList = `${SAMPLE_14}\n${'A very long ingredient name that should stay intact, '.repeat(8)}`;
  const padded = '  Example Product  \n';

  try {
    const productResult = await mockAnalyze({ userInput: product, inputType: 'product' }, { delayMs: 0 });
    assert.equal(productResult.originalInput, product);
    assert.equal(productResult.status, 'unknown');
    assert.equal(productResult.headline, MOCK_ASSESSMENT.headline);
    assert.equal(productResult.explanation, MOCK_ASSESSMENT.explanation);
    assert.deepEqual(productResult.flaggedIngredients, []);

    const listResult = await mockAnalyze({ userInput: ingredients, inputType: 'ingredients' }, { delayMs: 0 });
    assert.equal(listResult.originalInput, ingredients);

    const multiline = await mockAnalyze({ userInput: SAMPLE_14, inputType: 'ingredients' }, { delayMs: 0 });
    assert.equal(multiline.originalInput, SAMPLE_14);

    const longer = await mockAnalyze({ userInput: longList, inputType: 'ingredients' }, { delayMs: 0 });
    assert.equal(longer.originalInput, longList);

    const exact = await mockAnalyze({ userInput: padded, inputType: 'product' }, { delayMs: 0 });
    assert.equal(exact.originalInput, padded);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('whitespace-only input is rejected before a mock request', () => {
  assert.equal(validateUserInput('').ok, false);
  assert.equal(validateUserInput('   \n\t  ').ok, false);
  const kept = '  Example Product';
  const validation = validateUserInput(kept);
  assert.equal(validation.ok, true);
  assert.notEqual(validation.userInput, kept);
});

test('a mock success keeps the echoed original text and reset clears it', () => {
  let state = checkerReducer(initialCheckerState, { type: 'set_draft', draft: SAMPLE_14 });
  state = checkerReducer(state, {
    type: 'analyze_start',
    originalInput: SAMPLE_14,
    inputType: 'ingredients',
  });
  state = checkerReducer(state, { type: 'set_expanded', expanded: true });
  state = checkerReducer(state, {
    type: 'analyze_success',
    result: {
      originalInput: SAMPLE_14,
      status: 'unknown',
      headline: 'Mock assessment',
      explanation: MOCK_ASSESSMENT.explanation,
      flaggedIngredients: [],
    },
  });
  assert.equal(state.originalInput, SAMPLE_14);
  assert.equal(state.inputExpanded, true);

  state = checkerReducer(state, { type: 'reset' });
  assert.equal(state.draft, '');
  assert.equal(state.originalInput, '');
  assert.equal(state.result, null);
  assert.equal(state.inputExpanded, false);
  assert.equal(state.phase, 'idle');
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
