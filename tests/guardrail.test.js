import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../skills/safety-guardrail/tool.js';

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
