import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { hasDatabase, pool, query } from './pool.js';
import { seedResources } from './seed-data.js';

const SCHEMA_PATH = fileURLToPath(new URL('./schema.sql', import.meta.url));

// Creates the tables (if missing) and adds the sample data (if the table is empty).
// Runs on every server start, so a brand-new Replit database "just works".
export async function setupDatabase({ log = console.log } = {}) {
  if (!hasDatabase) {
    log('[db] No DATABASE_URL yet. Using in-memory sample data. Create a database in Replit to save data.');
    return { mode: 'memory' };
  }

  await query(await readFile(SCHEMA_PATH, 'utf8'));

  const { rows } = await query('SELECT COUNT(*)::int AS count FROM resources');
  if (rows[0].count === 0) {
    for (const item of seedResources) {
      await query(
        `INSERT INTO resources (name, category, description, neighborhood, address, phone, website, hours, languages)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [item.name, item.category, item.description, item.neighborhood, item.address, item.phone, item.website, item.hours, item.languages],
      );
    }
    log(`[db] Added ${seedResources.length} sample resources.`);
  }
  log('[db] Postgres is ready.');
  return { mode: 'postgres' };
}

// `npm run db:setup` runs this file directly.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  setupDatabase()
    .then(() => pool?.end())
    .catch((err) => {
      console.error('[db] Setup failed:', err.message);
      process.exit(1);
    });
}
