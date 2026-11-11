import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { saveProductCheck } from '../server/db/product-checks.js';

const sample = {
  inputType: 'ingredients',
  userInput: 'Water, Glycerin, [email removed]',
  status: 'caution',
  headline: 'Fragrance may irritate',
  explanation: 'These ingredients include fragrance, which is often flagged for sensitive skin.',
  flaggedIngredients: ['Fragrance'],
  responseTimeMs: 42,
};

function emptyStore() {
  return { rows: [], nextId: 1 };
}

test('schema.sql creates product_checks without changing the starter tables', async () => {
  const sql = await readFile(new URL('../server/db/schema.sql', import.meta.url), 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS resources/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS chat_logs/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS product_checks/);
  assert.match(sql, /id\s+BIGSERIAL PRIMARY KEY/);
  assert.match(sql, /user_input\s+TEXT NOT NULL/);
  assert.match(sql, /result\s+VARCHAR\(20\) NOT NULL/);
  assert.match(sql, /flagged_ingredients\s+JSONB NOT NULL DEFAULT '\[\]'::jsonb/);
  assert.match(sql, /survey_answer\s+VARCHAR\(10\)/);
  assert.match(sql, /response_time_ms\s+INTEGER/);
});

test('a local save without a database stores the check and returns a numeric id', async () => {
  const store = emptyStore();
  const options = { hasDatabase: false, isProduction: false, store };

  const id = await saveProductCheck(sample, options);

  assert.equal(typeof id, 'number');
  assert.equal(Number.isSafeInteger(id), true);
  assert.equal(id, 1);
  assert.equal(store.rows.length, 1);
  assert.equal(store.rows[0].id, 1);
  assert.equal(store.rows[0].input_type, 'ingredients');
  assert.equal(store.rows[0].user_input, 'Water, Glycerin, [email removed]');
  assert.equal(store.rows[0].result, 'caution');
  assert.equal(store.rows[0].headline, sample.headline);
  assert.equal(store.rows[0].explanation, sample.explanation);
  assert.deepEqual(store.rows[0].flagged_ingredients, ['Fragrance']);
  assert.equal(store.rows[0].survey_answer, null);
  assert.equal(store.rows[0].response_time_ms, 42);
  assert.equal(typeof store.rows[0].created_at, 'string');
});

test('multiple saved checks get distinct numeric ids', async () => {
  const store = emptyStore();
  const options = { hasDatabase: false, isProduction: false, store };
  const first = await saveProductCheck(sample, options);
  const second = await saveProductCheck({ ...sample, status: 'unknown', flaggedIngredients: [] }, options);
  assert.equal(first, 1);
  assert.equal(second, 2);
  assert.notEqual(first, second);
  assert.equal(store.rows[1].result, 'unknown');
  assert.deepEqual(store.rows[1].flagged_ingredients, []);
});

test('production without a database does not fall back to memory', async () => {
  const store = emptyStore();
  await assert.rejects(
    () => saveProductCheck(sample, { hasDatabase: false, isProduction: true, store }),
    /No DATABASE_URL/,
  );
  assert.equal(store.rows.length, 0);
});

test('a configured database is used, and a failed write is not saved in memory', async () => {
  const store = emptyStore();
  let sql = '';
  let params = [];
  const id = await saveProductCheck(sample, {
    hasDatabase: true,
    isProduction: true,
    store,
    query: async (text, values) => {
      sql = text;
      params = values;
      return { rows: [{ id: '15' }] };
    },
  });

  assert.equal(id, 15);
  assert.equal(store.rows.length, 0);
  assert.match(sql, /\$1/);
  assert.equal(sql.includes(sample.userInput), false);
  assert.deepEqual(params, [
    'ingredients',
    'Water, Glycerin, [email removed]',
    'caution',
    sample.headline,
    sample.explanation,
    '["Fragrance"]',
    42,
  ]);

  await assert.rejects(
    () => saveProductCheck(sample, {
      hasDatabase: true,
      isProduction: false,
      store,
      query: async () => {
        throw new Error('connection refused');
      },
    }),
    /connection refused/,
  );
  assert.equal(store.rows.length, 0);

  await assert.rejects(
    () => saveProductCheck(sample, {
      hasDatabase: true,
      isProduction: true,
      store,
      query: async () => ({ rows: [{ id: '9007199254740993' }] }),
    }),
    /safe JSON number/,
  );
  assert.equal(store.rows.length, 0);
});
