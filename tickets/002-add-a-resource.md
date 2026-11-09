# 002: Add a resource to the database

**Status:** Done (already built in the starter, use it as a model)
**Owner:** CodeSquad
**Size:** S
**Spec link:** SPEC.md section 7

## User story
As a team member collecting local programs
I want to add a resource from the web page
So that the agent can recommend it right away

## Acceptance criteria

```gherkin
Feature: Add a resource

  Scenario: Save a complete resource
    Given I opened the "+ Add one" form
    When I save "Teen Art Studio" in "Youth" with the description "Free art classes for teens"
    Then I see "Saved to the database!"
    And "Teen Art Studio" appears in the resource list
    And it is still there after the server restarts

  Scenario Outline: Bad input is rejected with a friendly message
    Given I opened the "+ Add one" form
    When I save a resource with <problem>
    Then I see the message "<message>"
    And nothing new is saved

    Examples:
      | problem                   | message                                     |
      | a 1-letter name           | Name is required.                           |
      | a 3-letter description    | Add a short description.                    |
      | the website "example.com" | Website must start with http:// or https:// |
```

## Notes
- Files: `src/components/ResourceBoard.jsx`, `server/routes/api.js`, `server/validation.js`, `server/db/resources.js`
- Validation: zod `NewResource` with `.safeParse()` before the database
- Tests: `tests/validation.test.js`
