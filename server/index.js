import 'dotenv/config';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { config, aiMode } from './config.js';
import { setupDatabase } from './db/setup.js';
import { api } from './routes/api.js';

// =============================================================
// ONE server for everything:
//   /api/*  -> the kitchen (Express routes in routes/api.js)
//   else    -> the dining room (React app in src/)
// In development, Vite serves React with instant reload.
// In production (npm run build, then npm start), Express serves dist/.
// =============================================================

const root = fileURLToPath(new URL('..', import.meta.url));
const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: '100kb' }));
app.use('/api', api);
app.use('/api', (_req, res) => res.status(404).json({ error: 'No such API route.' }));

if (config.isProduction) {
  const dist = path.join(root, 'dist');
  app.use(express.static(dist));
  app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    root,
    server: { middlewareMode: true, hmr: { server } },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

try {
  await setupDatabase();
} catch (err) {
  console.error('[db] Could not set up Postgres:', err.message);
}

server.listen(config.port, '0.0.0.0', () => {
  console.log(`\nCommunity Sprint app running on http://localhost:${config.port}`);
  console.log(`AI: ${aiMode() === 'live' ? `live (${config.model})` : 'mock mode (add GEMINI_API_KEY for real answers)'}`);
});
