import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';

import {
  OFFICIAL_TOOL_DATASET,
  SHARED_AGENTS_RESEARCH_DATASET,
  validateOfficialToolDataset,
  validateResearchDataset,
} from '../src/server/tool-compatibility-reference.ts';
import {
  analyzeToolReferenceUpdate,
  canonicalJson,
  runCli,
} from './update-tool-reference.mjs';

const clone = (value) => structuredClone(value);

function vercelCandidates(research = SHARED_AGENTS_RESEARCH_DATASET) {
  return research.clients.map((client) => ({ id: client.id, name: client.name }));
}

function input(overrides = {}) {
  const source = SHARED_AGENTS_RESEARCH_DATASET.source;
  return {
    targetRelease: OFFICIAL_TOOL_DATASET.source.version,
    checkedAt: SHARED_AGENTS_RESEARCH_DATASET.updatedAt,
    openspec: {
      available: true,
      url: OFFICIAL_TOOL_DATASET.source.url,
      revision: OFFICIAL_TOOL_DATASET.source.revision,
      dataset: clone(OFFICIAL_TOOL_DATASET),
    },
    releaseNotes: {
      available: true,
      url: `https://github.com/Fission-AI/OpenSpec/releases/tag/${OFFICIAL_TOOL_DATASET.source.version}`,
      revision: OFFICIAL_TOOL_DATASET.source.revision,
      conflicts: [],
    },
    vercelSkills: {
      available: true,
      url: source.url,
      revision: source.revision,
      candidates: vercelCandidates(),
    },
    ...overrides,
  };
}

test('unchanged release analysis is deterministic and does not queue age-based work', () => {
  const first = analyzeToolReferenceUpdate(input(), OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET);
  const second = analyzeToolReferenceUpdate(input(), OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET);
  assert.equal(first.report.hasChanges, false);
  assert.deepEqual(first.report, second.report);
  assert.deepEqual(first.report.researchQueue, []);
  assert.deepEqual(first.proposedResearch.clients.map(c=>c.id).sort(), SHARED_AGENTS_RESEARCH_DATASET.clients.map(c=>c.id).sort());
});

test('Vercel candidate addition is detected as added', () => {
  const nextInput = input();
  nextInput.vercelSkills.revision = 'vercel-next';
  nextInput.vercelSkills.candidates.push({ id: 'new-agent', name: 'New Agent' });
  const result = analyzeToolReferenceUpdate(nextInput, OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET);
  assert.ok(result.report.added.includes('new-agent'));
  assert.ok(result.report.researchQueue.includes('new-agent'));
  const candidate = result.proposedResearch.clients.find((client) => client.id === 'new-agent');
  assert.equal(candidate.name, 'New Agent');
});

test('source failure fails closed and cannot produce removals', () => {
  const failedInput = input({ vercelSkills: { available: false } });
  const result = analyzeToolReferenceUpdate(failedInput, OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET);
  assert.equal(result.report.writeAllowed, false);
  assert.deepEqual(result.report.unavailableSources, ['vercel-skills']);
  assert.deepEqual(result.report.missing, []);
  const missingDocs = analyzeToolReferenceUpdate(
    { ...failedInput, openspec: { available: false } },
    OFFICIAL_TOOL_DATASET,
    SHARED_AGENTS_RESEARCH_DATASET
  );
  assert.equal(missingDocs.report.writeAllowed, false);
  assert.ok(missingDocs.report.unavailableSources.includes('openspec-supported-tools'));
  assert.deepEqual(missingDocs.report.missing, []);
});

test('both official release sources are reported when their definitions agree', () => {
  const result = analyzeToolReferenceUpdate(input(), OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET);
  assert.deepEqual(
    result.report.officialSources.map(({ id, available }) => ({ id, available })),
    [
      { id: 'openspec-supported-tools', available: true },
      { id: 'openspec-release-notes', available: true },
    ]
  );
  assert.deepEqual(result.report.officialSourceConflicts, []);
  assert.equal(result.report.writeAllowed, true);
});

test('official sources with incomplete provenance fail closed', () => {
  const missingDocumentationProvenance = input();
  delete missingDocumentationProvenance.openspec.url;
  delete missingDocumentationProvenance.openspec.revision;
  const documentationResult = analyzeToolReferenceUpdate(
    missingDocumentationProvenance,
    OFFICIAL_TOOL_DATASET,
    SHARED_AGENTS_RESEARCH_DATASET
  );
  assert.equal(documentationResult.report.writeAllowed, false);
  assert.ok(documentationResult.report.unavailableSources.includes('openspec-supported-tools'));
  assert.deepEqual(documentationResult.report.missing, []);

  const releaseNotesResult = analyzeToolReferenceUpdate(
    input({ releaseNotes: { available: true, conflicts: [] } }),
    OFFICIAL_TOOL_DATASET,
    SHARED_AGENTS_RESEARCH_DATASET
  );
  assert.equal(releaseNotesResult.report.writeAllowed, false);
  assert.ok(releaseNotesResult.report.unavailableSources.includes('openspec-release-notes'));
  assert.deepEqual(releaseNotesResult.report.missing, []);
});

test('official sources for a different target release fail closed', () => {
  const result = analyzeToolReferenceUpdate(
    input({ targetRelease: 'v9.9.9' }),
    OFFICIAL_TOOL_DATASET,
    SHARED_AGENTS_RESEARCH_DATASET
  );

  assert.equal(result.report.writeAllowed, false);
  assert.deepEqual(result.report.unavailableSources, [
    'openspec-supported-tools',
    'openspec-release-notes',
  ]);
  assert.deepEqual(result.report.missing, []);
});

test('resolved v1.11 Antigravity conflict is reviewable and writable only with its reviewed hash', () => {
  const next = input();
  next.targetRelease = 'v1.11.0';
  next.releaseNotes.revision = 'v1.11.0';
  next.releaseNotes.url = 'https://github.com/Fission-AI/OpenSpec/releases/tag/v1.11.0';
  const antigravity = next.openspec.dataset.tools.find((tool) => tool.id === 'antigravity');
  antigravity.commands.path = '.agents/workflows/opsx-<id>.md';
  antigravity.skills.path = '.agents/skills/openspec-*/SKILL.md';
  next.releaseNotes.conflicts = [{
    toolId: 'antigravity',
    fields: ['commands.path', 'skills.path'],
    documentation: '.agent paths',
    releaseNotes: 'Antigravity uses the shared .agents root',
    resolution: {
      source: 'v1.11.0 release notes and shipped Antigravity adapter',
      summary: 'Use .agents as current; retain .agent as runtime legacy input.',
    },
  }];

  const result = analyzeToolReferenceUpdate(next, OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET);
  assert.equal(result.report.writeAllowed, true);
  assert.equal(result.report.hasChanges, true);
  assert.deepEqual(result.report.officialSourceConflicts[0]?.fields, ['commands.path', 'skills.path']);
  assert.match(result.report.officialSourceConflicts[0]?.resolution?.source ?? '', /release notes/);
});

test('unresolved official-source conflict and unavailable release notes fail closed', () => {
  const unresolved = input({
    releaseNotes: {
      available: true,
      url: 'https://github.com/Fission-AI/OpenSpec/releases/tag/v1.11.0',
      revision: 'v1.11.0',
      conflicts: [{
        toolId: 'antigravity',
        fields: ['commands.path'],
        documentation: '.agent/workflows',
        releaseNotes: '.agents/workflows',
      }],
    },
  });
  const unresolvedResult = analyzeToolReferenceUpdate(unresolved, OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET);
  assert.equal(unresolvedResult.report.writeAllowed, false);
  assert.equal(unresolvedResult.report.officialSourceConflicts[0]?.resolution, null);

  const unavailableResult = analyzeToolReferenceUpdate(
    input({ releaseNotes: { available: false } }),
    OFFICIAL_TOOL_DATASET,
    SHARED_AGENTS_RESEARCH_DATASET
  );
  assert.equal(unavailableResult.report.writeAllowed, false);
  assert.ok(unavailableResult.report.unavailableSources.includes('openspec-release-notes'));
  assert.deepEqual(unavailableResult.report.missing, []);
});

test('explicit refresh and broken evidence queue work', () => {
  const result = analyzeToolReferenceUpdate(
    input({ refresh: { clients: ['cursor'] }, brokenEvidenceClientIds: ['zed'] }),
    OFFICIAL_TOOL_DATASET,
    SHARED_AGENTS_RESEARCH_DATASET
  );
  assert.ok(result.report.researchQueue.includes('cursor'));
  assert.ok(result.report.researchQueue.includes('zed'));
});

test('default analysis does not write and explicit writes require the reviewed hash', async () => {
  const root = await mkdtemp(join(tmpdir(), 'tool-reference-write-'));
  const officialPath = join(root, 'openspec-tools.json');
  const researchPath = join(root, 'shared-agents-research.json');
  await writeFile(officialPath, canonicalJson(OFFICIAL_TOOL_DATASET));
  await writeFile(researchPath, canonicalJson(SHARED_AGENTS_RESEARCH_DATASET));
  const before = await Promise.all([readFile(officialPath, 'utf8'), readFile(researchPath, 'utf8')]);

  try {
    const nextInput = input();
    nextInput.vercelSkills.revision = 'write-revision';
    nextInput.vercelSkills.candidates.push({ id: 'write-agent', name: 'Write Agent' });
    const inputPath = join(root, 'input.json');
    await writeFile(inputPath, JSON.stringify(nextInput));
    const analysis = analyzeToolReferenceUpdate(nextInput, OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET);
    assert.deepEqual(await Promise.all([readFile(officialPath, 'utf8'), readFile(researchPath, 'utf8')]), before);
    await assert.rejects(
      runCli(['--input', inputPath, '--official-path', officialPath, '--research-path', researchPath, '--write', '--review-hash', 'wrong-hash']),
      /Reviewed input hash does not match/
    );
    await runCli(['--input', inputPath, '--official-path', officialPath, '--research-path', researchPath, '--write', '--review-hash', analysis.reviewHash]);
    const writtenOfficial = JSON.parse(await readFile(officialPath, 'utf8'));
    const writtenResearch = JSON.parse(await readFile(researchPath, 'utf8'));
    validateOfficialToolDataset(writtenOfficial);
    validateResearchDataset(writtenResearch, writtenOfficial);
    assert.ok(writtenResearch.clients.some(c => c.id === 'write-agent'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
