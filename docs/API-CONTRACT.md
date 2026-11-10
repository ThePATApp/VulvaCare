# VulvaCare API contract

Source of truth for `POST /api/analyze` and `POST /api/feedback`. Product rules live in [`SPEC.md`](../SPEC.md). Ticket workflow lives in [`SPEC-DRIVEN-DEVELOPMENT.md`](SPEC-DRIVEN-DEVELOPMENT.md).

This contract adds two routes to the existing Express router. It does not replace the starter routes.

The examples below show shape. Status, headline, explanation, and flagged ingredients in a live success response must come from the Zod-validated Gemini result. Do not hard-code the sample headline as the real assessment.

---

## What already exists

| Piece | Where | How VulvaCare uses it |
|---|---|---|
| Router mounted at `/api` | `server/index.js`, `server/routes/api.js` | Add the two routes on the same router |
| Fetch wrapper | `src/api.js` `request()` | Add `analyze` and `feedback` methods. Failed responses throw `Error` with `data.error` |
| Zod and `firstError()` | `server/validation.js` | Add request and model-output schemas. Keep `.safeParse()` before any model or SQL call |
| Gemini client | `server/ai/model.js` `getModel()`, `friendlyAiError()` | Server-side only. Structured output uses the same `withStructuredOutput` + `schema.parse` pattern as `server/agent/router.js` |
| Live vs mock | `server/config.js` `aiMode()` | Mock must not invent a formulation |
| SQL | `server/db/pool.js` `query(text, params)` | Placeholders `$1`, `$2`, … |
| Memory fallback | `server/db/resources.js` | In-memory product checks are for local development and for mock mode outside production only. Production must not use this fallback |
| PII redaction | `skills/safety-guardrail/tool.js` PII patterns | Reuse email, phone, SSN, and card-like redaction before Gemini and before insert. Do not run the chat medical/crisis topic workflow on ordinary ingredient text |
| JSON errors | Existing routes | `{ "error": "one sentence" }` with 400, 404, 500, or 502 |
| Starter routes that stay | `GET /api/health`, `GET /api/skills`, `POST /api/chat`, `GET /api/resources`, `POST /api/resources` | Unchanged by this contract |

Unknown `/api/*` paths already return `404` with `{ "error": "No such API route." }`.

Chat and ingredient checking are different flows.

- `POST /api/chat` runs the five-step agent in `server/agent/agent.js` and returns `{ reply, skill, routedBy, flags, mode, sources }`.
- `POST /api/analyze` returns the assessment object in this document.
- Do not send ingredient checks through `resource-finder`, the chat reply field, or the chat agent's medical/crisis classification workflow.
- Reuse the guardrail's PII redaction. Leave `TOPIC_RULES` (medical, legal, crisis) on the chat path. Normal ingredient terminology must not block `POST /api/analyze`.

`server/db/schema.sql` currently creates `resources` and `chat_logs` only. `product_checks` is specified here and is not created yet.

---

## Shared types

### `inputType`

Allowed values:

- `product` — the text is a product name
- `ingredients` — the text is a pasted ingredient list

Any other value is a validation error.

### `status`

Allowed values, stored in the database column `result`:

| API `status` | Meaning |
|---|---|
| `lower_concern` | Checked ingredients do not stand out for common vulvar irritation. This is not a statement that the product is safe. |
| `caution` | One or more checked ingredients are associated with irritation or are commonly flagged for sensitive vulvar or mucosal skin. |
| `unknown` | The product formula could not be verified, the text is too vague, or the model is not confident. |

### `flaggedIngredients`

A JSON array of strings. Each string is an ingredient name.

- Use `[]` when nothing is flagged.
- `unknown` results use `[]`.
- `caution` lists only ingredients that were in the pasted list, or that belong to a formula the model can actually support.
- Do not add ingredients to fill the array.

The database column is `flagged_ingredients` (`JSONB`).

### Helpful vs survey answer

The API speaks boolean. The database stores a short string.

| Request field `helpful` | Column `survey_answer` |
|---|---|
| not sent yet | `NULL` |
| `true` | `yes` |
| `false` | `no` |

The analyze response does not include the survey field. The feedback response uses `helpful` as a boolean, not `yes` / `no`.

---

## `POST /api/analyze`

Asks Gemini for one structured educational assessment. A success response means that assessment was also persisted. A valid model result that was not saved is an error.

The frontend keeps the original `userInput` in session state and displays that original. The backend redacts identifying information before Gemini. The database stores the redacted text in `user_input`. The response field `userInput` is that same redacted text. It is not a promise that the database holds the exact original submission.

### Request

```json
{
  "inputType": "product",
  "userInput": "Example Gentle Body Wash"
}
```

Ingredient-list example:

```json
{
  "inputType": "ingredients",
  "userInput": "Water, Glycerin, Sodium Lauryl Sulfate, Fragrance"
}
```

### Validation

Checked with Zod `.safeParse()` before the model and before SQL.

| Field | Rule |
|---|---|
| `inputType` | Required. Exactly `product` or `ingredients` |
| `userInput` | Required string. Trimmed. Length 1 to 5,000 characters after trim |
| Extra fields | Ignored |

Failure returns `400` and creates no row:

```json
{ "error": "Type a product name or ingredient list first." }
```

Use a specific Zod message for each failed field. `firstError()` already turns the first issue into the `error` string.

### Server steps

1. Validate the body.
2. If this process is production (`config.isProduction`, `NODE_ENV=production`) and Postgres is not available, stop. Return the database error below. Do not call Gemini and do not write to memory.
3. Redact identifying information with the PII patterns from `skills/safety-guardrail/tool.js` (email, phone, SSN, card-like numbers). Do not run `TOPIC_RULES` and do not call `runAgent`. Ingredient names and other ordinary label language stay in the text and do not block the assessment.
4. The redacted text is what Gemini sees and what will be stored. The original unredacted submission is not written to `user_input`.
5. If `aiMode()` is `mock`, skip Gemini and use the fixed unknown result below. Do not invent ingredients or a formulation.
6. If `aiMode()` is `live`, call `getModel()` with structured output and a Zod schema for `status`, `headline`, `explanation`, and `flaggedIngredients`. Parse again with `schema.parse` before trusting the object. The prompt must include the assessment rules in `SPEC.md` Part B section 7, including the educational-only disclaimer and the ban on invented formulas.
7. Measure elapsed milliseconds for `response_time_ms`.
8. Persist one `product_checks` row. Only after that write succeeds, return `200` and the public response. The returned `id` is the new row's id as a JSON number.

If structured output is missing a field, has a status outside the three allowed values, or fails Zod, return `502` and insert nothing. The model did not produce a usable analysis.

If the model result is valid and the write then fails, return the save error below and no `id`. The AI analysis and the persisted record are different steps. The client treats only `200` with an `id` as saved.

### Success response

`200` with:

```json
{
  "id": 101,
  "inputType": "product",
  "userInput": "Example Gentle Body Wash",
  "status": "unknown",
  "headline": "Formulation could not be verified",
  "explanation": "Please provide the ingredient list for a more reliable assessment.",
  "flaggedIngredients": []
}
```

| Field | Rule |
|---|---|
| `id` | JSON number. PostgreSQL `BIGSERIAL` may come back from `node-pg` as a string; convert it to a number before `res.json` |
| `inputType` | Echo the validated input type |
| `userInput` | Redacted text that was sent to the model and stored. The page displays the original from session state, not this field and not a database read |
| `status` | Validated model status, or `unknown` in mock mode |
| `headline` | Short single line from the model. Zod maximum: 140 characters |
| `explanation` | Non-empty string from the model. Prompt target: 40–60 words. Zod maximum: 600 characters |
| `flaggedIngredients` | Array of strings. Zod maximum: 30 items, each at most 120 characters |

The explanation word count is a generation target. A result that is slightly outside 40–60 words still succeeds if it passes Zod. Rejecting a good assessment only because it is 38 or 70 words would hide the result from the user.

`response_time_ms` is stored and is not part of this response.

### Mock mode

When `aiMode()` is `mock`, do not call Gemini and do not invent ingredients or a formula. After the fixed result is persisted, return `unknown`:

```json
{
  "id": 1,
  "inputType": "product",
  "userInput": "Example Gentle Body Wash",
  "status": "unknown",
  "headline": "Live ingredient check is off",
  "explanation": "This preview cannot verify a formulation or judge ingredients. Add a Gemini key for a real educational assessment, or paste an ingredient list once the live check is on.",
  "flaggedIngredients": []
}
```

`userInput` in this body is the redacted text that was stored. `inputType` is the validated type. The headline and explanation stay fixed. `flaggedIngredients` stays empty. The page still shows the person's original text from session state.

On a deployed Replit app, this mock result is still stored in PostgreSQL. Local development may store it in memory when Postgres is not configured. Production does not.

### Educational disclaimer

The result screen always tells the person this is educational information from an AI, not a medical diagnosis, and not a guarantee of safety. That notice is product copy. It is not produced by routing the submission through the chat guardrail's medical flag.

### Crisis responses

Ordinary analyze requests are not classified with the community-resource medical or crisis workflow. `TOPIC_RULES` in `skills/safety-guardrail/tool.js` stay on `POST /api/chat`. An ingredient list is not refused, rewritten, or turned into a crisis reply because it contains normal ingredient language.

A crisis response does not create a `product_checks` record. If one is returned, it has no `id` and no assessment fields:

```json
{
  "crisis": true,
  "message": "I'm really glad you reached out, and I want you to get help from a person right now. If you are in immediate danger, call 911. You can call or text 988 (the Suicide & Crisis Lifeline) any time, day or night. I'm an AI and can't help with this safely, but they can."
}
```

`message` stays aligned with `CRISIS_REPLY` in `skills/safety-guardrail/tool.js`. The frontend shows `message` and does not show a product status. This shape is not the result of running the chat classifier on a product name or an ingredient list.

### Analyze errors

| Situation | HTTP | Body | What succeeded |
|---|---|---|---|
| Zod validation failed | 400 | `{ "error": "<first Zod message>" }` | Nothing. No model call, no row |
| Production database unavailable before the model call | 503 | `{ "error": "The database is unavailable, so this check cannot be saved." }` | Nothing. No model call, no memory row |
| Gemini key rejected, rate limit, or model missing | 502 | `{ "error": "<friendlyAiError message>" }` | Nothing stored. No usable analysis |
| Structured output failed Zod | 502 | `{ "error": "The AI result did not match the expected assessment format." }` | Nothing stored. The model reply was not a valid analysis |
| Valid analysis, then the save failed | 500 | `{ "error": "The assessment was not saved. Try again when the database is available." }` | The model result was valid. No row. The response has no `id` |
| Crisis response | 200 | `{ "crisis": true, "message": "..." }` | No `product_checks` row |

`200` with an `id` is the only response that means both "the analysis is usable" and "the record was persisted." A 500 after a valid model result must not include the assessment body, because that would look like a saved check.

No assessment row means feedback has nothing to update.

---

## `POST /api/feedback`

Stores the Yes/No answer on an existing product check.

### Request

```json
{
  "id": 101,
  "helpful": true
}
```

`helpful: false` maps to survey answer `no`.

### Validation

| Field | Rule |
|---|---|
| `id` | Required JSON number, integer, greater than 0 |
| `helpful` | Required boolean |

Failure returns `400`:

```json
{ "error": "Choose yes or no for an existing check." }
```

A numeric string such as `"101"` is invalid. The analyze response provides a JSON number; send that number back.

### Success response

`200` with the boolean form, after the update:

```json
{
  "id": 101,
  "helpful": true
}
```

Behavior:

- Update only `survey_answer` on the row with that `id`.
- Set `yes` when `helpful` is `true`, and `no` when `helpful` is `false`.
- A second vote for the same id replaces the previous value.
- Do not create a row from feedback.
- Do not change `result`, headline, explanation, or ingredients.

### Feedback errors

| Situation | HTTP | Body |
|---|---|---|
| Zod validation failed | 400 | `{ "error": "<first Zod message>" }` |
| No row with that id | 404 | `{ "error": "No matching check was found." }` |
| Database read or update failed, or production has no working database | 500 | `{ "error": "Could not save feedback." }` |

---

## Database

One new table, `product_checks`. Add it in a later ticket at the bottom of `server/db/schema.sql`. Do not drop `resources` or `chat_logs`.

```sql
CREATE TABLE IF NOT EXISTS product_checks (
  id                  BIGSERIAL PRIMARY KEY,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  input_type          VARCHAR(20) NOT NULL,
  user_input          TEXT NOT NULL,
  result              VARCHAR(20) NOT NULL,
  headline            TEXT NOT NULL,
  explanation         TEXT NOT NULL,
  flagged_ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  survey_answer       VARCHAR(10),
  response_time_ms    INTEGER
);
```

Column notes:

| Column | Contents |
|---|---|
| `id` | Primary key returned to the client as a JSON number |
| `created_at` | Set by the database. Not returned by the MVP API |
| `input_type` | `product` or `ingredients` |
| `user_input` | Redacted product name or ingredient list only. Not the exact original submission when identifying details were removed. Not a user profile. The page does not read this column to display what the person typed |
| `result` | API `status`: `lower_concern`, `caution`, or `unknown` |
| `headline` | Model headline, or the fixed mock headline |
| `explanation` | Model explanation, or the fixed mock explanation |
| `flagged_ingredients` | JSON array of strings |
| `survey_answer` | `NULL`, `yes`, or `no` |
| `response_time_ms` | Server timing for the check. Null is allowed by the column; the analyze path should set it |

Insert and update with parameter placeholders:

```sql
INSERT INTO product_checks
  (input_type, user_input, result, headline, explanation, flagged_ingredients, response_time_ms)
VALUES
  ($1, $2, $3, $4, $5, $6::jsonb, $7)
RETURNING id;
```

```sql
UPDATE product_checks
   SET survey_answer = $2
 WHERE id = $1
RETURNING id, survey_answer;
```

`$2` for the update is `yes` or `no`, chosen in application code from the boolean. Do not write the boolean into SQL as text the user typed.

Persistence depends on where the app is running.

| Environment | Where a successful check is stored |
|---|---|
| Local development, Postgres configured | PostgreSQL |
| Local development, no `DATABASE_URL` | In-memory list, same idea as `server/db/resources.js`. The list is cleared on restart |
| Mock mode outside production, no `DATABASE_URL` | That same in-memory list |
| Deployed Replit app (`NODE_ENV=production`) | PostgreSQL only |

Production must have a working `DATABASE_URL`. If the pool is missing or a production query fails, return the errors in the analyze table. Do not catch that failure and write to memory, and do not return an `id` for a check that exists only in memory.

The in-memory row uses the same fields, including redacted `user_input`, and assigns incrementing numeric ids. Feedback updates that in-memory row only when the analyze response was served from it. In production, feedback updates PostgreSQL or returns an error.

Put the queries in a new server database module next to `server/db/resources.js`. Leave resource queries in `resources.js`.

---

## Frontend and backend integration

The browser never calls Gemini and never sees `GEMINI_API_KEY`.

Planned `src/api.js` methods, using the existing `request()` helper:

```js
analyze: (body) => request('/analyze', { method: 'POST', body }),
feedback: (body) => request('/feedback', { method: 'POST', body }),
```

`request()` already:

- POSTs JSON to `/api` + path
- parses the JSON body
- throws `new Error(data.error)` when the HTTP status is not ok

UI flow for a later ticket:

1. Keep the original `inputType` and `userInput` in session state, then call `api.analyze` with that original text.
2. If the body has `crisis: true`, show `message` only. There is no `id` to vote on.
3. Otherwise keep showing the original submission from session state. Show `status`, `headline`, `explanation`, and `flaggedIngredients` from the response, with the educational disclaimer. Do not replace the displayed submission with `response.userInput` or with `user_input` from the database.
4. Keep `id` in component state. That `id` means the redacted check was persisted.
5. If the person taps Yes or No, call `api.feedback({ id, helpful })`. A later vote for the same `id` replaces the previous one.
6. Show the thrown `Error` message for 400, 404, 500, 502, and 503. A save error means the analysis was not stored, even if the model had produced a result.

`src/App.jsx` currently loads health and skills and renders the starter panels (`ProjectHeader`, `StartHere`, `ChatPanel`, `ResourceBoard`, `SkillsPanel`). The VulvaCare UI is new work. Until that ticket, those panels stay.

Suggested status labels on the page:

| `status` | Label |
|---|---|
| `lower_concern` | Lower concern |
| `caution` | Caution |
| `unknown` | Unknown |

The label is display copy. The stored and returned value remains the snake-case status.

---

## Prompt contract for the live model

The analyze system prompt must tell Gemini all of the following:

- Return only the structured fields. No markdown and no extra keys that fail the schema.
- Use only `lower_concern`, `caution`, and `unknown`.
- Target 40–60 words in `explanation`. Keep `headline` to one short line.
- Never say the product is safe, guaranteed safe, risk-free, or clinically approved.
- Never invent a formulation or an ingredient.
- If `inputType` is `product` and a real formulation cannot be verified, return `unknown`, `flaggedIngredients: []`, and ask for the ingredient list.
- If `inputType` is `ingredients`, base the assessment on the pasted list and say that it is an ingredient-based observation.
- If `inputType` is `product` and a formula is used, say that the observation is about that product's listed ingredients.
- Do not diagnose, prescribe, or ask for name, contact information, location, age, symptoms, or history.
- This is educational information, not medical advice.
- Assess ordinary ingredient language. Do not refuse a list because a word would have tripped the chat medical or crisis classifier.

Validate the object with Zod after the call. The database and the HTTP response both use that validated object, not the raw model text.

---

## Implementation order

Do this in later tickets. This document does not authorize those edits by itself.

1. Zod schemas in `server/validation.js` for the analyze request, the feedback request, and the model result.
2. `product_checks` table in `server/db/schema.sql`, plus parameterized insert and update.
3. `POST /api/analyze` and `POST /api/feedback` in `server/routes/api.js`.
4. `analyze` and `feedback` in `src/api.js`.
5. VulvaCare form and result UI.
6. Tests that cover validation, the unknown-product rule, the yes/no mapping, and mock mode, without a live key.
