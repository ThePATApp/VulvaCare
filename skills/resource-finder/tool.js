import { searchResourcesForAgent } from '../../server/db/resources.js';

// The skill's equipment: look up real rows in Postgres before the AI writes anything.
export async function run({ message }) {
  const matches = await searchResourcesForAgent(message, 5);
  if (!matches.length) {
    return { context: 'Database results: none found.', data: [] };
  }
  const lines = matches.map(
    (r) => `- ${r.name} (${r.category}, ${r.neighborhood}): ${r.description} Hours: ${r.hours}. Phone: ${r.phone}. Languages: ${r.languages}.`,
  );
  return { context: `Database results:\n${lines.join('\n')}`, data: matches };
}
