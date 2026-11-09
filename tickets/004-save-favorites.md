# 004: Save favorite resources (EXAMPLE TICKET FOR YOU TO BUILD)

**Status:** To Do
**Owner:** TODO
**Size:** M
**Spec link:** SPEC.md section 5

## User story
As a parent who checks the app on her phone between shifts
I want to save resources I like with one tap
So that I can find them again without searching

## Acceptance criteria

```gherkin
Feature: Favorites

  Scenario: Save a favorite
    Given I see "Northside Community Pantry" in the resource list
    When I tap the star on it
    Then the star turns filled in
    And "Northside Community Pantry" appears in a "My favorites" section

  Scenario: Favorites survive a page refresh
    Given I saved "Northside Community Pantry" as a favorite
    When I refresh the page
    Then it is still in "My favorites"

  Scenario: Remove a favorite
    Given "Northside Community Pantry" is in "My favorites"
    When I tap its filled star
    Then it disappears from "My favorites"

  Scenario: No login, no personal info
    When I save a favorite
    Then the app does not ask for my name, email, or phone
```

## Notes
- Hint: no accounts in this sprint. Store favorite IDs in the browser (`localStorage`), or
  make a `favorites` table keyed by a random device ID.
- Files you'll likely touch: `src/components/ResourceBoard.jsx`, a new `src/components/Favorites.jsx`
- Try it two ways: build it by hand, then give this ticket to Replit Agent with the prompt in
  `docs/SPEC-DRIVEN-DEVELOPMENT.md` section 6, and compare.
