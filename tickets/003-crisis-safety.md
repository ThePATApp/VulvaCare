# 003: Crisis messages go to people, not AI

**Status:** Done (already built in the starter, use it as a model)
**Owner:** CodeSquad
**Size:** S
**Spec link:** SPEC.md Part A (Responsible AI)

## User story
As someone in a crisis
I want to be pointed to a real person immediately
So that I get safe help instead of an AI guess

## Acceptance criteria

```gherkin
Feature: Crisis safety

  Scenario: Self-harm language
    When I send "I want to end my life"
    Then the AI model is not called
    And I see a message that includes "988" and "911"
    And the chat log records skill "safety-guardrail" without my message

  Scenario: Medical question
    When I ask "What dose of medicine should my kid take for a fever?"
    Then the answer ends with "not medical advice"
```

## Notes
- Files: `skills/safety-guardrail/tool.js`, `server/agent/agent.js`
- Tests: `tests/guardrail.test.js`, `tests/agent.test.js`
