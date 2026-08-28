#!/usr/bin/env node
// Analyze-first official-source reconciliation + shared-client JOIN updater.
// Input: { targetRelease, checkedAt, openspec, releaseNotes, vercelSkills }
// Output: reviewable source status, official conflicts, dataset proposals and hash.

import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  validateOfficialToolDataset,
  validateResearchDataset,
} from '../src/server/tool-compatibility-reference.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_OFFICIAL_PATH = resolve(repoRoot, 'src/server/data/tool-reference/openspec-tools.json');
export const DEFAULT_RESEARCH_PATH = resolve(repoRoot, 'src/server/data/tool-reference/shared-agents-research.json');

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(stableValue(value));
}

export function sha256(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : canonicalJson(value)).digest('hex');
}

function clone(value) {
  return structuredClone(value);
}

function requireDate(value, field) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`${field} must be an ISO date (YYYY-MM-DD)`);
  }
  return value;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isReleaseNotesUrlForTarget(value, targetRelease) {
  if (!isNonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.origin === 'https://github.com'
      && url.pathname.replace(/\/$/, '') === `/Fission-AI/OpenSpec/releases/tag/${targetRelease}`;
  } catch {
    return false;
  }
}

function normalizeOfficialSourceConflicts(conflicts) {
  if (!Array.isArray(conflicts)) throw new Error('releaseNotes.conflicts must be an array');
  return conflicts.map((conflict, index) => {
    if (!conflict || typeof conflict !== 'object') {
      throw new Error(`releaseNotes.conflicts[${index}] must be an object`);
    }
    const toolId = String(conflict.toolId ?? '').trim();
    const fields = Array.isArray(conflict.fields)
      ? conflict.fields.map((field) => String(field).trim()).filter(Boolean)
      : [];
    const documentation = String(conflict.documentation ?? '').trim();
    const releaseNotes = String(conflict.releaseNotes ?? '').trim();
    if (!toolId || fields.length === 0 || !documentation || !releaseNotes) {
      throw new Error(`releaseNotes.conflicts[${index}] requires toolId, fields, documentation, and releaseNotes`);
    }
    const source = String(conflict.resolution?.source ?? '').trim();
    const summary = String(conflict.resolution?.summary ?? '').trim();
    return {
      toolId,
      fields,
      documentation,
      releaseNotes,
      resolution: source && summary ? { source, summary } : null,
    };
  });
}

export function analyzeToolReferenceUpdate(input, official, previous) {
  if (!input || typeof input !== 'object') throw new Error('Update input must be an object');
  if (!isNonEmptyString(input.targetRelease)) throw new Error('Caller must supply targetRelease');
  const targetRelease = input.targetRelease.trim();
  requireDate(input.checkedAt, 'checkedAt');

  const documentation = input.openspec;
  const releaseNotes = input.releaseNotes;
  const documentationDataset = documentation?.dataset;
  const documentationAvailable = documentation?.available === true
    && Boolean(documentationDataset)
    && isNonEmptyString(documentation.url)
    && isNonEmptyString(documentation.revision)
    && documentationDataset?.source?.version === targetRelease
    && documentation.url === documentationDataset.source.url
    && documentation.revision === documentationDataset.source.revision;
  const releaseNotesAvailable = releaseNotes?.available === true
    && isNonEmptyString(releaseNotes.url)
    && isNonEmptyString(releaseNotes.revision)
    && isReleaseNotesUrlForTarget(releaseNotes.url, targetRelease);
  const proposedOfficial = documentationAvailable
    ? validateOfficialToolDataset(documentationDataset)
    : clone(official);
  const officialSourceConflicts = releaseNotesAvailable
    ? normalizeOfficialSourceConflicts(releaseNotes.conflicts ?? [])
    : [];
  const officialSources = [
    {
      id: 'openspec-supported-tools',
      available: documentationAvailable,
      url: documentation?.url ?? null,
      revision: documentation?.revision ?? null,
    },
    {
      id: 'openspec-release-notes',
      available: releaseNotesAvailable,
      url: releaseNotes?.url ?? null,
      revision: releaseNotes?.revision ?? null,
    },
  ];
  const officialAvailable = officialSources.every((source) => source.available);
  const conflictsResolved = officialSourceConflicts.every((conflict) => conflict.resolution !== null);

  const vercel = input.vercelSkills;
  const vercelAvailable = vercel?.available !== false && Boolean(vercel);
  const candidates = vercelAvailable ? (vercel.candidates ?? []) : [];

  const officialIds = new Set(proposedOfficial.tools.map((tool) => tool.id));
  const previousById = new Map(previous.clients.map((client) => [client.id, client]));
  const report = {
    hasChanges: false,
    writeAllowed: officialAvailable && vercelAvailable && conflictsResolved,
    unavailableSources: officialSources.filter((source) => !source.available).map((source) => source.id),
    officialSources,
    officialSourceConflicts,
    researchQueue: [],
    added: [],
    missing: [],
  };

  let proposedResearch;
  if (!officialAvailable || !vercelAvailable) {
    if (!vercelAvailable) report.unavailableSources.push('vercel-skills');
    proposedResearch = clone(previous);
  } else {
    const newById = new Map();
    for (const candidate of candidates) {
      const id = String(candidate.id).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!id) continue;
      const name = String(candidate.name ?? candidate.id).trim();
      const openSpecToolId = officialIds.has(id) ? id : undefined;
      const prior = previousById.get(id);
      newById.set(id, {
        id,
        name,
        ...(openSpecToolId ? { openSpecToolId } : {}),
        ...(prior?.note ? { note: prior.note } : {}),
      });
    }

    const previousIds = new Set(previous.clients.map((client) => client.id));
    const nextIds = new Set(newById.keys());
    report.added = [...nextIds].filter((id) => !previousIds.has(id));
    report.missing = [...previousIds].filter((id) => !nextIds.has(id));
    const explicit = [...(input.refresh?.clients ?? []), ...(input.brokenEvidenceClientIds ?? [])];
    report.researchQueue = [...new Set([...report.added, ...explicit])];

    const updatedAt = input.checkedAt;
    proposedResearch = {
      schemaVersion: 1,
      updatedAt,
      source: {
        url: vercel.url ?? 'https://github.com/vercel-labs/skills',
        revision: vercel.revision ?? 'unknown',
        updatedAt,
      },
      clients: [...newById.values()].sort((left, right) => left.id.localeCompare(right.id)),
    };
    validateResearchDataset(proposedResearch, proposedOfficial);
  }

  const researchSourceChanged = officialAvailable && vercelAvailable && (
    proposedResearch.source.url !== previous.source.url
    || proposedResearch.source.revision !== previous.source.revision
  );
  report.hasChanges = canonicalJson(proposedOfficial) !== canonicalJson(official)
    || report.added.length > 0
    || report.missing.length > 0
    || researchSourceChanged
    || officialSourceConflicts.length > 0;
  const reviewHash = sha256({ input, proposedOfficial, proposedResearch });

  return { proposedOfficial, proposedResearch, report, reviewHash };
}

export async function writeDatasetsAtomically({ officialPath, researchPath, official, research, failAfterOfficial = false }) {
  // Minimal atomic write — no lock, just validate and write both
  validateOfficialToolDataset(official);
  // need official to validate research
  validateResearchDataset(research, official);
  await mkdir(dirname(officialPath), { recursive: true });
  await mkdir(dirname(researchPath), { recursive: true });
  await writeFile(officialPath, canonicalJson(official) + '\n');
  if (failAfterOfficial) throw new Error('Injected failure after official write');
  await writeFile(researchPath, canonicalJson(research) + '\n');
}

export async function runCli(args) {
  // Minimal CLI: --input <path> [--write --review-hash <hash>] [--official-path <p> --research-path <p>]
  const getArg = (name) => {
    const idx = args.indexOf(name);
    return idx !== -1 ? args[idx + 1] : null;
  };
  const inputPath = getArg('--input');
  if (!inputPath) throw new Error('--input is required');
  const input = JSON.parse(await readFile(inputPath, 'utf8'));
  const officialPath = getArg('--official-path') ?? DEFAULT_OFFICIAL_PATH;
  const researchPath = getArg('--research-path') ?? DEFAULT_RESEARCH_PATH;
  const officialRaw = JSON.parse(await readFile(officialPath, 'utf8'));
  const researchRaw = JSON.parse(await readFile(researchPath, 'utf8'));
  const official = validateOfficialToolDataset(officialRaw);
  const previous = validateResearchDataset(researchRaw, official);
  const analysis = analyzeToolReferenceUpdate(input, official, previous);
  const wantWrite = args.includes('--write');
  if (!wantWrite) {
    console.log(JSON.stringify({ report: analysis.report, reviewHash: analysis.reviewHash }, null, 2));
    return analysis;
  }
  const reviewHash = getArg('--review-hash');
  if (reviewHash !== analysis.reviewHash) throw new Error('Reviewed input hash does not match current analysis');
  if (!analysis.report.writeAllowed) throw new Error('Source unavailable, write not allowed');
  await writeDatasetsAtomically({ officialPath, researchPath, official: analysis.proposedOfficial, research: analysis.proposedResearch });
  console.log('Wrote datasets');
  return analysis;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('update-tool-reference.mjs')) {
  // called directly
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: update-tool-reference.mjs --input <path> [--write --review-hash <hash>]');
    process.exit(1);
  }
  runCli(args).catch((e) => { console.error(e.message); process.exit(1); });
}
