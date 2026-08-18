import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  copyToClipboard,
  formatChangeName,
  formatDate,
  isArchivedChangeName,
  matchesArchivedChangeName,
} from './utils';

test('formatChangeName removes archived change date prefixes', () => {
  assert.equal(formatChangeName('2026-04-10-refactor-tabbar-vscode-style'), 'refactor-tabbar-vscode-style');
});

test('formatChangeName leaves active change names unchanged', () => {
  assert.equal(formatChangeName('refactor-tabbar-vscode-style'), 'refactor-tabbar-vscode-style');
});

test('formatChangeName only removes a leading archive date prefix', () => {
  assert.equal(formatChangeName('refactor-2026-04-10-tabbar'), 'refactor-2026-04-10-tabbar');
});

test('matchesArchivedChangeName accepts exact archived names', () => {
  assert.equal(matchesArchivedChangeName('2026-04-10-fix-tab-icon', '2026-04-10-fix-tab-icon'), true);
});

test('matchesArchivedChangeName accepts a date-prefixed archive of an original name', () => {
  assert.equal(matchesArchivedChangeName('fix-tab-icon', '2026-04-10-fix-tab-icon'), true);
});

test('matchesArchivedChangeName rejects unrelated archive names', () => {
  assert.equal(matchesArchivedChangeName('fix-tab-icon', '2026-04-10-fix-activity-bar'), false);
});

test('matchesArchivedChangeName preserves date-like prefixes in original names', () => {
  assert.equal(
    matchesArchivedChangeName('2025-12-01-fix-tab-icon', '2026-04-10-2025-12-01-fix-tab-icon'),
    true,
  );
  assert.equal(matchesArchivedChangeName('fix-tab-icon', '2026-04-10-2025-12-01-fix-tab-icon'), false);
});

test('isArchivedChangeName follows refreshed archive names for an open original-name tab', () => {
  const changeName = 'fix-tab-icon';

  assert.equal(isArchivedChangeName(changeName, []), false);
  assert.equal(isArchivedChangeName(changeName, ['2026-04-10-fix-tab-icon']), true);
});

test('formatDate returns canonical local text for valid ISO strings', () => {
  const d = new Date('2026-04-10T12:34:56.000Z');
  const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  assert.equal(formatDate('2026-04-10T12:34:56.000Z'), expected);
});

test('formatDate returns empty string for nullish input', () => {
  assert.equal(formatDate(null), '');
  assert.equal(formatDate(undefined), '');
});

test('formatDate returns empty string for malformed input', () => {
  assert.equal(formatDate('not-a-date'), '');
  assert.equal(formatDate('2026-99-99'), '');
});

test('formatDate zero-pads canonical local date and time parts', () => {
  const d = new Date('2026-01-02T03:04:56.000Z');
  const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  assert.equal(formatDate('2026-01-02T03:04:56.000Z'), expected);
});

test('copyToClipboard writes text to navigator clipboard', async () => {
  const clipboardCalls: string[] = [];
  const originalNavigator = globalThis.navigator;
  const originalToast = (globalThis as { __OPENSPEC_TEST_TOAST__?: unknown }).__OPENSPEC_TEST_TOAST__;

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      clipboard: {
        writeText: async (text: string) => {
          clipboardCalls.push(text);
        },
      },
    },
  });

  const successCalls: string[] = [];
  const errorCalls: string[] = [];
  Object.assign(globalThis, {
    __OPENSPEC_TEST_TOAST__: {
      success: (message: string) => successCalls.push(message),
      error: (message: string) => errorCalls.push(message),
    },
  });

  try {
    await copyToClipboard('npm install -g openspec-webui@latest', 'OpenSpec WebUI');
    assert.deepEqual(clipboardCalls, ['npm install -g openspec-webui@latest']);
    assert.equal(successCalls.length, 1);
    assert.equal(errorCalls.length, 0);
  } finally {
    if (originalNavigator) {
      Object.defineProperty(globalThis, 'navigator', { configurable: true, value: originalNavigator });
    }
    if (originalToast === undefined) {
      delete (globalThis as { __OPENSPEC_TEST_TOAST__?: unknown }).__OPENSPEC_TEST_TOAST__;
    } else {
      Object.assign(globalThis, { __OPENSPEC_TEST_TOAST__: originalToast });
    }
  }
});
