import { z } from 'zod';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { publicSkills } from './skills.js';

// The router asks the AI to pick a skill, and zod forces the answer into a known shape.

export function makeRouteSchema(skillNames) {
  return z.object({
    skill: z.enum(skillNames).describe('the one skill that should answer'),
    reason: z.string().describe('one short sentence explaining the choice'),
  });
}

export async function routeWithAi({ message, skills, model }) {
  const choices = publicSkills(skills);
  const schema = makeRouteSchema(choices.map((s) => s.name));
  const routerSkill = skills.get('intent-router');
  const menu = choices.map((s) => `- ${s.name}: ${s.description}`).join('\n');

  const result = await model.withStructuredOutput(schema).invoke([
    new SystemMessage(`${routerSkill.body}\n\n## Skills you can choose\n${menu}`),
    new HumanMessage(message),
  ]);
  return schema.parse(result); // double-check the shape before we trust it
}

// No AI needed: simple keyword rules. Used in mock mode or if the AI router fails.
const RULES = [
  { skill: 'translator', pattern: /\b(translate|translation|in spanish|in english|en español|in polish|in arabic|in chinese)\b/i },
  { skill: 'plain-language-explainer', pattern: /\b(what does .* mean|explain|simplify|plain language|confus\w*|don't understand|letter|notice|form)\b/i },
  { skill: 'action-plan-builder', pattern: /\b(what should i do|where do i start|next steps?|plan|how do i|steps)\b/i },
  { skill: 'resource-finder', pattern: /\b(where|find|near|nearby|program|pantry|food|clinic|shelter|tutor|job|camp|class|free)\b/i },
];

export function routeWithRules(message, skills) {
  for (const rule of RULES) {
    if (rule.pattern.test(message) && skills.has(rule.skill)) {
      return { skill: rule.skill, reason: 'Matched a keyword rule.' };
    }
  }
  return { skill: 'resource-finder', reason: 'Default skill.' };
}
