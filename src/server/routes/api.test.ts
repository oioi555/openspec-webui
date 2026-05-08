import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  normalizeValidationOptions,
  buildValidationArgs,
  buildValidationCommandString,
} from './api.js';

test('normalizeValidationOptions returns defaults for empty/missing body', () => {
  assert.deepEqual(normalizeValidationOptions(null), { strict: true, concurrency: null });
  assert.deepEqual(normalizeValidationOptions(undefined), { strict: true, concurrency: null });
  assert.deepEqual(normalizeValidationOptions({}), { strict: true, concurrency: null });
});

test('normalizeValidationOptions preserves valid strict boolean', () => {
  assert.equal(normalizeValidationOptions({ strict: false }).strict, false);
  assert.equal(normalizeValidationOptions({ strict: true }).strict, true);
});

test('normalizeValidationOptions accepts positive integer concurrency', () => {
  assert.equal(normalizeValidationOptions({ concurrency: 4 }).concurrency, 4);
  assert.equal(normalizeValidationOptions({ concurrency: 1 }).concurrency, 1);
});

test('normalizeValidationOptions normalizes invalid concurrency to null', () => {
  assert.equal(normalizeValidationOptions({ concurrency: 0 }).concurrency, null);
  assert.equal(normalizeValidationOptions({ concurrency: -1 }).concurrency, null);
  assert.equal(normalizeValidationOptions({ concurrency: 3.5 }).concurrency, null);
  assert.equal(normalizeValidationOptions({ concurrency: '4' }).concurrency, null);
});

test('buildValidationArgs produces default command with strict', () => {
  const args = buildValidationArgs({ strict: true, concurrency: null });
  assert.deepEqual(args, ['validate', '--all', '--strict', '--json']);
});

test('buildValidationArgs omits --strict when strict is false', () => {
  const args = buildValidationArgs({ strict: false, concurrency: null });
  assert.deepEqual(args, ['validate', '--all', '--json']);
  assert.equal(args.includes('--strict'), false);
});

test('buildValidationArgs includes --concurrency n when concurrency is set', () => {
  const args = buildValidationArgs({ strict: true, concurrency: 8 });
  assert.deepEqual(args, ['validate', '--all', '--strict', '--concurrency', '8', '--json']);
});

test('buildValidationArgs combines strict=false with concurrency', () => {
  const args = buildValidationArgs({ strict: false, concurrency: 2 });
  assert.deepEqual(args, ['validate', '--all', '--concurrency', '2', '--json']);
});

test('buildValidationCommandString joins args with openspec prefix', () => {
  const cmd = buildValidationCommandString(['validate', '--all', '--strict', '--json']);
  assert.equal(cmd, 'openspec validate --all --strict --json');
});
