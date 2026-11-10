# Community Sprint Starter

**CodeSquad AI Community Sprint.** A ready-to-go starter for your community project:
**React** front end, **Node/Express** back end, **Replit PostgreSQL** database, and an AI agent
powered by **Google Gemini** through **LangChain**, with **6 agent skills**, **zod** validation,
and a full **spec-driven development** workflow with Gherkin tickets.

It runs on day one with no key and no database (sample data + mock AI), so you can explore first.

---

## Our team (fill this in)

| | |
|---|---|
| **Team name** | TODO |
| **App name** | TODO |
| **Problem statement** | TODO: Who is struggling, and how? |
| **Target user** | TODO: One person, with a name and a situation |
| **Community** | TODO: City, neighborhood |
| **Theme** | TODO: Climate / Education Access / Global Health / Clean Water / Child Protection |
| **How we'll know it works** | TODO: Something measurable |

| Name | Role |
|---|---|
| TODO | Product owner (writes tickets) |
| TODO | Front end (React) |
| TODO | Back end (API + database) |
| TODO | AI agent and skills |

> Put the same info in `shared/project.config.js`. The web page and the AI agent both read it.

---

## What's inside (the restaurant map)

| Restaurant | Folder | Tech | Job |
|---|---|---|---|
| Dining room | `src/`, `index.html` | React + CSS | What visitors see and click |
| Waiter | `src/api.js`, `server/routes/api.js` | fetch + Express | Carries orders in, answers out |
| Order check | `server/validation.js` | zod | Rejects bad orders before cooking |
| Kitchen | `server/agent/` | LangChain | The agent loop: guard, route, tool, think, check |
| Chef playbooks | `skills/` | SKILL.md | Step-by-step know-how for each kind of request |
| Outside supplier | `server/ai/model.js` | Gemini | The AI model |
| Pantry and logbook | `server/db/` | PostgreSQL | Resources and logs that survive restarts |
| The menu | `SPEC.md`, `tickets/` | Gherkin | What we promise to build |

---

## Upload this project to GitHub

1. Create a new, empty repository on GitHub. Do not initialize it with a README, license, or `.gitignore`; this project already has those files and Git history.
2. From this project folder, run `git remote -v` to check the destination. If there is no `origin`, add the URL for your repository:

  ```bash
  git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
  ```

3. Commit any changes you want to upload, then push the `main` branch:

    ```bash
    git add .
    git commit -m "Describe your project changes"
    git push -u origin main
    ```

  If Git says there is nothing to commit, skip the commit command and push. Check that `origin` points to the repository you intend to publish before pushing. Never commit API keys, `.env` files, or other secrets.

## Get started on Replit (10 minutes)

### 1. Get the code into Replit
- **From GitHub:** in Replit, choose **Create App > Import from GitHub** and paste your team's repo URL.
- **From a zip:** create a new Node.js app in Replit and drag these files in.

### 2. Add your Gemini API key (this is where the key goes)
1. Go to <https://aistudio.google.com/apikey>, sign in, and click **Create API key**. Copy it.
2. In Replit, open **Tools > Secrets** (or search "Secrets").
3. Add a secret. Name it exactly `GEMINI_API_KEY`, and paste your key as the value.
4. Optional: add `GEMINI_MODEL` if you want a different model than `gemini-3.1-flash-lite`.

> Never paste your key into code or commit it. Replit Secrets keep it private, and
> `server/config.js` reads it on the server only. It is never sent to the browser.

### 3. Create the database (already configured, just switch it on)
1. In Replit, open **Tools > Database** and create a **PostgreSQL** database.
2. Replit automatically adds a `DATABASE_URL` secret. That's all the setup there is.
3. When the server starts, it creates the tables in `server/db/schema.sql` and adds
   **30 sample community resources** from `server/db/seed-data.js`.

No database yet? The app still runs with the sample data in memory. Changes just disappear on restart.

### 4. Run it
Click **Run**. The first run installs packages (about a minute). Then open the preview.

Check the two pills at the top of the page:

| Pill | Means |
|---|---|
| **AI: Gemini live** | Your key works. |
| **AI: Mock mode** | No key found. Check the Secret name, then restart. |
| **Database: Postgres** | Connected to your Replit database. |
| **Database: Sample data (memory)** | No `DATABASE_URL` yet. Do step 3. |

The **Start here** checklist on the page ticks itself off as your team finishes setup.

### 5. Make it yours
1. Fill in **Our team** above and `shared/project.config.js`.
2. Fill in `SPEC.md` with your team.
3. Read [`docs/SPEC-DRIVEN-DEVELOPMENT.md`](docs/SPEC-DRIVEN-DEVELOPMENT.md) and write your first ticket in `tickets/`.
4. Replace the sample resources with real, verified ones for your community.

## Run it on your own computer (optional)

```bash
npm install
cp .env.example .env    # then paste your GEMINI_API_KEY (and DATABASE_URL if you have Postgres)
npm run dev             # http://localhost:3000
npm test                # 15 tests, no key or database needed
```

You need Node.js 20 or newer.

---

## The 6 agent skills

A **skill** is a playbook the agent follows for one kind of request. Each one is a folder in
`skills/` with a `SKILL.md` (instructions) and sometimes a `tool.js` (real code). The format is the
open [Agent Skills](https://agentskills.io/specification) standard, so Replit Agent can read them too.

| Skill | What it does | Code? |
|---|---|---|
| `safety-guardrail` | Runs first on EVERY message. Removes phone numbers, emails, and ID numbers. Flags crisis, medical, and legal topics. Crisis messages get emergency numbers instead of AI. | Yes, `tool.js` |
| `intent-router` | When the skill picker is on **Auto**, reads the message and picks the best skill. Uses LangChain **structured output** checked by **zod**, with keyword rules as a backup. | Uses zod |
| `resource-finder` | Searches the Postgres `resources` table and answers ONLY from what it finds. No made-up places or phone numbers. | Yes, `tool.js` |
| `plain-language-explainer` | Rewrites confusing letters, forms, and notices at a 6th-grade reading level. | |
| `translator` | Translates while keeping names, numbers, and dates exactly the same. | |
| `action-plan-builder` | Turns "what should I do?" into 3 to 5 numbered steps and what to bring. | |

### How one message flows (read `server/agent/agent.js`)

```
visitor types a message
  1. GUARD   safety-guardrail removes personal info, flags risky topics
  2. ROUTE   the visitor picked a skill, or intent-router picks one
  3. TOOL    if the skill has tool.js, run it (resource-finder searches Postgres)
  4. THINK   system prompt = base rules + the skill's SKILL.md (+ database results) -> Gemini
  5. CHECK   add safety notes, log which skill answered (never the message itself)
answer goes back to React
```

### Add your own skill
1. Copy a folder: `cp -r skills/translator skills/my-new-skill`
2. In `SKILL.md`, set `name: my-new-skill` (must match the folder) and write a `description`
   that says what it does **and when to use it**. The router reads that description.
3. Write the steps and rules.
4. Optional: add `tool.js` that exports `run({ message })` and returns `{ context, data }`.
5. Optional: add a keyword rule for it in `server/agent/router.js`.
6. Restart, then run `npm test`. It appears in the Agent skills panel and the skill picker.

---

## The database

### What community resources are for
Community resources are local programs and services that visitors can search for, such as food assistance, clinics, housing help, tutoring, or legal aid. The directory displays these listings, and the `resource-finder` skill searches the same records to answer questions like "Where can I find a nearby tutor?" The agent is instructed to use only matching database results, so missing or outdated listings can leave someone without a useful referral; invented details are never an acceptable substitute.

The app's sample listings are fictional examples, not real referrals. Replace them with real services for the community your team serves, and verify contact details and hours with the provider before publishing. Add only information intended for public use, never a visitor's personal information.

Each listing needs a **name**, one supported **category**, and a clear **description** of what the service offers. Add a **neighborhood** when location matters; **hours**, **phone**, **website**, **address**, and **languages** help visitors decide whether a service fits. The app's Add Resource form collects name, category, description, neighborhood, hours, phone, and website; address and languages can also be stored through the API or database. Categories are `Food`, `Health`, `Housing`, `Youth`, `Education`, `Jobs`, `Seniors`, `Legal Aid`, and `Environment`.

You can add a listing with **+ Add one** in the Community resources section. To replace the starter examples, edit `server/db/seed-data.js`; seed data is inserted only when the resources table is empty. For live use, plan who on the team will verify and update listings as providers change their services.

| Table | What's in it |
|---|---|
| `resources` | Community programs: name, category, description, neighborhood, hours, phone, website, languages |
| `chat_logs` | Which skill answered and when. **Never** what the person typed (privacy by design). |

- **See your data:** Replit **Tools > Database** lets you browse tables and run SQL.
- **Add a table:** add a `CREATE TABLE IF NOT EXISTS ...` to `server/db/schema.sql`, then restart
  (or run `npm run db:setup`). There's a commented example at the bottom of that file.
- **Write queries** in `server/db/resources.js` (or a new file next to it). Always use
  `$1, $2` placeholders, never string glue. That's what stops SQL injection.
- **Change the sample data** in `server/db/seed-data.js`. It only loads into an empty table, so to
  reload it, run `DELETE FROM resources;` in the Database tool, then restart.

## API routes

| Method | Route | Does |
|---|---|---|
| GET | `/api/health` | AI mode, model, and database status |
| GET | `/api/skills` | The loaded skills |
| POST | `/api/chat` | `{ message, skill?, history? }` -> the agent's answer |
| GET | `/api/resources?search=&category=` | Search resources |
| POST | `/api/resources` | Add a resource (checked by zod) |

---

## Spec-driven development (how we work)

We **write what "done" means before we code**, using Gherkin scenarios:

```gherkin
Scenario: Find homework help
  Given the resources table has the sample data
  When I ask "Where can my kids get homework help?"
  Then the answer mentions "Bright Futures After School"
  And the label under the answer says "skill: resource-finder"
```

1. Fill in `SPEC.md` (once).
2. Copy `tickets/TEMPLATE.md` for each feature. Write the user story and scenarios.
3. Build it yourself, or hand the ticket to Replit Agent (prompt in the guide, section 6).
4. Walk through every scenario. Add a test for the important ones.
5. Demo it to a teammate. Move it to Done.

Full guide with examples, rules for good scenarios, sizing, and a Definition of Done:
**[`docs/SPEC-DRIVEN-DEVELOPMENT.md`](docs/SPEC-DRIVEN-DEVELOPMENT.md)**.
Finished example tickets are in `tickets/001` to `003`. `tickets/004` is a ticket for you to build.

---

## Git: clone, branch, push

```bash
git clone <your-team-repo-url>
cd community-sprint-starter
git checkout -b your-name/004-save-favorites   # one branch per ticket
git add .
git commit -m "004: save favorites (scenarios 1-2)"
git push -u origin your-name/004-save-favorites
```

Open a pull request, have a teammate check the scenarios, then merge to `main`.

## Project structure

```
.
├── index.html                  React page shell
├── src/                        React app (dining room)
│   ├── App.jsx, api.js, styles.css
│   └── components/             ProjectHeader, StartHere, ChatPanel, ResourceBoard, SkillsPanel
├── shared/project.config.js    Your team, problem, and agent persona
├── server/
│   ├── index.js                One server: API + React (Vite in dev, dist/ in production)
│   ├── config.js               Reads GEMINI_API_KEY, DATABASE_URL, etc.
│   ├── validation.js           zod schemas
│   ├── routes/api.js           /api routes
│   ├── ai/model.js             LangChain ChatGoogle (Gemini)
│   ├── agent/                  agent.js (the loop), router.js, skills.js
│   └── db/                     pool.js, schema.sql, seed-data.js, resources.js, setup.js
├── skills/                     6 agent skills (SKILL.md + optional tool.js)
├── SPEC.md                     Your project spec
├── docs/SPEC-DRIVEN-DEVELOPMENT.md
├── tickets/                    Gherkin tickets (template + examples)
└── tests/                      node:test tests (npm test)
```

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the app with instant reload (what Replit's Run button does) |
| `npm test` | Run the tests (no key or database needed) |
| `npm run db:setup` | Create tables and load sample data |
| `npm run build` then `npm start` | Production build (used when you Publish on Replit) |

## Publish on Replit
Click **Publish**, choose **Autoscale**, and make sure `GEMINI_API_KEY` is in the published
app's secrets. Replit uses the `[deployment]` settings in `.replit` (build, then start).

## Troubleshooting

| Problem | Fix |
|---|---|
| Pill says **Mock mode** | The Secret must be named exactly `GEMINI_API_KEY`. Stop and Run again. |
| "Gemini rejected the key or model" | Copy the key again. Or set `GEMINI_MODEL` to a model listed in AI Studio. |
| "Too many requests" | Free keys have a rate limit. Wait a minute. |
| Pill says **Sample data (memory)** | Create a PostgreSQL database in Tools > Database, then restart. |
| `relation "resources" does not exist` | Run `npm run db:setup`. |
| `Cannot find package` | Run `npm install`. |
| Port already in use (local) | Stop the other server, or set `PORT=3001` in `.env`. |
| A skill doesn't show up | Run `npm test`. The skill checker explains what's wrong in `SKILL.md`. |

## Safety rules
- Keys go in Secrets or `.env`, never in code. `.env` is in `.gitignore`.
- The sample resources are **made up**. Replace them with verified, real information before you share the app.
- Free-tier Gemini usage may be used by Google to improve its products. Don't send personal info.
- Answers come from AI and can be wrong. The app says so, and so should you.
