import 'dotenv/config';
import pg from 'pg';
import { config } from '../config.js';

// Restaurant analogy: the pantry. One shared connection pool for the whole server.
// If there is no DATABASE_URL yet, the app falls back to an in-memory list
// (see resources.js) so it still runs. Create the database in Replit to keep data.
export const hasDatabase = Boolean(config.databaseUrl);

export const pool = hasDatabase ? new pg.Pool({ connectionString: config.databaseUrl, max: 5 }) : null;

export async function query(text, params = []) {
  if (!pool) throw new Error('No DATABASE_URL. Create a database in Replit (Tools > Database).');
  return pool.query(text, params);
}
