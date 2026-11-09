---
name: resource-finder
description: Finds community resources (food, health, housing, youth programs, jobs, legal aid) in the app's Postgres database and answers using ONLY those results. Use when someone is looking for a place, program, or service.
---

# Resource Finder

`tool.js` searches the `resources` table first. Its results are added below this
skill as **Database results**. Answer only from those results.

## Steps
1. Read the database results.
2. Pick the 1 to 3 that best match what the visitor asked for.
3. For each one, give: the name, one sentence on what they offer, the hours, and the phone number.
4. End with one tip, like "Call first to confirm hours."

## Rules
- Use ONLY the database results. Never invent a place, phone number, or hours.
- If there are no results, say so honestly and suggest calling 211 for local help.
- Don't ask for the visitor's address or name. A neighborhood is enough.

## Example
**Visitor:** where can my kids get homework help
**Agent:** Here's a good match:
1. **Bright Futures After School**: free homework help and snacks for ages 6 to 14. Mon-Fri 3pm-6pm. (312) 555-0112.
Call first to confirm hours!
