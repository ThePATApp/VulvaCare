import { z } from 'zod';
import { CATEGORIES } from './db/seed-data.js';

// Every request is checked with zod .safeParse() BEFORE we touch the AI or the database.
// Restaurant analogy: the order ticket must be filled out correctly before the kitchen cooks.

export const ChatRequest = z.object({
  message: z.string().trim().min(1, 'Type a question first.').max(2000, 'Keep questions under 2000 characters.'),
  skill: z.string().regex(/^(auto|[a-z0-9-]+)$/).optional(),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().max(4000) }))
    .max(12)
    .optional(),
});

const optionalText = (max) => z.string().trim().max(max).optional().default('');

export const NewResource = z.object({
  name: z.string().trim().min(2, 'Name is required.').max(120),
  category: z.enum(CATEGORIES, { message: `Category must be one of: ${CATEGORIES.join(', ')}` }),
  description: z.string().trim().min(5, 'Add a short description.').max(500),
  neighborhood: optionalText(80),
  address: optionalText(160),
  phone: optionalText(40),
  website: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === '' || /^https?:\/\/\S+\.\S+/.test(v), 'Website must start with http:// or https://')
    .optional()
    .default(''),
  hours: optionalText(120),
  languages: z.string().trim().max(120).optional().default('English'),
});

export const ResourceQuery = z.object({
  search: z.string().trim().max(100).optional().default(''),
  category: z.union([z.literal(''), z.enum(CATEGORIES)]).optional().default(''),
});

// Turn zod's error into one friendly sentence.
export const firstError = (result) => result.error.issues[0]?.message ?? 'Invalid request.';
