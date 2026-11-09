import { test } from 'node:test';
import assert from 'node:assert/strict';

// Runs the whole agent loop with no API key and no database (mock mode + sample data).
process.env.AI_MODE = 'mock';
delete process.env.DATABASE_URL;
const { runAgent } = await import('../server/agent/agent.js');
const { routeWithRules } = await import('../server/agent/router.js');
const { loadSkills } = await import('../server/agent/skills.js');

test('keyword routing picks a sensible skill', async () => {
  const skills = await loadSkills();
  assert.equal(routeWithRules('Can you translate this into Spanish?', skills).skill, 'translator');
  assert.equal(routeWithRules('What does this letter mean?', skills).skill, 'plain-language-explainer');
  assert.equal(routeWithRules('What should I do next?', skills).skill, 'action-plan-builder');
  assert.equal(routeWithRules('Where is a food pantry?', skills).skill, 'resource-finder');
});

test('resource-finder searches the database before answering', async () => {
  const out = await runAgent({ message: 'Where can my kids get homework help?' });
  assert.equal(out.skill, 'resource-finder');
  assert.ok(out.sources.some((s) => s.name === 'Bright Futures After School'));
});

test('a chosen skill wins over the router', async () => {
  const out = await runAgent({ message: 'Where is food?', skill: 'translator' });
  assert.equal(out.skill, 'translator');
  assert.equal(out.routedBy, 'visitor');
});

test('crisis messages skip the AI and show emergency numbers', async () => {
  const out = await runAgent({ message: 'I want to end my life' });
  assert.equal(out.skill, 'safety-guardrail');
  assert.match(out.reply, /988/);
});

test('ticket 001: a question with no match finds nothing in the database', async () => {
  const out = await runAgent({ message: 'Where can I adopt a puppy?' });
  assert.equal(out.skill, 'resource-finder');
  assert.equal(out.sources.length, 0);
});

test('docs Scenario Outline: auto mode picks these skills', async () => {
  const skills = await loadSkills();
  const cases = {
    'Where is a free clinic?': 'resource-finder',
    'What does this eviction notice mean?': 'plain-language-explainer',
    'Translate "the pantry opens at 9" to Spanish': 'translator',
    'My power got shut off, what should I do?': 'action-plan-builder',
  };
  for (const [message, skill] of Object.entries(cases)) assert.equal(routeWithRules(message, skills).skill, skill, message);
});
