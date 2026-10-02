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

test('v1.14.0 official definition snapshot contains every upstream tool row', () => {
  assert.equal(TOOL_COMPATIBILITY_REFERENCE.officialSource.version, 'v1.14.0');
  assert.equal(TOOL_COMPATIBILITY_REFERENCE.officialSource.verifiedAt, '2026-10-02');
  assert.equal(OFFICIAL_TOOL_DATASET.source.revision, '94ca9c1eb15d1b49c06c988419b75c3d95f8b2b5');
  assert.equal(OFFICIAL_TOOL_DATASET.source.checkedAt, '2026-10-02');
  assert.equal(OPEN_SPEC_TOOL_DEFINITIONS.length, 50);
  assert.deepEqual(
    OPEN_SPEC_TOOL_DEFINITIONS.map((definition) => definition.id),
    [
      'amazon-q', 'amp', 'antigravity', 'atomcode', 'auggie', 'bob', 'claude',
      'cline', 'command-code', 'codeartsagent', 'codebuddy', 'codestudio',
      'codex', 'dsh', 'devin', 'forgecode', 'continue', 'costrict', 'crush',
      'cursor', 'easycode', 'factory', 'gemini', 'github-copilot', 'gigacode',
      'grok', 'gsd', 'hermes', 'iflow', 'junie', 'kilocode', 'kimi', 'kiro',
      'lingma', 'minimax-code', 'vibe', 'oh-my-pi', 'opencode', 'pi',
      'codeassistant', 'qoder', 'qwen', 'rovodev', 'roocode', 'trae', 'veai',
      'warp', 'zed', 'zcode', 'agents',
    ]
  );

  const byId = new Map(OPEN_SPEC_TOOL_DEFINITIONS.map((definition) => [definition.id, definition]));
  assert.equal(byId.get('claude')?.commands?.invocation, '/opsx:<id>');
  assert.equal(byId.get('antigravity')?.commands?.path, '.agents/workflows/opsx-<id>.md');
  assert.equal(byId.get('antigravity')?.skills?.path, '.agents/skills/openspec-*/SKILL.md');
  assert.equal(byId.get('codeassistant')?.commands?.path, '.codeassistant/commands/opsx-<id>.md');
  assert.equal(byId.get('codeassistant')?.skills?.path, '.codeassistant/skills/openspec-*/SKILL.md');
  assert.equal(byId.get('kilocode')?.commands?.path, '.kilo/command/opsx-<id>.md');
  assert.equal(byId.get('kilocode')?.skills?.path, '.kilocode/skills/openspec-*/SKILL.md');
  assert.equal(byId.get('kilocode')?.commands?.invocation, '/opsx-<id>');
  assert.equal(byId.get('bob')?.name, 'IBM Bob');
  assert.equal(byId.get('amp')?.skills?.path, '.agents/skills/openspec-*/SKILL.md');
  assert.equal(byId.get('atomcode')?.commands?.path, '.atomcode/commands/opsx-<id>.md');
  assert.equal(byId.get('codestudio')?.commands?.path, '.codestudio/prompts/opsx-<id>.prompt.md');
  assert.equal(byId.get('easycode')?.commands?.invocation, '/opsx:<id>');
  assert.equal(byId.get('easycode')?.commands?.path, '.easycode/commands/opsx/<id>.toml');
  assert.equal(byId.get('github-copilot')?.commands?.path, '.github/prompts/opsx-<id>.prompt.md');
  assert.equal(byId.get('kiro')?.commands?.path, '.kiro/prompts/opsx-<id>.prompt.md');
  assert.equal(byId.get('warp')?.skills?.path, '.warp/skills/openspec-*/SKILL.md');
  assert.equal(byId.get('agents')?.name, 'Shared .agents skills');
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
      'antigravity-cli', 'deep-agents', 'dexto', 'firebender',
      'loaf', 'promptscript', 'replit',
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
