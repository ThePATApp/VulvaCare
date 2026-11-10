# SPEC.md: VulvaCare

> Product specification for the VulvaCare MVP. Implementation tickets must follow this file and [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md).
> How the team writes and checks tickets: [`docs/SPEC-DRIVEN-DEVELOPMENT.md`](docs/SPEC-DRIVEN-DEVELOPMENT.md).

VulvaCare is a lean ingredient checker. A person submits a personal care product name or a pasted ingredient list. The server asks Google Gemini for a structured educational assessment, stores that assessment, and shows the result. The person may then answer one question: "Was this information helpful?"

This repository started as the CodeSquad Community Sprint starter (community-resource chat, six agent skills, sample resources). That starter stays in place. VulvaCare adds a product-check flow beside it. Later tickets must not delete the starter routes, skills, or tables unless a ticket explicitly says so.

`shared/project.config.js` still contains the starter placeholders. Filling it in is a later change. This document does not change application code.

---

## PART A: Sprint rules (set by CodeSquad, don't delete)

### A1. Stack
- React (in `src/`) + Node/Express (in `server/`) + Replit PostgreSQL + Gemini through LangChain.
- AI calls happen ONLY on the server (`server/ai/model.js`). Never from React.
- Every agent skill is a folder: `skills/<name>/SKILL.md`, name matches the folder.

### A2. Security
- API keys live in Replit Secrets or `.env`. Never in code, commits, screenshots, or chat.
- `import 'dotenv/config'` is the first line of every server file that reads settings.
- Every request is checked with zod `.safeParse()` before the AI or database is used.
- SQL uses `$1, $2` placeholders. Never glue user text into SQL.

### A3. Responsible AI
- The agent says it is an AI and never poses as a doctor, lawyer, or counselor.
- The `safety-guardrail` skill stays on. Personal info is removed before the AI sees it.
- Facts come from the database or a cited source, or the agent says "I don't know".
- Anything high-stakes gets a path to a real person (phone, website, office).

### A4. Scope
- Two weeks. One core user journey. At most 3 must-have features.
- Live on Replit by demo day, with a backup screen recording.

---

## PART B: VulvaCare

### 1. Team and one-liner

- **Team name:** Not set. `shared/project.config.js` still says `TODO: Team Name`.
- **App name:** VulvaCare
- **One sentence:** We help someone choosing a personal care product check a product name or ingredient list so they get a short, honest, educational read on possible irritation concerns.

### 2. Problem

- **Problem statement:** Ingredient lists on washes, wipes, lubes, and similar products are hard to interpret, and people often cannot tell whether a label is a poor match for sensitive vulvar skin. Guessing, or trusting a tool that invents a formula, can lead to the wrong choice.
- **Theme:** Global Health. This is the closest CodeSquad theme. The app does not collect a city or neighborhood.
- **Evidence it's real:** To be added by the team (a cited source or a conversation with someone affected). Do not invent a statistic in code or in the model prompt.

### 3. User

- **Main user:** An adult shopping for or already using a personal care product who wants a plain-language check of the product name or the ingredient list. The team has not yet chosen a named persona for `shared/project.config.js`.
- **What they do today without our app:** They read a crowded label, search scattered web pages, or ask a clinician. They often cannot tell which ingredients matter for vulvar irritation, and they may not have the full formula in front of them.
- **Device and language:** A phone browser, English for the MVP.

The app must not ask for name, contact details, account, location, age, pregnancy status, symptoms, diagnosis, or medical history.

### 4. Goals

| Goal | How we'll measure it | Target |
|---|---|---|
| A person can submit a product name or an ingredient list and see a structured result | Manual walkthrough of the acceptance scenarios below | The page shows the original text from session state, one allowed status, a headline, an explanation, and any flagged ingredients |
| The result does not overclaim | Review of unknown, unmatched-product, and mock-mode cases | Unmatched product names return `unknown`. Copy never says the product is guaranteed safe or medically approved |
| Helpfulness can be recorded | Submit Yes and No against a saved check | `product_checks.survey_answer` becomes `yes` or `no` for that row |

### 5. Features

Three must-have features. Anything else waits.

| Priority | Feature | Planned ticket | What exists today |
|---|---|---|---|
| Must | Submit a product name or ingredient list and receive a structured Gemini assessment | Next build ticket | Not built. Reuse `getModel()`, zod, and `withStructuredOutput` (see section 12) |
| Must | Show the original submission, status, headline, explanation, and flagged ingredients | UI ticket after the API | Not built. The page keeps the original text in session state. `src/api.js` `request()` is the fetch wrapper to extend |
| Must | Optional "Was this information helpful?" Yes/No, saved on that check | Same API ticket as analyze, or the next one | Not built. New `product_checks.survey_answer` column |
| Not now | Accounts, login, photo of a label, barcode scan | n/a | Do not add |
| Not now | Symptom checker, diagnosis, treatment advice, clinician chat | n/a | Do not add |
| Not now | A database of verified formulations maintained by the team | n/a | Do not add. Unknown product names stay `unknown` |
| Not now | Replacing the starter community-resource chat with VulvaCare | n/a | Leave `POST /api/chat`, resources, and the six skills working |
| Not now | Supabase, a second database, or a second model provider | n/a | Do not add |

### 6. User journey

1. The person opens VulvaCare.
2. They choose one input type: a product name, or a pasted ingredient list.
3. They type or paste the text and submit. The browser keeps that original text in session state.
4. The browser sends `POST /api/analyze` with the original text.
5. The server checks the body with zod, redacts identifying details, and sends only the redacted text to Gemini.
6. The server checks the model result with zod. A success response with an `id` means the redacted check was persisted. A valid model result that was not saved is an error, not a success.
7. The page shows the original text from session state, then the status, headline, explanation, and flagged ingredients. It also shows that this is educational information from an AI, not a medical diagnosis, and not a guarantee of safety. The page does not read `user_input` back from the database to rebuild that submission.
8. The person may tap Yes or No on "Was this information helpful?" The browser sends `POST /api/feedback` with the returned `id`. Skipping the question is allowed.

If the product name cannot be matched to a known formulation, the person sees `unknown` and is asked to paste the ingredient list. The app must not fill in a guessed formula.

### 7. Assessment rules

The model must return only these statuses:

| Status | When to use it |
|---|---|
| `lower_concern` | The assessment is based on ingredients the user pasted, or on a formulation the model can actually support. Nothing in that set stands out for common vulvar irritation in this educational check. |
| `caution` | One or more of those ingredients are associated with irritation or are commonly flagged for sensitive vulvar or mucosal skin. Those ingredients appear in `flaggedIngredients`. |
| `unknown` | The product name cannot be reliably matched, the text is too vague to assess, or the model is not confident. `flaggedIngredients` is empty. |

Rules for every result:

- The tool provides educational information. It does not diagnose a condition, recommend treatment, or tell someone to stop or start a medicine.
- Never say a product is safe, guaranteed safe, doctor-approved, or risk-free. `lower_concern` means "lower concern among the ingredients that were actually checked," and the headline and explanation must say that plainly.
- Never invent a product formulation or an ingredient that was not supplied and cannot be tied to a verified formula.
- If `inputType` is `product` and the formulation cannot be verified, return `unknown`, an empty `flaggedIngredients` array, and an explanation that asks for the ingredient list.
- Separate ingredient-based observations from product-specific facts. For a pasted list, speak about those ingredients. For a product name, claim a product-specific formula only when it can be verified; otherwise use `unknown`.
- The headline is one short line. The explanation targets 40–60 words and must be at most 600 characters.
- Do not request personal identifiers, location, or medical history. If the model starts to ask for them, that result is invalid.
- Every result screen states that the check is educational information, not a diagnosis and not a promise of safety.
- Ordinary product names and ingredient lists are assessed directly. They are not accepted or rejected by the community-resource chat classifier for medical or crisis topics. Normal ingredient wording must not block a result.
- Identifying details are redacted before Gemini sees the text. A crisis response, if one is ever returned, does not create a `product_checks` row. That rule is not a reason to run ingredient text through the chat topic workflow.

### 8. Agent and skills

VulvaCare's checker is a structured Gemini call, not a turn through the community-resource chat.

- **Voice:** Plain-spoken, calm, and specific. Short sentences. About a 6th-grade reading level, matching the starter agent setting. The assistant is an AI, not a clinician.
- **Starter skills we keep:** All six (`safety-guardrail`, `intent-router`, `resource-finder`, `plain-language-explainer`, `translator`, `action-plan-builder`). They keep serving `POST /api/chat`.
- **What the checker reuses from the agent stack:** the PII redaction patterns in `safety-guardrail`'s `tool.js` (email, phone, SSN, and card-like numbers), and the structured-output pattern in `server/agent/router.js`. It does not reuse the chat path that flags medical or crisis topics and appends a note to a free-text reply.
- **New skill:** Optional later. The MVP may call `getModel().withStructuredOutput(...)` from the analyze route without a new `skills/` folder. Add a skill only if a ticket needs the chat agent to run the same check.
- **The checker must never:** invent a formula; claim guaranteed safety; diagnose; ask for identity, location, or medical history; present community-resource search hits as ingredient evidence; store phone numbers, emails, or ID numbers.

`resource-finder` searches the `resources` table. It is the wrong tool for ingredient checks. Do not route `POST /api/analyze` through it.

### 9. Data

| Table | What's in it | Where the data comes from | Who keeps it up to date |
|---|---|---|---|
| `product_checks` | One saved check: input type, redacted `user_input`, status, headline, explanation, flagged ingredients, optional survey answer, response time | `POST /api/analyze` inserts a row only after the assessment is valid. `POST /api/feedback` updates `survey_answer` | The application. No admin editor in the MVP |
| `resources` | Starter community listings | Existing seed and `POST /api/resources` | Leave as-is until a separate ticket |
| `chat_logs` | Which chat skill answered. The starter does not store the chat message | Existing agent loop | Leave as-is |

`product_checks` is specified in [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md). It is not in `server/db/schema.sql` yet. A later ticket adds the `CREATE TABLE`. This spec does not.

`chat_logs` intentionally omits what the person typed. `product_checks.user_input` stores the redacted product name or ingredient list. It does not store the exact original submission when identifying details were removed. The page shows the original from its own session state, so it does not need the database to hold that original.

Two different successes:

- **AI analysis succeeded** when mock mode built the fixed `unknown` result, or when live Gemini output passed Zod.
- **Record persisted** when that result was written to Postgres, or, in local development and mock mode only, to the in-memory list.

A response with an `id` means both happened. On a deployed Replit app, the write must be PostgreSQL. If that database is unavailable, the API returns an error and does not use memory in its place.

The API field `status` is stored in the column `result`. The API boolean `helpful` is stored as `yes` or `no` in `survey_answer`. Details are in the API contract.

### 10. Privacy and governance

- **What the person sees:** The frontend keeps the original submission in session state and displays that original. It does not replace it with the stored `user_input`.
- **What Gemini sees:** The backend redacts identifying information first, then sends the redacted text.
- **What the database stores:** `user_input` is the redacted version. The database does not keep a second copy of the exact original submission.
- **Personal info the form asks for:** None. No name, contact details, account, location, age, pregnancy status, symptoms, diagnosis, or medical history. Redaction covers identifying details someone pastes anyway.
- **How we protect it:** Zod limits the payload. Analyze reuses the PII patterns from `safety-guardrail` (email, phone, SSN, card-like numbers). It does not run the chat medical/crisis classifier on ordinary ingredient text. SQL parameters only. Secrets stay in Replit Secrets or `.env`.
- **What we tell users up front:** This is an AI educational check, not a diagnosis and not a promise that a product is safe. Do not paste personal information. For health decisions, talk with a clinician.
- **Crisis:** A crisis response does not create a `product_checks` record. Ordinary ingredient analysis is not routed through the community-resource medical/crisis workflow, and normal ingredient terminology must not block an assessment.
- **Who on the team is responsible:** Not assigned yet.

### 11. Out of scope

- Authentication, accounts, and saved user profiles
- Photo upload, barcode scanning, and file parsing
- Supabase or any database other than Replit PostgreSQL
- Any model provider other than Google Gemini through the existing LangChain client
- Medical diagnosis, treatment plans, and collection of symptoms or history
- A team-maintained catalog of real product formulas
- Claiming a product is safe
- Inventing ingredients
- Removing the starter chat, skills, or community-resource features in the MVP tickets

### 12. Technical architecture

Follow the starter layout. Extend it; do not restack it.

| Concern | Use |
|---|---|
| Browser UI | React in `src/`. Current shell is `src/App.jsx` |
| Browser-to-server calls | `src/api.js` `request()`, which fetches `/api...` and throws `Error` on `data.error` |
| HTTP API | Express router in `server/routes/api.js`, mounted at `/api` by `server/index.js` |
| Request checks | Zod in `server/validation.js` via `.safeParse()` before model or SQL |
| Model | `getModel()` in `server/ai/model.js` (`ChatGoogle` from `@langchain/google/node`). Key from `GEMINI_API_KEY` via `server/config.js` |
| Structured model output | Same approach as `routeWithAi` in `server/agent/router.js`: `model.withStructuredOutput(schema)`, then `schema.parse` |
| Database | `query()` in `server/db/pool.js` with `$1, $2, ...`. Table created from `server/db/schema.sql` on startup (`server/db/setup.js`) |
| Missing key | `aiMode()` returns `mock`. The checker returns `unknown` and must not invent a formula (see the API contract) |
| Local database | In local development, and in mock mode outside production, product checks may use an in-memory list when Postgres is not configured. That list resets on restart |
| Production database | A deployed Replit app (`NODE_ENV=production`, `config.isProduction`) must have a working `DATABASE_URL`. It must not silently fall back to memory. If Postgres is unavailable, the API returns an error and does not claim the check was saved |

Environment names that already exist: `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-3.1-flash-lite`), `GEMINI_TEMPERATURE`, `AI_MODE`, `DATABASE_URL`, `PORT`. Do not add a new provider key.

JSON body limit is already 100kb in `server/index.js`, which covers a 5,000-character ingredient list.

### 13. Acceptance criteria

These scenarios are the definition of done for the MVP. Ticket authors should copy them into `tickets/` and keep them in Gherkin.

```gherkin
Feature: Check a personal care product or ingredient list

  Scenario: Pasted ingredients return a structured educational result
    Given Gemini structured output is available
    And the assessment can be persisted
    When I submit input type "ingredients" and a non-empty ingredient list
    Then the page still shows the original text I typed, from session state
    And the status is "lower_concern", "caution", or "unknown"
    And I see a headline, an explanation, and a list of flagged ingredients
    And a product_checks row exists with that id
    And that row's user_input is the redacted text, not a separate original copy

  Scenario: An unverified product name is unknown
    Given the product name cannot be reliably matched to a formulation
    When I submit input type "product" and that product name
    Then the status is "unknown"
    And the flagged ingredients list is empty
    And the explanation asks for the ingredient list
    And the response does not contain an invented ingredient list

  Scenario: The result never promises safety
    When I receive a successful analysis
    Then the headline and explanation do not say the product is safe, guaranteed safe, or risk-free

  Scenario: Empty input is rejected
    When I submit a blank user input
    Then I see a validation error
    And no product_checks row is created

  Scenario: Helpful vote is saved
    Given a product check with id 101 exists
    When I submit feedback that id 101 was helpful
    Then that row's survey answer is stored as "yes"

  Scenario: Personal details are redacted before Gemini and the database
    When I paste an ingredient list that also contains an email address
    Then the page still shows my original text from session state
    And the text sent to Gemini has the email removed
    And the stored user_input has the email removed

  Scenario: Normal ingredient wording is not blocked
    When I submit an ordinary ingredient list
    Then I receive an assessment
    And the community-resource medical and crisis classifier does not reject it

  Scenario: Production does not pretend a failed save worked
    Given the app is running in production
    And PostgreSQL is unavailable
    When I submit a product name or ingredient list
    Then I see an error that the check was not saved
    And the response has no id
```

```gherkin
Feature: Helpfulness feedback

  Scenario: No vote yet
    Given I just received an analysis
    Then the survey answer for that row is empty
    And I can leave the page without voting

  Scenario: A later vote replaces the first
    Given I already answered "yes" for a check
    When I answer "no" for the same id
    Then the stored survey answer is "no"
```

### 14. Working agreements

- Write the ticket in `tickets/` before coding a feature. Template and rules: [`docs/SPEC-DRIVEN-DEVELOPMENT.md`](docs/SPEC-DRIVEN-DEVELOPMENT.md).
- One ticket at a time. API contract first, then UI.
- `npm test` must pass. Tests do not need a Gemini key or a database.
- Branch, pull request, and teammate review follow the Git section of `README.md`.
- Part A of this file still applies to every ticket.

### 15. Open questions

Resolved for implementation unless the team overrides them before the first build ticket:

1. **Mock mode** (no `GEMINI_API_KEY`, or `AI_MODE=mock`): return `unknown`, and do not invent ingredients. Exact copy is in the API contract. Mock mode changes the assessment, not the production database rule.
2. **Persistence:** in-memory product checks are acceptable for local development and for mock mode outside production. A deployed Replit app must use a working PostgreSQL `DATABASE_URL`. Production must not silently fall back to memory. If that database is unavailable, return a clear error instead of a saved-check response.
3. **Explanation length:** 40–60 words is the prompt target. Zod maximum is 600 characters, not an exact word count.
4. **Flagged ingredients:** an array of ingredient-name strings.
5. **Repeated feedback:** the newest Yes/No replaces the previous one.
6. **Crisis responses:** they do not create `product_checks` records. Ordinary ingredient analysis does not go through the community-resource medical/crisis classifier.
7. **Analyze temperature:** use a low temperature for the structured check if the LangChain call allows it, so status labels stay stable. Leave the chat default in `server/config.js` unchanged until a ticket needs to.

Still need a person on the team:

- Team name, member names, and the named persona in `shared/project.config.js`
- A real citation or conversation for "Evidence it's real"
- Who is responsible for privacy review
- Whether README's starter tour should be rewritten for VulvaCare (out of scope for the spec-only change)
- Whether the home page should hide the starter chat and resource board once the VulvaCare UI exists
