import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { ToolCompatibilityReferenceResponse } from '../shared/types.js';
import {
  OFFICIAL_TOOL_DATASET,
  OPEN_SPEC_TOOL_DEFINITIONS,
  TOOL_COMPATIBILITY_REFERENCE,
  validateToolCompatibilityReference,
} from './tool-compatibility-reference.js';

function cloneReference(): ToolCompatibilityReferenceResponse {
  return structuredClone(TOOL_COMPATIBILITY_REFERENCE);
}

test('v2.1.1 official definition snapshot is skills-only and drops the retired tool', () => {
  assert.equal(TOOL_COMPATIBILITY_REFERENCE.officialSource.version, 'v2.1.1');
  assert.equal(
    TOOL_COMPATIBILITY_REFERENCE.officialSource.url,
    'https://github.com/Fission-AI/OpenSpec/blob/v2.1.1/docs-lab/reference/supported-tools.md'
  );
  assert.equal(OFFICIAL_TOOL_DATASET.source.revision, '0c737dc1b543249b38b0f4716816fcf493d894dd');
  assert.equal(OFFICIAL_TOOL_DATASET.source.checkedAt, '2026-11-21');
  assert.equal(OPEN_SPEC_TOOL_DEFINITIONS.length, 87);
  assert.ok(OPEN_SPEC_TOOL_DEFINITIONS.every((definition) => definition.commands === null && definition.skills));

  const byId = new Map(OPEN_SPEC_TOOL_DEFINITIONS.map((definition) => [definition.id, definition]));
  assert.equal(byId.has('amazon-q'), false);
  for (const id of ['eve', 'promptscript', 'openclaw', 'goose']) assert.ok(byId.has(id), id);
  assert.equal(byId.get('claude')?.skills?.path, '.claude/skills/openspec-*/SKILL.md');
  assert.equal(byId.get('cursor')?.skills?.path, '.agents/skills/openspec-*/SKILL.md');
  assert.equal(byId.get('codex')?.skills?.invocation, '$openspec-<skill>');
  assert.equal(byId.get('kimi')?.skills?.invocation, '/skill:openspec-<skill>');
  assert.equal(byId.get('gsd')?.skills?.invocation, 'use the openspec-<skill> skill');
  // Not on the 2.x page: keeps its v1.14.0 invocation.
  assert.equal(byId.get('codeassistant')?.skills?.invocation, 'use the openspec-<skill> skill');
  assert.equal(byId.get('eve')?.skills?.path, 'agent/skills/openspec-*/SKILL.md');
  assert.equal(byId.get('bob')?.name, 'IBM Bob');
  assert.equal(byId.get('agents')?.name, 'Other / Universal');
});

test('shared compatibility is a minimal reference snapshot', () => {
  const ids = new Set(TOOL_COMPATIBILITY_REFERENCE.sharedCompatibility.map((record) => record.clientId));
  assert.equal(ids.has('amazon-q'), false);
  assert.equal(ids.has('grok-build'), true);
  assert.equal(TOOL_COMPATIBILITY_REFERENCE.sharedCompatibility.length, 33);
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
  assert.equal(byId.get('grok-build')?.openSpecToolId, 'grok');
  assert.equal(byId.get('amp')?.openSpecToolId, 'amp');
  assert.equal(byId.get('warp')?.openSpecToolId, 'warp');
  assert.equal(byId.get('hermes')?.note, 'Global shared path requires config (skills.external_dirs)');
  assert.equal(byId.get('forgecode')?.note, 'Global ~/.agents/skills only (project uses .forge/skills)');
  assert.deepEqual(
    TOOL_COMPATIBILITY_REFERENCE.sharedCompatibility
      .filter((record) => !record.openSpecToolId)
      .map((record) => record.clientId)
      .sort(),
    [
      'deep-agents',
    ]
  );
  assert.equal(byId.get('qwen')?.openSpecToolId, 'qwen');
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
