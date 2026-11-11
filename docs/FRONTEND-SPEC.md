# VulvaCare — Frontend Implementation Specification

**Version:** 1.0  
**Prepared:** November 11, 2026  
**Target:** Thursday MVP  
**Owner:** Frontend implementation (Angel)  
**Status:** Implementation handoff; confirm any contract details against the repository before coding

## 1. Purpose and authority

Implement a polished, mobile-first VulvaCare homepage and ingredient-checking results experience **using the existing API**. The application accepts a product name or pasted ingredient/material list, displays the assessment returned by the server, and lets visitors say whether the result was helpful.

**Source-of-truth order:**
1. Existing repository `docs/API-CONTRACT.md`, `SPEC.md`, route handlers, request helper, and tests for API field names, validation, response shapes, errors, and data persistence.
2. This document for frontend presentation, interaction, layout, and acceptance requirements.
3. Approved brand assets and visual references for styling only.

**Do not change API response shapes, server code, Gemini prompts, validation limits, database schema, or existing feedback semantics to satisfy a visual mockup.** If a contract detail differs from an assumption in this document, use the repository as authority and report the discrepancy before making a frontend-only adaptation.

The UI examples here are **illustrative test data**, not medical evaluations or guaranteed Gemini output.

## 2. MVP scope

### In scope
- Single responsive homepage with a branded hero and product checker.
- User input: either product name **or** pasted ingredient/material text.
- Submission to the existing `POST /api/analyze` endpoint using the repository's established client helper and **actual request schema**.
- Explicit loading, success, and failure states.
- Rendering the three assessment statuses: `caution`, `lower_concern`, and `unknown`.
- Displaying the user's original input as **“You gave us:”** with accessible expand/collapse behavior.
- Rendering one API-provided headline, one overall API-provided explanation, and zero or more API-provided flagged ingredient names.
- Helpful Yes/No feedback using the existing `POST /api/feedback` contract.
- “Check another product” to reset the analysis and focus the input.
- Responsive overflow behavior, keyboard accessibility, semantic structure, and lightweight tests.

### Out of scope
- Accounts, login, file/image uploads, product catalogs, recommendations, ingredient search database, analytics dashboard, saved history, ingredient-by-ingredient AI descriptions, new backend fields, or new backend endpoints.
- Guessing ingredient classifications or adding clinical claims in the browser.
- Adding a navigation menu without destinations.

## 3. Design direction and tokens

VulvaCare should feel premium, modern, warm, science-informed, and editorial but usable. Prioritize clarity of the assessment above decoration.

| Token | Value | Intended use |
|---|---|---|
| Brand purple | `#8537E7` | Hero background, primary buttons, links, primary accent |
| Magenta | `#D1108D` | Wordmark accent and selective details |
| Orange | `#FA870E` | Minor accents only |
| Green | `#11AA61` | Brand palette; **do not recreate the illustration's organic shape in CSS** |
| Blue | `#090E95` | Brand palette; not required in the MVP UI |
| Warm ivory | `#FFFCF8` | Main page background |
| Soft lavender | `#F3EAFF` | Main result panel and occasional secondary surfaces |
| Charcoal | `#34313A` | Body copy |
| Caution circle | `#F04D58` | Red/coral status and flag icons |
| Lower concern circle | `#348A65` | Green status |
| Unknown circle | `#85858F` | Gray status |

- Do not introduce darker purple variants, dark plum, burgundy, or heavy gradients; keep backgrounds flat or nearly flat.
- Use white/near-white cards with thin lavender borders for flagged ingredient rows.
- Use a subdued lavender for the educational disclaimer, not the same visual weight as the main result.
- Keep the hero noticeably bolder than the rest of the page.
- Use a bold rounded brand wordmark from the approved logo asset, expressive editorial headings, and clear sans-serif body and controls. Prefer existing project fonts or accessible fallbacks; do not rely on an unavailable font.
- Preserve readable contrast, including white copy on the purple hero. Avoid colored text on similarly colored surfaces.

## 4. Brand assets and responsive hero

### Required assets
- **Logo:** use the approved VulvaCare logo asset. Present it inside a white, rounded, responsive header container to preserve contrast with the purple hero. The white backing can be CSS; do **not** assume the exported logo image includes an inflexible full-width white header.
- **Hero illustration:** a **single exported image supplied by the team**. The woman **and the organic shape behind her are embedded in that image**. **Do not separately draw, position, color, clip, or animate an organic green shape in CSS.** Do not infer or specify that embedded shape's color.

### Responsive treatment
- Hero section background: `#8537E7`.
- No hamburger menu, navigation icon, or placeholder links.
- Logo should scale proportionally, never stretch or be cropped.
- Hero illustration should use responsive dimensions, appropriate `object-fit`/containment, and safe cropping only if the approved asset supports it. Do not crop out the woman's face or overlap essential text.
- At narrow widths, stack/position text and image so copy stays fully legible. At wider widths, a two-column treatment is acceptable.
- Avoid fixed pixel coordinates that only work at 402 px; use fluid layout, max-width containers, flexible spacing, and media queries.
- If the supplied artwork has transparent edges, keep its alpha intact. Wait for the actual asset path; until then use a clearly documented placeholder, not a newly invented hero illustration.
- Provide appropriate alt text for a meaningful illustration (e.g., "Smiling woman in VulvaCare hero artwork") or empty alt if purely decorative, consistent with final usage.

## 5. Page structure and approved copy

The page is one continuous, responsive document, with the initial result area **absent until an analysis has completed**. Do not hardcode a sample result into the live initial homepage.

### A. Header and hero
- Display the approved VulvaCare logo on its white rounded backing.
- No menu icon.
- Eyebrow: **INGREDIENT TRANSPARENCY, MADE SIMPLE.**
- Headline: **Know what touches your most intimate skin.**
- Supporting copy: **Understand the ingredients in your intimate care products with clear, AI-powered insights.**
- Hero background: brand purple.
- Supplied hero illustration positioned to complement, not cover, the text.

### B. Product checker
- Heading: **What’s in your product?**
- Supporting copy: **Enter a product name or paste an ingredient list to explore potential irritation concerns.**
- Multiline textarea with accessible label and placeholder: **Enter a product name or paste ingredients...**
- Primary CTA: **Check ingredients**.
- Note: **No account required.**
- Use the exact request validation constraints and payload schema already documented in the repo. Show concise inline validation messages for empty, too-long, or otherwise invalid input, as appropriate to the existing contract. Do not submit whitespace-only input.

### C. Input summary (post-success only)
- Title: **You gave us:**
- Display the actual user-submitted text or the server-confirmed original input per the repository's response contract; **do not replace, normalize, reorder, classify, or silently discard words**.
- Default to a short preview of roughly 2–3 lines; offer one explicit expansion control: **Show full input** / **Hide full input**.
- Only append a count such as **(14 ingredients)** if an accurate count is available by a reliable rule for the given input. **For product names and ambiguous free text, omit the count.**
- Do not add a second chevron inside the preview acting as a duplicate control.
- Expanded input displays all supplied items with original line breaks, as space allows, without clipping. Textareas, previews, and expandable content must accommodate Unicode and long unbroken tokens.

### D. Results panel (post-success only)
- Render a status circle and readable status label.
- Render **API `headline`** verbatim in the headline position; never replace it with canned copy based on status.
- Heading: **What we found**.
- Render **one overall API `explanation`** verbatim, as normal paragraph text, preserving its meaning. It may address several flagged ingredients together.
- Do not create descriptions under individual flagged ingredients.
- Use a lavender status/result card with strong contrast and responsive text flow.

### E. Flagged ingredients (when returned)
- Heading: **Flagged ingredients**.
- Count pill: **N identified**, where `N` is the number of actual rendered flags; hide count and heading when there are no flags.
- Render **names only** in white/near-white rows with thin lavender borders and a caution icon.
- One ingredient per row, including long names that wrap naturally.
- No expandable ingredient descriptions, duplicate aggregate explanations, invented labels, or inferred safety claims.
- Inspect the real `flaggedIngredients` item shape before coding. If it is strings, render strings; if it is objects, use only the contractually documented name field. Do not invent properties.

### F. Compact educational note
- Heading: **What does this result mean?**
- Supporting copy: **Ingredient flags identify potential concerns, not a diagnosis or a guarantee of safety. How a product affects you also depends on its formulation and your individual sensitivity.**
- Use a compact, visually secondary panel. This is fixed educational guidance, not a substitute for the API explanation.

### G. Feedback
- Heading: **Was this helpful?**
- Supporting copy: **Your feedback helps us improve VulvaCare.**
- Outlined, touch-friendly **Yes** and **No** actions.
- Send the existing contract's boolean `helpful` value as defined in `docs/API-CONTRACT.md`; use its existing analysis association or identifiers, if required, rather than inventing one.
- Provide selected/submitting/success/failure feedback without discarding the analysis. Prevent accidental duplicate submissions. If the contract allows repeat votes, follow its semantics; otherwise disable after success.

### H. Repeat action
- Distinct outlined secondary button: **Check another product**.
- Clear the previous assessment and feedback state, clear the input, scroll the checker into view, and focus the textarea. Do not reload the whole application unless existing architecture requires it.

### I. Closing and footer
- Closing heading: **Better information. More confident choices.**
- Supporting copy: **Because understanding what goes on your body should be simple.**
- Footer: VulvaCare logo/wordmark; **Science-informed intimate wellness.**; **Educational information only. Not medical advice.**; **© 2026 VulvaCare.**
- Keep the closing card soft and the footer compact; don't invent other legal or medical assurances.

## 6. Status mapping — use API values, not guesses

| API status | Visual signal | Rendering behavior |
|---|---|---|
| `caution` | Red/coral circle `#F04D58`; white exclamation/alert icon; “CAUTION” label | Show API headline and explanation; render flagged list only if nonempty |
| `lower_concern` | Green circle `#348A65`; white check icon; “LOWER CONCERN” label | Show API headline and explanation; render flags only if returned; do not state “safe” or “guaranteed safe” |
| `unknown` | Gray circle `#85858F`; white question icon; “UNKNOWN” label | Show API headline and explanation; do not invent missing assessments; render flags only if returned |

All states must display their label in text as well as color/icon for accessibility. Do not assume `caution` always returns a nonempty list or that `lower_concern`/`unknown` always return an empty one: **render the actual payload safely** and report unexpected combinations during testing. If the API returns an unknown enum due to a contract mismatch, display a safe fallback and log a development diagnostic rather than silently treating it as lower concern.

## 7. Data contract and integration guardrails

**Expected conceptual fields from the agreed MVP:** original input, `status`, `headline`, `explanation`, and `flaggedIngredients`. **Exact property names, nested shapes, optionality, payload fields, IDs, and error formats must be verified against the current repository** before implementation.

- Use the existing frontend `request()` helper where possible.
- Route: `POST /api/analyze`; feedback route: `POST /api/feedback`, subject to repository contract verification.
- Never call Gemini directly in the browser. API keys remain server-side.
- Do not create a complete categorized ingredient inventory because the API does not promise one.
- Do not fabricate ingredient assessments from the pasted list. In particular, materials such as rayon, plastic, and cardboard may be product components or packaging; preserve the original input and defer assessment to the server.
- Present API text as escaped text nodes, **not** injected HTML; protect against scripts or markup in user input or model output.
- Avoid printing raw user inputs or sensitive request contents into production analytics/console logs.
- Do not modify survey or usage logging behavior established in the backend.
- Don't assume a feedback ID exists unless the contract supplies one. If a required identifier is unavailable, surface the mismatch instead of changing the server API.

## 8. UI state machine

| State | UI requirement |
|---|---|
| Initial | Hero and checker visible; no result or result feedback |
| Editing | User can enter/paste text; preserve draft while typing |
| Invalid | Accessible inline validation; no request submitted |
| Loading | “Checking ingredients…” or equivalent; disable duplicate submission; preserve entered text; optional restrained spinner |
| Success | Render input summary, status, headline, overall explanation, optional flags, educational note, and feedback; scroll results into view without abrupt motion |
| Analyze error | Human-readable failure message using established API error mapping; preserve input, enable retry; do not show a false result |
| Feedback submitting | Temporarily disable feedback controls and signal progress |
| Feedback success | Acknowledge response; preserve analysis |
| Feedback failure | Nonblocking error and retry route; preserve analysis |
| Reset | “Check another product” clears prior result and feedback, returns focus to input |

Use an `aria-live` status region for loading/errors/result announcements without reading an entire lengthy analysis unexpectedly. Respect reduced-motion preferences for transitions and scrolling. On repeated submissions, prevent stale responses from replacing a newer result (e.g. use request cancellation or a latest-request guard compatible with the existing code).

## 9. Responsive layout and overflow requirements

### Widths to verify
At minimum test **320, 375, 402, 430, 768, and 1024 CSS pixels**; include a desktop width if the app supports it. Use a centered max-width content container for longer screens. Ensure there is no unintended horizontal page scrolling.

### Content edge cases
1. Product name consisting of one short phrase.
2. Pasted 14-line sample below.
3. Large pasted text, e.g. 50+ line items **within the existing API input limit**; gracefully show validation when it exceeds the limit.
4. A long product name or a 100+ character ingredient label.
5. API explanation spanning several paragraphs or unusually long sentences.
6. Zero, one, two, and ten or more flagged items.
7. Very long translation-free single words, mixed punctuation, and Unicode.
8. Browser zoom at 200% and text scaling; controls and text remain readable.

### Layout rules
- No fixed-height result, ingredient row, or expanded summary panel; height must grow with content.
- Use `min-width: 0` for flex/grid text children and `overflow-wrap: anywhere` selectively for exceptionally long strings.
- Ensure badges and counts wrap or reposition instead of colliding with headings.
- Hero image and copy must not collide at any width; image is responsive and can stack below text.
- Main CTA and feedback targets should be at least approximately 44 px tall, with visible focus indicators.
- Long ingredient lists grow vertically; do not use a small nested scrolling region by default.
- Collapsed input preview must be clearly visibly truncated and accessible via a semantic button; expanded content must be readable with preserved line breaks.
- Keep spacing tighter inside the result card than in the hero, but never clip copy or compress controls.
- Keep the top hero distinctly purple while the body remains warm ivory.

## 10. Sample QA input (14 items; preserve as submitted)

```text
Rayon
Purified cotton
Polypropylene
Polyethylene
Polyester
Ethoxylated fatty acid esters
Glycerin
PEG-100 stearate
Paraffin wax
Carnauba wax
Cotton or polyester sewing thread
Colorants
Plastic
Cardboard
```

**Illustrative caution-only UI fixture:** status `caution`, headline “Potential irritation concerns”, one overall explanation, flagged ingredient names `Ethoxylated fatty acid esters` and `Colorants`. This fixture is **not a live or medically verified assessment**. Use a mock/stub or test fixture for deterministic frontend visual QA; live API responses must be displayed as returned.

Other deterministic fixtures: `lower_concern` with empty flags; `unknown` with empty flags; `caution` with 10+ long-name flags; unknown unexpected status; long explanation; malformed optional list if defensively supported.

## 11. Accessibility, trust, and performance

- Use semantic headings in logical order and a real form/textarea/submit button.
- Accessible labels for all controls; communicate errors through text, not color alone.
- Keyboard operable expand/collapse, feedback, and reset actions; visible focus rings.
- Use `aria-expanded` and `aria-controls` on the full-input toggle; use text status labels with icons.
- Avoid false reassurance: lower concern is **not** a safety guarantee; unknown signals insufficient evidence; caution is **not** a diagnosis.
- Don't auto-generate new medical or product claims in frontend copy.
- Preserve typography, low layout shift, and optimized hero asset dimensions and loading; avoid a large hero asset blocking the checker from becoming usable.
- Avoid motion-heavy effects or expensive component libraries for the MVP.

## 12. Suggested implementation sequence for Cursor

1. **Repository inspection only:** read `SPEC.md`, `docs/API-CONTRACT.md`, `src/`, the existing API helper, relevant server route shapes, and tests. Report exact field schemas, request limits, feedback handling, and reusable components. Do not edit code yet.
2. **Build presentation:** add responsive header/hero/checker with reusable brand tokens and placeholder for the team-supplied hero illustration. Remove placeholder menus; respect existing architecture.
3. **Connect analysis:** implement validated submit, loading/error handling, contract-accurate status/result rendering, truncated/full input, variable-length flags, and results scrolling.
4. **Connect feedback and reset:** implement Yes/No using the documented endpoint and “Check another product” reset/focus behavior.
5. **Test and refine:** run existing test suite, add targeted component/UI tests where the project supports them, verify breakpoints and content extremes, review accessibility and no-overflow behavior, and document any unresolved issue.

Avoid asking Cursor to rewrite the entire repo or to invent a new API contract. Make changes incrementally.

## 13. Acceptance criteria / definition of done

- [ ] Initial homepage shows **no synthetic result** before the first check.
- [ ] Purple hero at `#8537E7` with approved logo on white rounded backing and the single supplied hero image including its embedded organic shape.
- [ ] No menu icon or dead navigation.
- [ ] Product name and pasted ingredient/material text both submit correctly under existing API rules.
- [ ] All three statuses render with correct icon, color, label, **API headline**, and **single API explanation**.
- [ ] Flagged ingredients are names only, shown only when supplied; count matches rendered entries.
- [ ] “You gave us:” truncates and expands accurately; original content is preserved.
- [ ] Long lists, names, descriptions, large fonts, and narrow widths never clip or cause horizontal scrolling.
- [ ] Yes/No feedback conforms to existing contract; failures are recoverable.
- [ ] “Check another product” resets analysis, feedback, and input and focuses checker.
- [ ] Loading, validation, network/server errors, and retry are accessible and correctly handled.
- [ ] No invented ingredient assessments or individual flagged-ingredient explanations.
- [ ] No client-side Gemini call, exposed secret, backend/schema alteration, or unwanted extra feature.
- [ ] Existing tests pass; targeted edge-case checks performed and summarized.

## 14. Open items before production merge

These must be confirmed from the real repository and supplied assets, rather than guessed:
- Exact `POST /api/analyze` request and response schemas (including input type detection and original-input field name).
- Exact `flaggedIngredients` element shape and whether values can be absent/null.
- Feedback request/association and response semantics.
- Server-side input maximum length and error statuses.
- File locations for approved VulvaCare logo and final hero illustration (with organic shape already embedded).
- Any existing privacy notice or required footer text in project requirements.

**Do not block layout work on the last two asset paths: use documented placeholders, then swap in approved files once exported.**
