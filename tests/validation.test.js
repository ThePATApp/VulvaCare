import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChatRequest, NewResource, firstError } from '../server/validation.js';

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
