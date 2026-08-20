import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { ToolCompatibilityReferenceResponse } from '../shared/types.js';
import {
  OPEN_SPEC_TOOL_DEFINITIONS,
  TOOL_COMPATIBILITY_REFERENCE,
  validateToolCompatibilityReference,
} from './tool-compatibility-reference.js';

function cloneReference(): ToolCompatibilityReferenceResponse {
  return structuredClone(TOOL_COMPATIBILITY_REFERENCE);
}

test('v1.10.0 official definition snapshot contains every upstream tool row', () => {
  assert.equal(TOOL_COMPATIBILITY_REFERENCE.officialSource.version, 'v1.10.0');
  assert.equal(OPEN_SPEC_TOOL_DEFINITIONS.length, 39);
  assert.deepEqual(
    OPEN_SPEC_TOOL_DEFINITIONS.map((definition) => definition.id),
    [
      'amazon-q', 'antigravity', 'auggie', 'bob', 'claude', 'cline',
      'command-code', 'codeartsagent', 'codebuddy', 'codex', 'devin',
      'forgecode', 'continue', 'costrict', 'crush', 'cursor', 'factory',
      'gemini', 'github-copilot', 'hermes', 'iflow', 'junie', 'kilocode',
      'kimi', 'kiro', 'lingma', 'minimax-code', 'vibe', 'oh-my-pi',
      'opencode', 'pi', 'qoder', 'qwen', 'rovodev', 'roocode', 'trae',
      'zed', 'zcode', 'agents',
    ]
  );

  const byId = new Map(OPEN_SPEC_TOOL_DEFINITIONS.map((definition) => [definition.id, definition]));
  assert.equal(byId.get('claude')?.commands?.invocation, '/opsx:<id>');
  assert.equal(byId.get('codex')?.commands, null);
  assert.equal(byId.get('codex')?.skills?.path, '.agents/skills/openspec-*/SKILL.md');
  assert.equal(byId.get('rovodev')?.commands, null);
  assert.equal(byId.get('zed')?.skills?.invocation, '/openspec-<skill> or @openspec-<skill>');
  assert.equal(byId.get('minimax-code')?.skills?.path.startsWith('~/'), true);
});

test('shared compatibility is a non-exhaustive research snapshot', () => {
  const ids = new Set(TOOL_COMPATIBILITY_REFERENCE.sharedCompatibility.map((record) => record.clientId));
  assert.ok(TOOL_COMPATIBILITY_REFERENCE.sharedCompatibility.length < OPEN_SPEC_TOOL_DEFINITIONS.length);
  assert.equal(ids.has('amazon-q'), false);
  assert.equal(ids.has('grok-build'), true);

  const partial = cloneReference();
  partial.sharedCompatibility = partial.sharedCompatibility.filter((record) => record.clientId === 'grok-build');
  assert.doesNotThrow(() => validateToolCompatibilityReference(partial));
});

test('required shared-path candidates retain reported modes and Grok Build stays external', () => {
  const byId = new Map(
    TOOL_COMPATIBILITY_REFERENCE.sharedCompatibility.map((record) => [record.clientId, record])
  );

  for (const id of [
    'opencode', 'codex', 'cursor', 'zed', 'antigravity', 'grok-build',
    'gemini', 'github-copilot', 'kimi', 'qwen', 'kilocode', 'pi',
  ]) {
    const record = byId.get(id);
    assert.equal(record?.accessMode, 'native-project', id);
    assert.ok(record?.scopes.includes('project'), id);
    assert.match(record?.researchedAt ?? '', /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.equal(byId.get('grok-build')?.openSpecToolId, undefined);
  assert.equal(byId.get('grok-build')?.evidenceKind, 'runtime-observed');
  assert.equal(byId.has('zcode'), false);
});

test('dataset validation rejects duplicate ids and broken official links', () => {
  const duplicate = cloneReference();
  duplicate.officialDefinitions.push(structuredClone(duplicate.officialDefinitions[0]!));
  assert.throws(() => validateToolCompatibilityReference(duplicate), /Duplicate official tool id/);

  const brokenLink = cloneReference();
  brokenLink.sharedCompatibility[0]!.openSpecToolId = 'missing-tool';
  assert.throws(() => validateToolCompatibilityReference(brokenLink), /unknown OpenSpec tool/);
});

test('dataset validation rejects invalid classifications, scopes, provenance, and dates', () => {
  const invalidMode = cloneReference();
  invalidMode.sharedCompatibility[0]!.accessMode = 'automatic' as never;
  assert.throws(() => validateToolCompatibilityReference(invalidMode), /Invalid access mode/);

  const invalidScope = cloneReference();
  invalidScope.sharedCompatibility[0]!.scopes = ['project', 'project'];
  assert.throws(() => validateToolCompatibilityReference(invalidScope), /Invalid or duplicate scope/);

  const missingSource = cloneReference();
  missingSource.sharedCompatibility[0]!.source = '';
  assert.throws(() => validateToolCompatibilityReference(missingSource), /requires a source/);

  const invalidDate = cloneReference();
  invalidDate.sharedCompatibility[0]!.researchedAt = 'August 20';
  assert.throws(() => validateToolCompatibilityReference(invalidDate), /must be an ISO date/);

  const missingMetadata = cloneReference();
  missingMetadata.officialSource.version = '';
  assert.throws(() => validateToolCompatibilityReference(missingMetadata), /requires version and URL/);

  const invalidGlobalMode = cloneReference();
  invalidGlobalMode.sharedCompatibility[0]!.accessMode = 'native-global';
  invalidGlobalMode.sharedCompatibility[0]!.scopes = ['project'];
  assert.throws(() => validateToolCompatibilityReference(invalidGlobalMode), /requires global scope/);

  const emptyVersion = cloneReference();
  emptyVersion.sharedCompatibility[0]!.minVersion = ' ';
  assert.throws(() => validateToolCompatibilityReference(emptyVersion), /empty minimum version/);
});
