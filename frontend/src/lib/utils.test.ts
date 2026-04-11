import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatChangeName, formatDate } from './utils';

test('formatChangeName removes archived change date prefixes', () => {
  assert.equal(formatChangeName('2026-04-10-refactor-tabbar-vscode-style'), 'refactor-tabbar-vscode-style');
});

test('formatChangeName leaves active change names unchanged', () => {
  assert.equal(formatChangeName('refactor-tabbar-vscode-style'), 'refactor-tabbar-vscode-style');
});

test('formatChangeName only removes a leading archive date prefix', () => {
  assert.equal(formatChangeName('refactor-2026-04-10-tabbar'), 'refactor-2026-04-10-tabbar');
});

test('formatDate returns YYYY-MM-DD for valid ISO strings', () => {
  assert.equal(formatDate('2026-04-10T12:34:56.000Z'), '2026-04-10');
});

test('formatDate returns empty string for nullish input', () => {
  assert.equal(formatDate(null), '');
  assert.equal(formatDate(undefined), '');
});

test('formatDate returns empty string for malformed input', () => {
  assert.equal(formatDate('not-a-date'), '');
  assert.equal(formatDate('2026-99-99'), '');
});
