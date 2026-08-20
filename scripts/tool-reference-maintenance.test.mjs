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
    targetRelease: OFFICIAL_TOOL_DATASET.source.revision,
    checkedAt: SHARED_AGENTS_RESEARCH_DATASET.updatedAt,
    openspec: { available: true, dataset: clone(OFFICIAL_TOOL_DATASET) },
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
  assert.throws(
    () => analyzeToolReferenceUpdate({ ...failedInput, openspec: { available: false } }, OFFICIAL_TOOL_DATASET, SHARED_AGENTS_RESEARCH_DATASET),
    /must be available/
  );
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
