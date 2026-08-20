import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  OFFICIAL_TOOL_DATASET,
  OPEN_SPEC_TOOL_DEFINITIONS,
  SHARED_AGENTS_RESEARCH_DATASET,
  SHARED_SKILLS_COMPATIBILITY,
  projectToolCompatibilityReference,
  validateOfficialToolDataset,
  validateResearchDataset,
  type OfficialToolDataset,
  type SharedAgentsResearchDataset,
} from './tool-compatibility-reference.js';

const cloneOfficial = (): OfficialToolDataset => structuredClone(OFFICIAL_TOOL_DATASET);
const cloneResearch = (): SharedAgentsResearchDataset => structuredClone(SHARED_AGENTS_RESEARCH_DATASET);

test('external datasets project the current public reference without semantic changes', () => {
  assert.equal(OFFICIAL_TOOL_DATASET.schemaVersion, 1);
  assert.equal(SHARED_AGENTS_RESEARCH_DATASET.schemaVersion, 1);
  assert.equal(OPEN_SPEC_TOOL_DEFINITIONS.length, 39);
  assert.equal(SHARED_SKILLS_COMPATIBILITY.length, 32);
  assert.equal(SHARED_AGENTS_RESEARCH_DATASET.source.url, 'https://github.com/vercel-labs/skills');
  assert.deepEqual(
    projectToolCompatibilityReference(OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET),
    {
      officialDefinitions: OPEN_SPEC_TOOL_DEFINITIONS,
      officialSource: {
        version: 'v1.10.0',
        url: 'https://github.com/Fission-AI/OpenSpec/blob/v1.10.0/docs/supported-tools.md',
        verifiedAt: '2026-08-20',
      },
      sharedSource: SHARED_AGENTS_RESEARCH_DATASET.source,
      sharedCompatibility: SHARED_SKILLS_COMPATIBILITY,
    }
  );
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
