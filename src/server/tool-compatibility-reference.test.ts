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

test('shared compatibility is a minimal reference snapshot', () => {
  const ids = new Set(TOOL_COMPATIBILITY_REFERENCE.sharedCompatibility.map((record) => record.clientId));
  assert.equal(ids.has('amazon-q'), false);
  assert.equal(ids.has('grok-build'), true);
  assert.equal(TOOL_COMPATIBILITY_REFERENCE.sharedCompatibility.length, 32);
  assert.equal(TOOL_COMPATIBILITY_REFERENCE.sharedSource.url, 'https://github.com/vercel-labs/skills');

  const partial = cloneReference();
  partial.sharedCompatibility = partial.sharedCompatibility.filter((record) => record.clientId === 'grok-build');
  assert.doesNotThrow(() => validateToolCompatibilityReference(partial));
});

test('shared clients retain OpenSpec linkage and minimal notes', () => {
  const byId = new Map(
    TOOL_COMPATIBILITY_REFERENCE.sharedCompatibility.map((record) => [record.clientId, record])
  );

  for (const id of [
    'opencode', 'codex', 'cursor', 'zed', 'antigravity', 'grok-build',
    'gemini', 'github-copilot', 'kimi', 'kilocode', 'pi',
  ]) {
    const record = byId.get(id);
    assert.ok(record, id);
    // new minimal schema has no accessMode/scopes/evidence — just identity
    assert.equal(typeof record!.name, 'string');
  }
  assert.equal(byId.get('grok-build')?.openSpecToolId, undefined);
  assert.equal(byId.get('hermes')?.note, 'Global shared path requires config (skills.external_dirs)');
  assert.equal(byId.get('forgecode')?.note, 'Global ~/.agents/skills only (project uses .forge/skills)');
  assert.deepEqual(
    TOOL_COMPATIBILITY_REFERENCE.sharedCompatibility
      .filter((record) => !record.openSpecToolId)
      .map((record) => record.clientId)
      .sort(),
    [
      'amp', 'antigravity-cli', 'deep-agents', 'dexto', 'firebender',
      'grok-build', 'loaf', 'promptscript', 'replit', 'warp',
    ]
  );
  assert.equal(byId.has('qwen'), false);
  assert.equal(byId.has('zcode'), false);
  // no per-row evidence fields
  for (const record of TOOL_COMPATIBILITY_REFERENCE.sharedCompatibility) {
    assert.equal((record as unknown as Record<string, unknown>).accessMode, undefined);
    assert.equal((record as unknown as Record<string, unknown>).source, undefined);
  }
});

test('dataset validation rejects duplicate ids and broken official links', () => {
  const duplicate = cloneReference();
  duplicate.officialDefinitions.push(structuredClone(duplicate.officialDefinitions[0]!));
  assert.throws(() => validateToolCompatibilityReference(duplicate), /Duplicate official tool id/);

  const brokenLink = cloneReference();
  brokenLink.sharedCompatibility[0]!.openSpecToolId = 'missing-tool';
  assert.throws(() => validateToolCompatibilityReference(brokenLink), /unknown OpenSpec tool/);
});

test('dataset validation rejects invalid source and dates', () => {
  const missingSource = cloneReference();
  missingSource.sharedSource.url = '';
  assert.throws(() => validateToolCompatibilityReference(missingSource), /requires url and revision/);

  const invalidDate = cloneReference();
  invalidDate.sharedSource.updatedAt = 'August 20';
  assert.throws(() => validateToolCompatibilityReference(invalidDate), /must be an ISO date/);

  const missingMetadata = cloneReference();
  missingMetadata.officialSource.version = '';
  assert.throws(() => validateToolCompatibilityReference(missingMetadata), /requires version and URL/);

  const emptyNote = cloneReference();
  emptyNote.sharedCompatibility[0]!.note = ' ';
  assert.throws(() => validateToolCompatibilityReference(emptyNote), /empty note/);
});
