import { readdir, readFile, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

// Loads every skills/<name>/SKILL.md (and optional tool.js).
// The format follows the open Agent Skills spec, so Replit Agent and other tools can read them too.

export const SKILLS_DIR = fileURLToPath(new URL('../../skills/', import.meta.url));
const NAME_RULE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function parseSkill(text, folder) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`skills/${folder}/SKILL.md must start with --- frontmatter ---`);
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  if (!meta.name || !NAME_RULE.test(meta.name)) {
    throw new Error(`skills/${folder}: "name" must be lowercase words joined by hyphens`);
  }
  if (meta.name !== folder) throw new Error(`skills/${folder}: name "${meta.name}" must match the folder name`);
  if (!meta.description) throw new Error(`skills/${folder}: add a "description" (what it does AND when to use it)`);
  if (meta.description.length > 1024) throw new Error(`skills/${folder}: description must be 1024 characters or fewer`);
  return { name: meta.name, description: meta.description, body: match[2].trim() };
}

let cache = null;

export async function loadSkills(dir = SKILLS_DIR) {
  if (cache && dir === SKILLS_DIR) return cache;
  const skills = new Map();
  const folders = (await readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  for (const folder of folders) {
    const skill = parseSkill(await readFile(path.join(dir, folder, 'SKILL.md'), 'utf8'), folder);
    const toolPath = path.join(dir, folder, 'tool.js');
    skill.tool = (await exists(toolPath)) ? await import(pathToFileURL(toolPath).href) : null;
    skills.set(skill.name, skill);
  }
  if (dir === SKILLS_DIR) cache = skills;
  return skills;
}

// Skills the router may choose (the guardrail and router are behind the scenes).
export const INTERNAL_SKILLS = new Set(['safety-guardrail', 'intent-router']);

export function publicSkills(skills) {
  return [...skills.values()].filter((s) => !INTERNAL_SKILLS.has(s.name));
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}
