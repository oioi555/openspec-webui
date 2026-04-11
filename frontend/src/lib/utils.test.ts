import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatChangeName } from './utils';

test('formatChangeName removes archived change date prefixes', () => {
  assert.equal(formatChangeName('2026-04-10-refactor-tabbar-vscode-style'), 'refactor-tabbar-vscode-style');
});

test('formatChangeName leaves active change names unchanged', () => {
  assert.equal(formatChangeName('refactor-tabbar-vscode-style'), 'refactor-tabbar-vscode-style');
});

test('formatChangeName only removes a leading archive date prefix', () => {
  assert.equal(formatChangeName('refactor-2026-04-10-tabbar'), 'refactor-2026-04-10-tabbar');
});
