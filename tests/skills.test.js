import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSkills, parseSkill, publicSkills } from '../server/agent/skills.js';

test('every skill folder has a valid SKILL.md', async () => {
  const skills = await loadSkills();
  assert.equal(skills.size, 6);
  for (const skill of skills.values()) {
    assert.ok(skill.description.length > 20, `${skill.name} needs a real description`);
    assert.ok(skill.body.length > 50, `${skill.name} needs instructions`);
  }
});

test('the router can choose 4 skills (guardrail and router stay behind the scenes)', async () => {
  const names = publicSkills(await loadSkills()).map((s) => s.name).sort();
  assert.deepEqual(names, ['action-plan-builder', 'plain-language-explainer', 'resource-finder', 'translator']);
});

test('the skill checker catches common mistakes', () => {
  assert.throws(() => parseSkill('no frontmatter', 'x'), /frontmatter/);
  assert.throws(() => parseSkill('---\nname: My Skill\ndescription: d\n---\nbody', 'my-skill'), /lowercase/);
  assert.throws(() => parseSkill('---\nname: other\ndescription: d\n---\nbody', 'my-skill'), /match the folder/);
  assert.throws(() => parseSkill('---\nname: my-skill\n---\nbody', 'my-skill'), /description/);
});
