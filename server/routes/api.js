import { Router } from 'express';
import { aiMode, config } from '../config.js';
import { hasDatabase } from '../db/pool.js';
import { CATEGORIES } from '../db/seed-data.js';
import { addResource, listResources } from '../db/resources.js';
import { runAgent } from '../agent/agent.js';
import { loadSkills } from '../agent/skills.js';
import { friendlyAiError } from '../ai/model.js';
import { ChatRequest, NewResource, ResourceQuery, firstError } from '../validation.js';

// Restaurant analogy: the waiter's routes. Every path here starts with /api.
export const api = Router();

// GET /api/health: is everything plugged in?
api.get('/health', (_req, res) => {
  res.json({ ok: true, ai: aiMode(), model: config.model, database: hasDatabase ? 'postgres' : 'memory' });
});

// GET /api/skills: the agent's skills, for the Skills panel
api.get('/skills', async (_req, res) => {
  const skills = await loadSkills();
  res.json({
    skills: [...skills.values()].map((s) => ({ name: s.name, description: s.description, hasTool: Boolean(s.tool) })),
  });
});

// POST /api/chat: ask the agent
api.post('/chat', async (req, res) => {
  const parsed = ChatRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: firstError(parsed) });
    return;
  }
  try {
    res.json(await runAgent(parsed.data));
  } catch (err) {
    console.error('[chat]', err);
    res.status(502).json({ error: friendlyAiError(err) });
  }
});

// GET /api/resources?search=food&category=Food
api.get('/resources', async (req, res) => {
  const parsed = ResourceQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: firstError(parsed) });
    return;
  }
  try {
    res.json({ resources: await listResources(parsed.data), categories: CATEGORIES });
  } catch (err) {
    console.error('[resources]', err);
    res.status(500).json({ error: 'Could not read the database.' });
  }
});

// POST /api/resources: add one
api.post('/resources', async (req, res) => {
  const parsed = NewResource.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: firstError(parsed) });
    return;
  }
  try {
    res.status(201).json({ resource: await addResource(parsed.data) });
  } catch (err) {
    console.error('[resources]', err);
    res.status(500).json({ error: 'Could not save to the database.' });
  }
});
