import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { FeedbackRequest, firstError } from '../server/validation.js';
import { saveProductCheck, saveProductFeedback } from '../server/db/product-checks.js';
import { api } from '../server/routes/api.js';

function memoryOptions(store) {
  return { hasDatabase: false, isProduction: false, store };
}

async function savedCheck(store) {
  const id = await saveProductCheck({
    inputType: 'ingredients',
    userInput: 'Water, Glycerin',
    status: 'lower_concern',
    headline: 'Simple ingredients',
    explanation: 'These ingredients do not stand out in this educational check.',
    flaggedIngredients: [],
    responseTimeMs: 12,
  }, memoryOptions(store));
  return id;
}

test('feedback requires a numeric id and a boolean answer', () => {
  assert.equal(
    firstError(FeedbackRequest.safeParse({ id: '101', helpful: true })),
    'Choose yes or no for an existing check.',
  );
  assert.equal(
    firstError(FeedbackRequest.safeParse({ id: 101 })),
    'Choose yes or no for an existing check.',
  );
  assert.equal(FeedbackRequest.safeParse({ id: 0, helpful: true }).success, false);
  assert.equal(FeedbackRequest.safeParse({ id: 1.5, helpful: false }).success, false);
  const good = FeedbackRequest.safeParse({ id: 101, helpful: false, extra: true });
  assert.equal(good.success, true);
  assert.deepEqual(good.data, { id: 101, helpful: false });
});

test('memory feedback stores yes or no and a later vote replaces it', async () => {
  const store = { rows: [], nextId: 1 };
  const id = await savedCheck(store);
  const yes = await saveProductFeedback({ id, helpful: true }, memoryOptions(store));
  assert.deepEqual(yes, { id, helpful: true });
  assert.equal(store.rows[0].survey_answer, 'yes');
  assert.equal(store.rows[0].result, 'lower_concern');
  assert.equal(store.rows[0].user_input, 'Water, Glycerin');

  const no = await saveProductFeedback({ id, helpful: false }, memoryOptions(store));
  assert.deepEqual(no, { id, helpful: false });
  assert.equal(store.rows[0].survey_answer, 'no');
  assert.equal(store.rows.length, 1);
});

test('feedback does not create a row for a missing id', async () => {
  const store = { rows: [], nextId: 1 };
  await assert.rejects(
    () => saveProductFeedback({ id: 4, helpful: true }, memoryOptions(store)),
    (err) => err.code === 'FEEDBACK_NOT_FOUND',
  );
  assert.equal(store.rows.length, 0);
});

test('production without a database does not save feedback in memory', async () => {
  const store = { rows: [], nextId: 1 };
  const id = await savedCheck(store);
  await assert.rejects(
    () => saveProductFeedback({ id, helpful: true }, { hasDatabase: false, isProduction: true, store }),
    (err) => err.code === 'FEEDBACK_DB',
  );
  assert.equal(store.rows[0].survey_answer, null);
});

test('a database failure is not treated as a saved vote', async () => {
  const store = { rows: [], nextId: 1 };
  await savedCheck(store);
  let sql = '';
  let params = [];
  await assert.rejects(
    () => saveProductFeedback({ id: 1, helpful: true }, {
      hasDatabase: true,
      isProduction: true,
      store,
      query: async () => {
        throw new Error('connection refused');
      },
    }),
    (err) => err.code === 'FEEDBACK_DB',
  );
  assert.equal(store.rows[0].survey_answer, null);

  const saved = await saveProductFeedback({ id: 1, helpful: false }, {
    hasDatabase: true,
    isProduction: false,
    store,
    query: async (text, values) => {
      sql = text;
      params = values;
      return { rows: [{ id: '1', survey_answer: 'no' }] };
    },
  });
  assert.deepEqual(saved, { id: 1, helpful: false });
  assert.match(sql, /SET survey_answer = \$2/);
  assert.deepEqual(params, [1, 'no']);
  assert.equal(store.rows[0].survey_answer, null);

  await assert.rejects(
    () => saveProductFeedback({ id: 99, helpful: true }, {
      hasDatabase: true,
      isProduction: false,
      store,
      query: async () => ({ rows: [] }),
    }),
    (err) => err.code === 'FEEDBACK_NOT_FOUND',
  );
});

test('POST /api/feedback rejects an invalid body', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', api);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/feedback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: '101', helpful: true }),
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.deepEqual(body, { error: 'Choose yes or no for an existing check.' });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
