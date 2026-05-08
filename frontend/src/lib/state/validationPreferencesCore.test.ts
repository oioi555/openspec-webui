import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createDefaultValidationPreferences,
  normalizeValidationPreferences,
  toValidationRequestOptions,
} from './validationPreferencesCore';

test('default validation preferences have strict=true, concurrency=null, autoRun=false', () => {
  const defaults = createDefaultValidationPreferences();
  assert.deepEqual(defaults, {
    strict: true,
    concurrency: null,
    autoRun: false,
  });
});

test('normalizeValidationPreferences returns defaults for null/undefined/non-object', () => {
  const defaults = createDefaultValidationPreferences();
  assert.deepEqual(normalizeValidationPreferences(null), defaults);
  assert.deepEqual(normalizeValidationPreferences(undefined), defaults);
  assert.deepEqual(normalizeValidationPreferences('string'), defaults);
  assert.deepEqual(normalizeValidationPreferences(42), defaults);
});

test('normalizeValidationPreferences preserves valid boolean strict', () => {
  assert.equal(normalizeValidationPreferences({ strict: false }).strict, false);
  assert.equal(normalizeValidationPreferences({ strict: true }).strict, true);
});

test('normalizeValidationPreferences defaults strict to true for non-boolean', () => {
  assert.equal(normalizeValidationPreferences({ strict: 'yes' }).strict, true);
  assert.equal(normalizeValidationPreferences({ strict: 1 }).strict, true);
});

test('normalizeValidationPreferences accepts positive integer concurrency', () => {
  assert.equal(normalizeValidationPreferences({ concurrency: 4 }).concurrency, 4);
  assert.equal(normalizeValidationPreferences({ concurrency: 1 }).concurrency, 1);
});

test('normalizeValidationPreferences normalizes invalid concurrency to null', () => {
  assert.equal(normalizeValidationPreferences({ concurrency: 0 }).concurrency, null);
  assert.equal(normalizeValidationPreferences({ concurrency: -1 }).concurrency, null);
  assert.equal(normalizeValidationPreferences({ concurrency: 3.5 }).concurrency, null);
  assert.equal(normalizeValidationPreferences({ concurrency: '4' }).concurrency, null);
  assert.equal(normalizeValidationPreferences({ concurrency: NaN }).concurrency, null);
});

test('normalizeValidationPreferences preserves valid boolean autoRun', () => {
  assert.equal(normalizeValidationPreferences({ autoRun: true }).autoRun, true);
  assert.equal(normalizeValidationPreferences({ autoRun: false }).autoRun, false);
});

test('normalizeValidationPreferences defaults autoRun to false for non-boolean', () => {
  assert.equal(normalizeValidationPreferences({ autoRun: 'yes' }).autoRun, false);
  assert.equal(normalizeValidationPreferences({ autoRun: 1 }).autoRun, false);
});

test('toValidationRequestOptions strips autoRun', () => {
  const prefs = { strict: false, concurrency: 8, autoRun: true };
  const options = toValidationRequestOptions(prefs);
  assert.deepEqual(options, { strict: false, concurrency: 8 });
  assert.equal('autoRun' in options, false);
});
