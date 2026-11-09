---
name: safety-guardrail
description: Runs on EVERY message before any other skill. Removes personal information (phone numbers, emails, SSNs, card numbers) and flags crisis, medical, and legal topics so the agent answers safely. Never chosen by the router.
---

# Safety Guardrail

This skill is mostly code (`tool.js`), so it is fast, free, and always the same.
The AI model never sees personal information, because it is removed first.

## What it does
1. Replaces personal information with labels like `[phone removed]`.
2. Flags topics that need extra care:
   - **crisis**: self-harm or immediate danger. The agent skips the AI and shows emergency numbers.
   - **medical**: the answer gets a "not medical advice" note.
   - **legal**: the answer gets a "not legal advice" note.

## Rules
- Runs first, every time. Do not turn it off.
- When in doubt, flag it. A false alarm is better than a missed one.

## Make it yours
Add patterns to `PII_RULES` or `TOPIC_RULES` in `tool.js`, then run `npm test`.
