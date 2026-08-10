/**
 * Unit tests for menuNavigation.ts — pure index-math and action-resolution
 * helpers for the dropdown menu keyboard interface.
 *
 * No DOM required: all tested functions are pure.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  nextIndex,
  previousIndex,
  firstIndex,
  lastIndex,
  isTextInputTag,
  resolveNavigationAction,
} from './menuNavigation';

// ---------------------------------------------------------------------------
// nextIndex / previousIndex (circular)
// ---------------------------------------------------------------------------

test('nextIndex wraps from last to first', () => {
  assert.equal(nextIndex(2, 3), 0);
});

test('nextIndex advances normally', () => {
  assert.equal(nextIndex(0, 3), 1);
  assert.equal(nextIndex(1, 3), 2);
});

test('nextIndex returns -1 for empty list', () => {
  assert.equal(nextIndex(0, 0), -1);
});

test('previousIndex wraps from first to last', () => {
  assert.equal(previousIndex(0, 3), 2);
});

test('previousIndex moves backward normally', () => {
  assert.equal(previousIndex(2, 3), 1);
  assert.equal(previousIndex(1, 3), 0);
});

test('previousIndex returns -1 for empty list', () => {
  assert.equal(previousIndex(0, 0), -1);
});

// ---------------------------------------------------------------------------
// firstIndex / lastIndex
// ---------------------------------------------------------------------------

test('firstIndex always returns 0', () => {
  assert.equal(firstIndex(), 0);
});

test('lastIndex returns count - 1', () => {
  assert.equal(lastIndex(3), 2);
  assert.equal(lastIndex(1), 0);
});

test('lastIndex returns -1 for empty list', () => {
  assert.equal(lastIndex(0), -1);
});

// ---------------------------------------------------------------------------
// isTextInputTag
// ---------------------------------------------------------------------------

test('isTextInputTag returns true for INPUT with text type', () => {
  assert.equal(isTextInputTag('INPUT', 'text'), true);
  assert.equal(isTextInputTag('INPUT', 'search'), true);
  assert.equal(isTextInputTag('INPUT', 'email'), true);
  assert.equal(isTextInputTag('INPUT', 'url'), true);
  assert.equal(isTextInputTag('INPUT', 'password'), true);
  assert.equal(isTextInputTag('INPUT', ''), true);
});

test('isTextInputTag returns true for INPUT with no type', () => {
  assert.equal(isTextInputTag('INPUT'), true);
});

test('isTextInputTag returns true for TEXTAREA', () => {
  assert.equal(isTextInputTag('TEXTAREA'), true);
});

test('isTextInputTag returns false for BUTTON', () => {
  assert.equal(isTextInputTag('BUTTON'), false);
});

test('isTextInputTag returns false for non-text INPUT types', () => {
  assert.equal(isTextInputTag('INPUT', 'checkbox'), false);
  assert.equal(isTextInputTag('INPUT', 'radio'), false);
  assert.equal(isTextInputTag('INPUT', 'submit'), false);
  assert.equal(isTextInputTag('INPUT', 'number'), false);
});

test('isTextInputTag returns false for DIV', () => {
  assert.equal(isTextInputTag('DIV'), false);
});

// ---------------------------------------------------------------------------
// resolveNavigationAction
// ---------------------------------------------------------------------------

test('ArrowDown on button returns arrow-nav', () => {
  assert.equal(resolveNavigationAction('ArrowDown', 'BUTTON'), 'arrow-nav');
});

test('ArrowUp on button returns arrow-nav', () => {
  assert.equal(resolveNavigationAction('ArrowUp', 'BUTTON'), 'arrow-nav');
});

test('Home on button returns home-end', () => {
  assert.equal(resolveNavigationAction('Home', 'BUTTON'), 'home-end');
});

test('End on button returns home-end', () => {
  assert.equal(resolveNavigationAction('End', 'BUTTON'), 'home-end');
});

test('Escape returns escape regardless of target', () => {
  assert.equal(resolveNavigationAction('Escape', 'BUTTON'), 'escape');
  assert.equal(resolveNavigationAction('Escape', 'INPUT', 'text'), 'escape');
  assert.equal(resolveNavigationAction('Escape', 'TEXTAREA'), 'escape');
});

test('ArrowDown on text input returns null (caret movement)', () => {
  assert.equal(resolveNavigationAction('ArrowDown', 'INPUT', 'text'), null);
  assert.equal(resolveNavigationAction('ArrowDown', 'INPUT', 'search'), null);
  assert.equal(resolveNavigationAction('ArrowDown', 'INPUT', ''), null);
  assert.equal(resolveNavigationAction('ArrowDown', 'INPUT'), null);
});

test('ArrowUp on text input returns null', () => {
  assert.equal(resolveNavigationAction('ArrowUp', 'INPUT', 'text'), null);
});

test('ArrowDown on textarea returns null', () => {
  assert.equal(resolveNavigationAction('ArrowDown', 'TEXTAREA'), null);
});

test('ArrowUp on textarea returns null', () => {
  assert.equal(resolveNavigationAction('ArrowUp', 'TEXTAREA'), null);
});

test('Home on text input returns null', () => {
  assert.equal(resolveNavigationAction('Home', 'INPUT', 'text'), null);
});

test('End on text input returns null', () => {
  assert.equal(resolveNavigationAction('End', 'INPUT', 'text'), null);
});

test('Home on textarea returns null', () => {
  assert.equal(resolveNavigationAction('Home', 'TEXTAREA'), null);
});

test('End on textarea returns null', () => {
  assert.equal(resolveNavigationAction('End', 'TEXTAREA'), null);
});

test('ArrowDown on checkbox input returns arrow-nav (not text input)', () => {
  assert.equal(resolveNavigationAction('ArrowDown', 'INPUT', 'checkbox'), 'arrow-nav');
});

test('Tab returns null (native behavior)', () => {
  assert.equal(resolveNavigationAction('Tab', 'BUTTON'), null);
});

test('Enter returns null (handled by item)', () => {
  assert.equal(resolveNavigationAction('Enter', 'BUTTON'), null);
});

test('Space returns null (handled by item)', () => {
  assert.equal(resolveNavigationAction(' ', 'BUTTON'), null);
});

test('unknown key returns null', () => {
  assert.equal(resolveNavigationAction('F1', 'BUTTON'), null);
});

// ---------------------------------------------------------------------------
// Integration: navigate through 3 items
// ---------------------------------------------------------------------------

test('navigation through 3 items: forward wraps, backward wraps', () => {
  const count = 3;

  // Start at 0, go forward 3 times → back to 0
  let idx = 0;
  idx = nextIndex(idx, count); // 1
  assert.equal(idx, 1);
  idx = nextIndex(idx, count); // 2
  assert.equal(idx, 2);
  idx = nextIndex(idx, count); // 0 (wrap)
  assert.equal(idx, 0);

  // From 0, go backward → 2 (wrap)
  idx = previousIndex(idx, count);
  assert.equal(idx, 2);

  // From 2, go backward → 1 → 0
  idx = previousIndex(idx, count);
  assert.equal(idx, 1);
  idx = previousIndex(idx, count);
  assert.equal(idx, 0);
});
