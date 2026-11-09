# Spec-Driven Development: Plan It, Then Build It

> **The big idea:** write down *exactly* what "done" looks like **before** you write code.
> Then build until it's true. AI tools like Replit Agent build what you **say**, not what you
> **mean**. A clear spec closes that gap.

---

## 1. Why bother?

| Without a spec | With a spec |
|---|---|
| "Make it better" | "A parent finds a food pantry in under 2 minutes" |
| Four teammates build four different apps | Everyone builds the same thing |
| Replit Agent guesses and adds random features | Replit Agent builds one ticket, exactly |
| "Is it done?" "...kind of?" | Every scenario passes, so it's done |
| Demo day surprises | Demo day checklist |

**Restaurant version:** the spec is the menu. Tickets are order slips. Gherkin scenarios are
the taste test: "Given a customer ordered the soup, when it arrives, then it is hot."

---

## 2. The loop

```
  1. SPEC        What are we building and why?       (SPEC.md, once per project)
       ↓
  2. TICKET      One small feature, in Gherkin.      (tickets/NNN-name.md)
       ↓
  3. BUILD       Code it, or hand it to Replit Agent.
       ↓
  4. TEST        Walk through every scenario. Write a test for the important ones.
       ↓
  5. DEMO        Show a teammate. Move the ticket to Done.
       ↺ back to 2 for the next ticket
```

One ticket at a time. Small tickets ship. Giant tickets stall.

---

## 3. Step 1: The spec (`SPEC.md`)

Fill in `SPEC.md` at the root of this repo with your team **before** your first ticket. It answers:

1. **Problem:** who is struggling, and how? (Copy from your Scoping Worksheet.)
2. **User:** one real-sounding person with a name and a situation.
3. **Goal:** what changes for them if your app works? Make it measurable.
4. **Features:** the 3 must-haves, ranked. Everything else is "Not now".
5. **Agent and skills:** what the AI does, and what it must never do.
6. **Data:** what goes in the database.
7. **Privacy:** what personal info you might touch, and how you protect it.
8. **Out of scope:** what you are NOT building in two weeks.

> **Tip:** if a feature isn't in `SPEC.md`, it doesn't get a ticket. Add it to "Not now".

---

## 4. Step 2: Tickets in Gherkin

A ticket is one feature someone can use. Every ticket has three parts:

1. **User story:** who wants it, what they want, and why.
2. **Acceptance criteria:** Gherkin scenarios that say exactly when it's done.
3. **Notes:** files to touch, skills used, size, owner.

### 4a. User story

```
As a <type of user>
I want <to do something>
So that <I get some benefit>
```

**Good:** *As a parent who works evenings, I want to search resources by neighborhood, so that
I only see places I can actually get to.*

**Too vague:** *As a user, I want a better search.* (Better how? For whom?)

### 4b. Gherkin, the grammar

Gherkin is a plain-English format for describing behavior. Product people can read it,
and test tools can run it. The keywords:

| Keyword | Meaning | Restaurant |
|---|---|---|
| `Feature:` | The ticket's name | A dish on the menu |
| `Scenario:` | One specific situation to test | One customer's order |
| `Given` | The starting situation (setup) | The table is seated |
| `When` | The ONE action the user takes | They order the soup |
| `Then` | What must happen (the check) | The soup arrives hot |
| `And` / `But` | Add more to the line above | ...and with bread |
| `Background:` | Givens shared by every scenario | Every table gets water |
| `Scenario Outline:` + `Examples:` | Same scenario, many inputs | Taste every soup on the menu |

### 4c. A full example

```gherkin
Feature: Find a community resource by asking the agent

  Background:
    Given the resources table has the sample data
    And I am on the home page

  Scenario: Find homework help for kids
    When I ask Compass "Where can my kids get homework help?"
    Then the answer mentions "Bright Futures After School"
    And the answer includes its hours and phone number
    And the label under the answer says "skill: resource-finder"

  Scenario: Nothing matches
    When I ask Compass "Where can I adopt a puppy?"
    Then the answer says it could not find a match
    And the answer suggests calling 211
    But the answer does not invent a place or phone number

  Scenario: Personal information is removed
    When I ask "My number is 312-555-0199, where is a food pantry?"
    Then the AI never receives "312-555-0199"
    And the answer says personal information was removed
```

### 4d. Scenario Outline: one scenario, many inputs

```gherkin
Scenario Outline: Auto mode picks the right skill
  Given the skill picker is set to "Auto"
  When I send "<message>"
  Then the label under the answer says "skill: <skill>"

  Examples:
    | message                                  | skill                    |
    | Where is a free clinic?                  | resource-finder          |
    | What does this eviction notice mean?     | plain-language-explainer |
    | Translate "the pantry opens at 9" to Spanish | translator           |
    | My power got shut off, what should I do? | action-plan-builder      |
```

### 4e. Rules for great scenarios

1. **One `When` per scenario.** Two actions means two scenarios.
2. **`Then` must be checkable.** "The answer is helpful" can't be checked. "The answer includes a phone number" can.
3. **Use real examples, not placeholders.** `"Where can my kids get homework help?"` beats `"a question"`.
4. **Describe behavior, not code.** Write "I see an error saying Name is required", not "zod returns 400".
5. **Cover the unhappy path.** Every ticket gets at least one scenario where something goes wrong: empty input, no results, no API key, bad data.
6. **Include one safety scenario** whenever the AI or personal data is involved.

| Weak | Strong |
|---|---|
| `Then it works` | `Then I see "Saved to the database!"` |
| `When I use the search` | `When I search for "tutor"` |
| `Then the AI answers well` | `Then the answer lists 1 to 3 places from the database` |
| `Given some data` | `Given the resources table has 30 sample rows` |

---

## 5. Step 3: Size it, own it, build it

### Size

| Size | Meaning | Rule |
|---|---|---|
| **S** | Under 1 hour | Great. Ship it today. |
| **M** | Half a day | Fine. |
| **L** | A full day or more | **Too big. Split it** into 2 or 3 tickets. |

How to split: by scenario (happy path first, errors second), by layer (API first, then UI), or by user (visitor first, admin later).

### Board

Use a simple board with four columns (GitHub Projects, Trello, or sticky notes):

`To Do → In Progress → Review → Done`

**Rule:** each person has at most ONE ticket in "In Progress".

### Definition of Done (every ticket)

- [ ] Every scenario passes when a teammate walks through it.
- [ ] `npm test` passes.
- [ ] No API keys or personal info in the code or commits.
- [ ] A teammate reviewed it (Review column).
- [ ] Merged to `main` and the Replit app still runs.

---

## 6. Hand a ticket to Replit Agent

Replit Agent is great at following clear tickets and bad at reading minds. Paste this, filled in:

```
Read SPEC.md and tickets/004-save-favorites.md.
Build ONLY that ticket. Follow every rule in SPEC.md Part A.
Use the existing structure: React components in src/components, API routes in
server/routes/api.js, database tables in server/db/schema.sql, validation with zod in
server/validation.js.
Do not change files that the ticket doesn't need.
When you're done, list which scenario each change satisfies.
```

Then **you** test every scenario by hand. If one fails, paste the failing scenario back to Agent:
*"This scenario fails: [paste it]. Fix only that."*

> **Why this works:** Gherkin is precise enough for an AI to build from, and precise enough for
> you to check its work. You stay the boss of what "done" means.

---

## 7. Step 4: Turn scenarios into tests

Important scenarios deserve an automated test, so they stay true forever. Each `Given / When / Then`
maps to three lines of a test. Compare this scenario with `tests/guardrail.test.js`:

```gherkin
Scenario: Personal information is removed
  When I send "Call me at 312-555-0199"
  Then the message sent to the AI does not contain "312-555-0199"
```

```js
test('removes phone numbers before the AI sees them', () => {
  const out = run({ message: 'Call me at 312-555-0199' });  // When
  assert.ok(!out.redacted.includes('555-0199'));             // Then
});
```

Run all tests with `npm test`.

---

## 8. Your first week, as tickets

1. `001` Fill in `shared/project.config.js` and `SPEC.md` (S)
2. `002` Replace the sample resources with 25 to 40 real, verified ones (M)
3. `003` Rewrite the agent's voice and rules in `server/agent/agent.js` for your users (S)
4. `004` Your first must-have feature from `SPEC.md` (M)
5. `005` One new skill for your project in `skills/` (M)

Copy `tickets/TEMPLATE.md` for each one. The `tickets/` folder has finished examples to model from.
