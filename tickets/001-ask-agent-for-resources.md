# 001: Ask the agent for a community resource

**Status:** Done (already built in the starter, use it as a model)
**Owner:** CodeSquad
**Size:** M
**Spec link:** SPEC.md section 5

## User story
As a parent who works evenings
I want to ask a question in plain words and get matching local programs
So that I don't have to dig through ten websites on my phone

## Acceptance criteria

```gherkin
Feature: Ask the agent for a community resource

  Background:
    Given the resources table has the 30 sample rows
    And the skill picker is set to "Auto"

  Scenario: Find homework help
    When I ask "Where can my kids get homework help?"
    Then the answer mentions "Bright Futures After School"
    And the label under the answer says "skill: resource-finder"

  Scenario: No match in the database
    When I ask "Where can I adopt a puppy?"
    Then the answer says no match was found
    And the answer suggests calling 211
    But the answer does not invent a place or phone number

  Scenario: Phone numbers are removed before the AI sees them
    When I ask "My number is 312-555-0199, where is a food pantry?"
    Then the AI never receives "312-555-0199"
    And the answer says personal information was removed
```

## Notes
- Files: `server/agent/agent.js`, `skills/resource-finder/`, `server/db/resources.js`, `src/components/ChatPanel.jsx`
- Skills used: safety-guardrail, intent-router, resource-finder
- Database: reads `resources`, writes `chat_logs` (skill name only, never the message)
- Tests: `tests/agent.test.js`, `tests/guardrail.test.js`
