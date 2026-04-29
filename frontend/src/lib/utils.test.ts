import assert from 'node:assert/strict';
import { test } from 'node:test';

import { copyToClipboard, formatChangeName, formatDate } from './utils';

test('formatChangeName removes archived change date prefixes', () => {
  assert.equal(formatChangeName('2026-04-10-refactor-tabbar-vscode-style'), 'refactor-tabbar-vscode-style');
});

test('formatChangeName leaves active change names unchanged', () => {
  assert.equal(formatChangeName('refactor-tabbar-vscode-style'), 'refactor-tabbar-vscode-style');
});

test('formatChangeName only removes a leading archive date prefix', () => {
  assert.equal(formatChangeName('refactor-2026-04-10-tabbar'), 'refactor-2026-04-10-tabbar');
});

test('formatDate returns locale-aware text for valid ISO strings', () => {
  assert.equal(formatDate('2026-04-10T12:34:56.000Z', 'en-US'), 'Apr 10, 2026');
});

test('formatDate returns empty string for nullish input', () => {
  assert.equal(formatDate(null), '');
  assert.equal(formatDate(undefined), '');
});

test('formatDate returns empty string for malformed input', () => {
  assert.equal(formatDate('not-a-date'), '');
  assert.equal(formatDate('2026-99-99'), '');
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
