import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AnalyzeAssessment, AnalyzeRequest, ChatRequest, NewResource, firstError } from '../server/validation.js';

test('chat requests need a message', () => {
  assert.equal(ChatRequest.safeParse({ message: '   ' }).success, false);
  assert.equal(ChatRequest.safeParse({ message: 'hi', skill: 'auto' }).success, true);
  assert.equal(ChatRequest.safeParse({ message: 'hi', skill: '../../etc' }).success, false);
});

test('new resources are checked with friendly messages', () => {
  const bad = NewResource.safeParse({ name: 'X', category: 'Pizza', description: 'short' });
  assert.equal(bad.success, false);
  assert.match(firstError(bad), /Name is required/);
  const wrongCategory = NewResource.safeParse({ name: 'Good Place', category: 'Pizza', description: 'A real description' });
  assert.match(firstError(wrongCategory), /Category must be one of/);
  const good = NewResource.safeParse({ name: 'Good Place', category: 'Food', description: 'Free meals on Fridays', website: '' });
  assert.equal(good.success, true);
  assert.equal(good.data.languages, 'English');
  const badSite = NewResource.safeParse({ name: 'Good Place', category: 'Food', description: 'Free meals on Fridays', website: 'example.com' });
  assert.equal(firstError(badSite), 'Website must start with http:// or https://');
  assert.equal(NewResource.safeParse({ name: 'Ab', category: 'Food', description: 'Free meals' , website: 'https://example.org/x' }).success, true);
});

test('ticket 002 examples give the exact messages', () => {
  const base = { name: 'Good Place', category: 'Food', description: 'Free meals on Fridays' };
  assert.equal(firstError(NewResource.safeParse({ ...base, name: 'A' })), 'Name is required.');
  assert.equal(firstError(NewResource.safeParse({ ...base, description: 'abc' })), 'Add a short description.');
});

test('analyze requests accept a product name or an ingredient list', () => {
  const product = AnalyzeRequest.safeParse({
    inputType: 'product',
    userInput: '  Example Gentle Body Wash  ',
    notes: 'ignored',
  });
  assert.equal(product.success, true);
  assert.equal(product.data.inputType, 'product');
  assert.equal(product.data.userInput, 'Example Gentle Body Wash');
  assert.equal('notes' in product.data, false);

  const ingredients = AnalyzeRequest.safeParse({
    inputType: 'ingredients',
    userInput: 'Water, Glycerin, Sodium Lauryl Sulfate, Fragrance',
  });
  assert.equal(ingredients.success, true);
  assert.equal(ingredients.data.userInput, 'Water, Glycerin, Sodium Lauryl Sulfate, Fragrance');
  assert.equal(AnalyzeRequest.safeParse({ inputType: 'product', userInput: 'a'.repeat(5000) }).success, true);
});

test('blank analyze input is rejected with the contract message', () => {
  assert.equal(firstError(AnalyzeRequest.safeParse({ inputType: 'product', userInput: '' })), 'Type a product name or ingredient list first.');
  assert.equal(firstError(AnalyzeRequest.safeParse({ inputType: 'ingredients', userInput: ' \n\t ' })), 'Type a product name or ingredient list first.');
  assert.equal(firstError(AnalyzeRequest.safeParse({ inputType: 'product' })), 'Type a product name or ingredient list first.');
});

test('analyze inputType must be product or ingredients', () => {
  assert.equal(
    firstError(AnalyzeRequest.safeParse({ inputType: 'formula', userInput: 'Example Wash' })),
    'inputType must be "product" or "ingredients".',
  );
  assert.equal(
    firstError(AnalyzeRequest.safeParse({ userInput: 'Example Wash' })),
    'inputType must be "product" or "ingredients".',
  );
});

test('analyze input over 5000 characters is rejected', () => {
  const overlong = AnalyzeRequest.safeParse({ inputType: 'ingredients', userInput: `  ${'a'.repeat(5001)}  ` });
  assert.equal(overlong.success, false);
  assert.equal(firstError(overlong), 'Keep the product name or ingredient list under 5000 characters.');
});

test('structured assessments accept the three statuses inside the length limits', () => {
  const unknown = AnalyzeAssessment.safeParse({
    status: 'unknown',
    headline: '  Formulation could not be verified  ',
    explanation: 'Please provide the ingredient list.',
    flaggedIngredients: [],
    extra: 'ignored',
  });
  assert.equal(unknown.success, true);
  assert.equal(unknown.data.headline, 'Formulation could not be verified');
  assert.deepEqual(unknown.data.flaggedIngredients, []);
  assert.equal('extra' in unknown.data, false);

  const caution = AnalyzeAssessment.safeParse({
    status: 'caution',
    headline: 'Fragrance may irritate',
    explanation: 'a'.repeat(600),
    flaggedIngredients: ['  Fragrance  ', 'b'.repeat(120)],
  });
  assert.equal(caution.success, true);
  assert.deepEqual(caution.data.flaggedIngredients, ['Fragrance', 'b'.repeat(120)]);

  const lower = AnalyzeAssessment.safeParse({
    status: 'lower_concern',
    headline: 'a'.repeat(140),
    explanation: 'Checked ingredients do not stand out.',
    flaggedIngredients: [],
  });
  assert.equal(lower.success, true);
  assert.equal(lower.data.headline.length, 140);
});

test('structured assessments reject statuses outside the three allowed values', () => {
  const bad = AnalyzeAssessment.safeParse({
    status: 'safe',
    headline: 'Looks fine',
    explanation: 'This should not pass.',
    flaggedIngredients: [],
  });
  assert.equal(bad.success, false);
  assert.equal(firstError(bad), 'Status must be lower_concern, caution, or unknown.');
});

test('structured assessments enforce output length limits', () => {
  const base = {
    status: 'unknown',
    headline: 'Could not verify',
    explanation: 'Paste the ingredient list.',
    flaggedIngredients: [],
  };
  assert.equal(
    firstError(AnalyzeAssessment.safeParse({ ...base, headline: 'a'.repeat(141) })),
    'Headline must be 140 characters or fewer.',
  );
  assert.equal(
    firstError(AnalyzeAssessment.safeParse({ ...base, headline: 'Two\nlines' })),
    'Headline must be one short line.',
  );
  assert.equal(firstError(AnalyzeAssessment.safeParse({ ...base, headline: '   ' })), 'Headline is required.');
  assert.equal(
    firstError(AnalyzeAssessment.safeParse({ ...base, explanation: 'a'.repeat(601) })),
    'Explanation must be 600 characters or fewer.',
  );
  assert.equal(firstError(AnalyzeAssessment.safeParse({ ...base, explanation: '   ' })), 'Explanation is required.');
  const shortExplanation = AnalyzeAssessment.safeParse({ ...base, explanation: 'Too vague.' });
  assert.equal(shortExplanation.success, true);

  const tooMany = AnalyzeAssessment.safeParse({
    ...base,
    status: 'caution',
    flaggedIngredients: Array.from({ length: 31 }, (_, i) => `Ingredient ${i}`),
  });
  assert.equal(firstError(tooMany), 'Flag at most 30 ingredients.');
  assert.equal(
    firstError(AnalyzeAssessment.safeParse({ ...base, status: 'caution', flaggedIngredients: ['c'.repeat(121)] })),
    'Each flagged ingredient must be 120 characters or fewer.',
  );
  assert.equal(
    firstError(AnalyzeAssessment.safeParse({ ...base, status: 'caution', flaggedIngredients: ['  '] })),
    'Each flagged ingredient needs a name.',
  );
});

test('unknown and lower concern list no ingredients, and caution lists at least one', () => {
  const unknown = {
    status: 'unknown',
    headline: 'Could not verify',
    explanation: 'Paste the ingredient list.',
    flaggedIngredients: ['Fragrance'],
  };
  assert.equal(firstError(AnalyzeAssessment.safeParse(unknown)), 'Only a caution result can list flagged ingredients.');
  assert.equal(
    firstError(AnalyzeAssessment.safeParse({ ...unknown, status: 'lower_concern' })),
    'Only a caution result can list flagged ingredients.',
  );
  assert.equal(
    firstError(AnalyzeAssessment.safeParse({ ...unknown, status: 'caution', flaggedIngredients: [] })),
    'A caution result must list the flagged ingredients.',
  );
});
