import assert from 'node:assert/strict';
import { test } from 'node:test';

import { normalizeCommandAvailability } from './api';

test('normalizeCommandAvailability passes through a full additive payload', () => {
  const normalized = normalizeCommandAvailability({
    status: 'ready',
    profile: 'core',
    workflows: ['propose', 'apply'],
    delivery: 'both',
    integrations: [
      {
        tool: 'claude',
        delivery: 'commands',
        form: 'opsx-colon',
        example: '/opsx:propose',
        source: '.claude/commands/opsx/propose.md',
      },
    ],
    forms: ['opsx-colon', 'skill-slash'],
    toolOptions: [
      { tool: 'Claude Code', form: 'opsx-colon' },
      { tool: 'Shared .agents', form: 'skill-slash' },
      { tool: 'Codex', form: 'skill-dollar' },
    ],
    error: null,
  });

  assert.deepEqual(normalized, {
    status: 'ready',
    profile: 'core',
    workflows: ['propose', 'apply'],
    delivery: 'both',
    integrations: [
      {
        tool: 'claude',
        delivery: 'commands',
        form: 'opsx-colon',
        example: '/opsx:propose',
        source: '.claude/commands/opsx/propose.md',
        commands: null,
        skills: null,
      },
    ],
    forms: ['opsx-colon', 'skill-slash'],
    toolOptions: [
      { tool: 'Claude Code', form: 'opsx-colon' },
      { tool: 'Shared .agents', form: 'skill-slash' },
      { tool: 'Codex', form: 'skill-dollar' },
    ],
    error: null,
  });
});

test('normalizeCommandAvailability defaults additive fields when the server predates them', () => {
  const normalized = normalizeCommandAvailability({
    status: 'ready',
    profile: 'core',
    workflows: ['propose', 'apply'],
    error: null,
  });

  assert.equal(normalized.status, 'ready');
  assert.equal(normalized.delivery, null);
  assert.deepEqual(normalized.integrations, []);
  assert.deepEqual(normalized.forms, []);
  assert.deepEqual(normalized.toolOptions, []);
});

test('normalizeCommandAvailability ignores the retired availableExpandedCommands field', () => {
  const normalized = normalizeCommandAvailability({
    status: 'ready',
    profile: 'core',
    workflows: ['propose', 'apply'],
    availableExpandedCommands: ['new', 'verify'],
    error: null,
  });

  assert.equal('availableExpandedCommands' in normalized, false);
  assert.deepEqual(normalized.workflows, ['propose', 'apply']);
});

test('normalizeCommandAvailability filters malformed integrations and form ids', () => {
  const normalized = normalizeCommandAvailability({
    status: 'ready',
    profile: 'core',
    workflows: [],
    delivery: 'both',
    integrations: [
      { tool: 'claude', delivery: 'commands', form: 'opsx-colon', example: '/opsx:propose', source: 'a' },
      { tool: 'broken', delivery: 'bogus', form: 'nope', example: 42, source: 'b' },
      'not-an-object',
    ],
    forms: ['opsx-colon', 'unknown-form', 'skill-dollar', 7],
    error: null,
  });

  assert.deepEqual(normalized.integrations, [
    { tool: 'claude', delivery: 'commands', form: 'opsx-colon', example: '/opsx:propose', source: 'a', commands: null, skills: null },
  ]);
  assert.deepEqual(normalized.forms, ['opsx-colon', 'skill-dollar']);
});

test('normalizeCommandAvailability filters malformed tool options and unknown forms', () => {
  const normalized = normalizeCommandAvailability({
    status: 'ready',
    profile: 'core',
    workflows: [],
    toolOptions: [
      { tool: 'Claude Code', form: 'opsx-colon' },
      { tool: 'Broken', form: 'not-a-form' },
      { tool: 42, form: 'skill-slash' },
      'not-an-object',
    ],
    error: null,
  });

  assert.deepEqual(normalized.toolOptions, [{ tool: 'Claude Code', form: 'opsx-colon' }]);
});

test('normalizeCommandAvailability degrades malformed payloads to unavailable', () => {
  assert.deepEqual(normalizeCommandAvailability(null), {
    status: 'unavailable',
    profile: null,
    workflows: [],
    delivery: null,
    integrations: [],
    forms: [],
    toolOptions: [],
    error: null,
  });

  const normalized = normalizeCommandAvailability({ status: 'bogus', workflows: 'nope' });
  assert.equal(normalized.status, 'unavailable');
  assert.deepEqual(normalized.workflows, []);
  assert.equal(normalized.error, null);
});
