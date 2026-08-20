import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import {
  getToolCompatibilityReference,
  normalizeCommandAvailability,
  setActiveProjectContext,
} from './api';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  setActiveProjectContext(null);
});

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
        sharedSkillTarget: 'zed',
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
        sharedSkillTarget: 'zed',
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

test('normalizeCommandAvailability retains legacy shared-target metadata', () => {
  const normalized = normalizeCommandAvailability({
    status: 'ready',
    workflows: ['propose'],
    integrations: [{
      tool: 'Shared .agents / Codex',
      delivery: 'skills',
      form: 'skill-slash',
      example: '/openspec-propose or $openspec-propose',
      source: '.agents/skills/openspec-propose/SKILL.md',
      sharedSkillTarget: 'legacy',
    }],
  });

  assert.equal(normalized.integrations[0]?.sharedSkillTarget, 'legacy');
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

test('getToolCompatibilityReference loads project-independent reference data', async () => {
  const requests: Request[] = [];
  const fixture = {
    officialDefinitions: [],
    officialSource: {
      version: 'v1.10.0',
      url: 'https://example.test/supported-tools',
      verifiedAt: '2026-08-20',
    },
    sharedCompatibility: [],
  };
  globalThis.fetch = async (input, init) => {
    requests.push(new Request(new URL(String(input), 'http://localhost'), init));
    return new Response(JSON.stringify(fixture), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  setActiveProjectContext('active-project');

  assert.deepEqual(await getToolCompatibilityReference(), fixture);
  assert.equal(requests[0]?.url.endsWith('/api/tool-reference'), true);
  assert.equal(requests[0]?.headers.has('X-Project-Id'), false);
});
