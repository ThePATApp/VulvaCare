import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redactPii, run } from '../skills/safety-guardrail/tool.js';

test('removes phone, email, and SSN before the AI sees them', () => {
  const out = run({ message: 'Call me at 312-555-0199 or maria@example.com, SSN 123-45-6789' });
  assert.ok(!out.redacted.includes('555-0199'));
  assert.ok(!out.redacted.includes('maria@example.com'));
  assert.ok(!out.redacted.includes('123-45-6789'));
  assert.ok(out.flags.includes('pii-removed'));
});

test('flags crisis, medical, and legal topics', () => {
  assert.ok(run({ message: 'I want to hurt myself' }).flags.includes('crisis'));
  assert.ok(run({ message: 'what dose of medicine for a fever' }).flags.includes('medical'));
  assert.ok(run({ message: 'my landlord wants to evict us' }).flags.includes('legal'));
});

test('leaves normal questions alone', () => {
  const out = run({ message: 'Where can my kids get homework help?' });
  assert.equal(out.redacted, 'Where can my kids get homework help?');
  assert.deepEqual(out.flags, []);
});

test('redactPii removes email, phone, SSN, and card numbers', () => {
  const text = 'Email maria@example.com, phone 312-555-0199, SSN 123-45-6789, card 4111 1111 1111 1111';
  const redacted = redactPii(text);
  assert.equal(typeof redacted, 'string');
  assert.equal(redacted.includes('maria@example.com'), false);
  assert.equal(redacted.includes('312-555-0199'), false);
  assert.equal(redacted.includes('123-45-6789'), false);
  assert.equal(redacted.includes('4111 1111 1111 1111'), false);
  assert.ok(redacted.includes('[email removed]'));
  assert.ok(redacted.includes('[phone removed]'));
  assert.ok(redacted.includes('[SSN removed]'));
  assert.ok(redacted.includes('[card number removed]'));
});

test('redactPii leaves ingredient text and does not classify topics', () => {
  const ingredients = 'Water, Glycerin, Sodium Lauryl Sulfate, Fragrance';
  assert.equal(redactPii(ingredients), ingredients);
  const care = 'Gentle vulvar wash with fragrance. A doctor might call this a symptom, but the label says glycerin.';
  const redacted = redactPii(care);
  assert.equal(redacted, care);
  assert.equal(typeof redacted, 'string');
  const chat = run({ message: care });
  assert.ok(chat.flags.includes('medical'));
  assert.equal(chat.redacted, care);
});
