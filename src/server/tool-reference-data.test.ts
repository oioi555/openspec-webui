import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  OFFICIAL_TOOL_DATASET,
  OPEN_SPEC_TOOL_DEFINITIONS,
  SHARED_AGENTS_RESEARCH_DATASET,
  SHARED_SKILLS_COMPATIBILITY,
  projectToolCompatibilityReference,
  projectToolNames,
  TOOL_SCOPE_SUPPORT,
  validateToolScopeSupport,
  validateOfficialToolDataset,
  validateResearchDataset,
  type OfficialToolDataset,
  type SharedAgentsResearchDataset,
} from './tool-compatibility-reference.js';

const cloneOfficial = (): OfficialToolDataset => structuredClone(OFFICIAL_TOOL_DATASET);
const cloneResearch = (): SharedAgentsResearchDataset => structuredClone(SHARED_AGENTS_RESEARCH_DATASET);

test('external datasets project the current public reference without semantic changes', () => {
  assert.equal(OFFICIAL_TOOL_DATASET.schemaVersion, 1);
  assert.equal(OFFICIAL_TOOL_DATASET.source.version, 'v2.1.1');
  assert.equal(OFFICIAL_TOOL_DATASET.source.revision, '0c737dc1b543249b38b0f4716816fcf493d894dd');
  assert.equal(OFFICIAL_TOOL_DATASET.source.checkedAt, '2026-11-21');
  assert.equal(SHARED_AGENTS_RESEARCH_DATASET.schemaVersion, 1);
  assert.equal(OPEN_SPEC_TOOL_DEFINITIONS.length, 87);
  assert.equal(SHARED_SKILLS_COMPATIBILITY.length, 33);
  assert.equal(SHARED_AGENTS_RESEARCH_DATASET.source.url, 'https://github.com/vercel-labs/skills');
  assert.deepEqual(
    projectToolCompatibilityReference(OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET),
    {
      officialDefinitions: OPEN_SPEC_TOOL_DEFINITIONS,
      officialSource: {
        version: 'v2.1.1',
        url: 'https://github.com/Fission-AI/OpenSpec/blob/v2.1.1/docs-lab/reference/supported-tools.md',
        verifiedAt: '2026-11-21',
      },
      sharedSource: SHARED_AGENTS_RESEARCH_DATASET.source,
      sharedCompatibility: SHARED_SKILLS_COMPATIBILITY,
      toolNames: projectToolNames(OFFICIAL_TOOL_DATASET),
      scopeSupport: TOOL_SCOPE_SUPPORT,
    }
  );
});

test('scope support data covers every official id with the bundled skills version', () => {
  assert.deepEqual(TOOL_SCOPE_SUPPORT.source, { openspecTag: 'v2.1.1', skillsVersion: '1.8.1' });
  assert.deepEqual(Object.keys(TOOL_SCOPE_SUPPORT.tools).sort(), OPEN_SPEC_TOOL_DEFINITIONS.map((tool) => tool.id).sort());
  assert.deepEqual(TOOL_SCOPE_SUPPORT.tools.eve, { kind: 'project-only' });
  assert.deepEqual(TOOL_SCOPE_SUPPORT.tools.promptscript, { kind: 'project-only' });
  assert.deepEqual(TOOL_SCOPE_SUPPORT.tools.cursor, { kind: 'universal' });

  const missing = structuredClone(TOOL_SCOPE_SUPPORT);
  delete missing.tools.cursor;
  assert.throws(() => validateToolScopeSupport(missing, OFFICIAL_TOOL_DATASET), /missing: cursor/);
  const badKind = structuredClone(TOOL_SCOPE_SUPPORT) as unknown as { tools: Record<string, unknown> };
  badKind.tools.cursor = { kind: 'global' };
  assert.throws(() => validateToolScopeSupport(badKind, OFFICIAL_TOOL_DATASET), /unknown kind/);
  const escape = structuredClone(TOOL_SCOPE_SUPPORT);
  escape.tools.claude = { kind: 'linked', globalDir: '../etc/skills' };
  assert.throws(() => validateToolScopeSupport(escape, OFFICIAL_TOOL_DATASET), /inside the home folder/);
  const universalWithDir = structuredClone(TOOL_SCOPE_SUPPORT);
  universalWithDir.tools.cursor = { kind: 'universal', globalDir: '.cursor/skills' };
  assert.throws(() => validateToolScopeSupport(universalWithDir, OFFICIAL_TOOL_DATASET), /not linked/);
});

test('served tool names include retired 1.x tools and official names win', () => {
  const names = projectToolNames(OFFICIAL_TOOL_DATASET);
  assert.equal(names['amazon-q'], 'Amazon Q Developer');
  assert.equal(names.kimi, 'Kimi Code');
  assert.equal(Object.keys(names).length, OPEN_SPEC_TOOL_DEFINITIONS.length + 1);
});

test('official dataset validation rejects malformed schema and deliveries', () => {
  const duplicate = cloneOfficial();
  duplicate.tools.push(structuredClone(duplicate.tools[0]!));
  assert.throws(() => validateOfficialToolDataset(duplicate), /Duplicate official tool id/);

  const missingRevision = cloneOfficial();
  missingRevision.source.revision = '';
  assert.throws(() => validateOfficialToolDataset(missingRevision), /revision must be a non-empty string/);

  const noDelivery = cloneOfficial();
  noDelivery.tools[0]!.commands = null;
  noDelivery.tools[0]!.skills = null;
  assert.throws(() => validateOfficialToolDataset(noDelivery), /has no Commands or Skills delivery/);
});

test('research dataset rejects duplicate ids, unknown links, and invalid dates', () => {
  const duplicate = cloneResearch();
  duplicate.clients.push(structuredClone(duplicate.clients[0]!));
  assert.throws(() => validateResearchDataset(duplicate, OFFICIAL_TOOL_DATASET), /Duplicate research client id/);

  const unknownLink = cloneResearch();
  unknownLink.clients[0]!.openSpecToolId = 'missing-tool';
  assert.throws(() => validateResearchDataset(unknownLink, OFFICIAL_TOOL_DATASET), /unknown OpenSpec tool/);

  const invalidDate = cloneResearch();
  invalidDate.updatedAt = 'yesterday';
  assert.throws(() => validateResearchDataset(invalidDate, OFFICIAL_TOOL_DATASET), /must be an ISO date/);

  const emptyNote = cloneResearch();
  emptyNote.clients[0]!.note = ' ';
  assert.throws(() => validateResearchDataset(emptyNote, OFFICIAL_TOOL_DATASET), /non-empty/);
});

test('research dataset is a flat list without per-client evidence', () => {
  for (const client of SHARED_AGENTS_RESEARCH_DATASET.clients) {
    assert.equal(typeof client.id, 'string');
    assert.equal(typeof client.name, 'string');
    assert.equal((client as unknown as Record<string, unknown>).research, undefined);
    assert.equal((client as unknown as Record<string, unknown>).aliases, undefined);
  }
  assert.equal(SHARED_AGENTS_RESEARCH_DATASET.clients.some((c) => c.note), true);
});
