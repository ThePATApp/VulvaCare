import { hasDatabase, query } from './pool.js';
import { seedResources } from './seed-data.js';

// All the ways the app reads and writes resources.
// Each function works with Postgres, or with an in-memory list when there is no database yet.

const memory = seedResources.map((item, i) => ({ id: i + 1, ...item, created_at: new Date().toISOString() }));
const memoryLogs = [];

const COLUMNS = 'id, name, category, description, neighborhood, address, phone, website, hours, languages, created_at';

export async function listResources({ search = '', category = '', limit = 50 } = {}) {
  if (!hasDatabase) {
    const words = search.toLowerCase().split(/\s+/).filter(Boolean);
    return memory
      .filter((row) => !category || row.category === category)
      .filter((row) => {
        if (!words.length) return true;
        const haystack = `${row.name} ${row.category} ${row.description} ${row.neighborhood}`.toLowerCase();
        return words.some((w) => haystack.includes(w));
      })
      .slice(0, limit);
  }

  // $1, $2, $3 are placeholders. pg fills them in safely, which blocks SQL injection.
  // Never glue user text straight into a SQL string.
  const { rows } = await query(
    `SELECT ${COLUMNS}
       FROM resources
      WHERE ($1 = '' OR category = $1)
        AND ($2 = '' OR (name || ' ' || category || ' ' || description || ' ' || neighborhood) ILIKE '%' || $2 || '%')
      ORDER BY category, name
      LIMIT $3`,
    [category, search.trim(), limit],
  );
  return rows;
}

// Used by the resource-finder skill: match ANY meaningful word in the question.
export async function searchResourcesForAgent(question, limit = 5) {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  if (!hasDatabase) {
    const scored = memory
      .map((row) => {
        const haystack = `${row.name} ${row.category} ${row.description} ${row.neighborhood}`.toLowerCase();
        return { row, score: words.filter((w) => haystack.includes(w)).length };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((x) => x.row);
  }

  if (!words.length) return [];
  const { rows } = await query(
    `SELECT ${COLUMNS},
            (SELECT COUNT(*) FROM unnest($1::text[]) AS w
              WHERE (name || ' ' || category || ' ' || description || ' ' || neighborhood) ILIKE '%' || w || '%') AS score
       FROM resources
      ORDER BY score DESC, name
      LIMIT $2`,
    [words, limit * 2],
  );
  return rows.filter((row) => Number(row.score) > 0).slice(0, limit);
}

export async function addResource(data) {
  if (!hasDatabase) {
    const row = { id: memory.length + 1, ...data, created_at: new Date().toISOString() };
    memory.push(row);
    return row;
  }
  const { rows } = await query(
    `INSERT INTO resources (name, category, description, neighborhood, address, phone, website, hours, languages)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${COLUMNS}`,
    [data.name, data.category, data.description, data.neighborhood, data.address, data.phone, data.website, data.hours, data.languages],
  );
  return rows[0];
}

export async function logChat({ skill, routedBy, flags }) {
  if (!hasDatabase) {
    memoryLogs.push({ skill, routedBy, flags, created_at: new Date().toISOString() });
    return;
  }
  await query('INSERT INTO chat_logs (skill, routed_by, flags) VALUES ($1, $2, $3)', [skill, routedBy, flags]);
}

const STOP_WORDS = new Set([
  'what', 'where', 'when', 'which', 'with', 'that', 'this', 'there', 'have', 'need', 'help', 'find',
  'about', 'near', 'from', 'your', 'some', 'free', 'want', 'does', 'they', 'them', 'would', 'could',
  'please', 'know', 'like', 'just', 'good', 'place', 'places', 'anything', 'something',
]);
