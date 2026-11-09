# SPEC.md: Our Project Specification

> Fill this in with your team **before** your first ticket.
> Short and specific beats long and vague. Every `TODO` must be gone by the end of day 1.
> How to use it: see [`docs/SPEC-DRIVEN-DEVELOPMENT.md`](docs/SPEC-DRIVEN-DEVELOPMENT.md).

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

## PART B: Our project (fill this in)

### 1. Team and one-liner
- **Team name:** TODO
- **App name:** TODO
- **One sentence:** We help TODO (who) TODO (do what) so that TODO (result).

### 2. Problem
- **Problem statement:** TODO
- **Theme:** TODO (Climate, Education Access, Global Health, Clean Water, Child Protection, other)
- **Evidence it's real:** TODO (a number, an article, or a conversation with someone affected)

### 3. User
- **Main user:** TODO (name, age, situation)
- **What they do today without our app:** TODO
- **Device and language(s):** TODO

### 4. Goals
| Goal | How we'll measure it | Target |
|---|---|---|
| TODO | TODO | TODO |

### 5. Features
| Priority | Feature | Ticket | Skill(s) |
|---|---|---|---|
| Must | TODO | 004 | TODO |
| Must | TODO | 005 | TODO |
| Must | TODO | 006 | TODO |
| Not now | TODO | n/a | n/a |

### 6. Agent and skills
- **Agent name and voice:** TODO (update `shared/project.config.js` to match)
- **Starter skills we keep:** TODO
- **New skills we'll write:** TODO (name, what it does, when it should be used)
- **The agent must NEVER:** TODO

### 7. Data
| Table | What's in it | Where the data comes from | Who keeps it up to date |
|---|---|---|---|
| resources | TODO | TODO | TODO |
| TODO | TODO | TODO | TODO |

### 8. Privacy and governance
- **Personal info our app could touch:** TODO
- **How we protect it:** TODO
- **What we tell users up front:** TODO
- **Who on the team is responsible:** TODO

### 9. Out of scope (not in these two weeks)
- TODO

### 10. Open questions
- TODO
