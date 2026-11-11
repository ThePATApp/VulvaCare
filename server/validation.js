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

const INPUT_TYPE_MESSAGE = 'inputType must be "product" or "ingredients".';
const USER_INPUT_MESSAGE = 'Type a product name or ingredient list first.';
const STATUS_MESSAGE = 'Status must be lower_concern, caution, or unknown.';

// POST /api/analyze body. Extra keys are stripped, not rejected.
export const AnalyzeRequest = z.object({
  inputType: z.enum(['product', 'ingredients'], { message: INPUT_TYPE_MESSAGE }),
  userInput: z
    .string({ required_error: USER_INPUT_MESSAGE, invalid_type_error: USER_INPUT_MESSAGE })
    .trim()
    .min(1, USER_INPUT_MESSAGE)
    .max(5000, 'Keep the product name or ingredient list under 5000 characters.'),
});

const flaggedIngredient = z
  .string()
  .trim()
  .min(1, 'Each flagged ingredient needs a name.')
  .max(120, 'Each flagged ingredient must be 120 characters or fewer.');

// Gemini structured assessment. Word count is a prompt target, not a Zod rule.
// unknown and lower_concern list no ingredients. caution lists at least one.
export const AnalyzeAssessment = z
  .object({
    status: z.enum(['lower_concern', 'caution', 'unknown'], { message: STATUS_MESSAGE }),
    headline: z
      .string()
      .trim()
      .min(1, 'Headline is required.')
      .max(140, 'Headline must be 140 characters or fewer.')
      .refine((value) => !/[\r\n]/.test(value), 'Headline must be one short line.'),
    explanation: z
      .string()
      .trim()
      .min(1, 'Explanation is required.')
      .max(600, 'Explanation must be 600 characters or fewer.'),
    flaggedIngredients: z.array(flaggedIngredient).max(30, 'Flag at most 30 ingredients.'),
  })
  .superRefine((value, ctx) => {
    const flagged = value.flaggedIngredients.length > 0;
    if (value.status === 'caution' && !flagged) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['flaggedIngredients'],
        message: 'A caution result must list the flagged ingredients.',
      });
    }
    if (value.status !== 'caution' && flagged) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['flaggedIngredients'],
        message: 'Only a caution result can list flagged ingredients.',
      });
    }
  });

const FEEDBACK_MESSAGE = 'Choose yes or no for an existing check.';

// POST /api/feedback body. id must be a JSON number, not a numeric string.
export const FeedbackRequest = z.object({
  id: z
    .number({ required_error: FEEDBACK_MESSAGE, invalid_type_error: FEEDBACK_MESSAGE })
    .int(FEEDBACK_MESSAGE)
    .positive(FEEDBACK_MESSAGE),
  helpful: z.boolean({ required_error: FEEDBACK_MESSAGE, invalid_type_error: FEEDBACK_MESSAGE }),
});

// Turn zod's error into one friendly sentence.
export const firstError = (result) => result.error.issues[0]?.message ?? 'Invalid request.';
