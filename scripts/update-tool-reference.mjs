#!/usr/bin/env node
// Minimal 2-source JOIN updater — no generation/lock/evidence machinery.
// Input: { targetRelease, checkedAt, openspec: { available, dataset }, vercelSkills: { available, url, revision, candidates } }
// Output: analysis with diff of client ids.

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

export function analyzeToolReferenceUpdate(input, official, previous) {
  if (!input || typeof input !== 'object') throw new Error('Update input must be an object');
  if (!input.targetRelease || typeof input.targetRelease !== 'string') throw new Error('Caller must supply targetRelease');
  requireDate(input.checkedAt, 'checkedAt');
  if (!input.openspec || input.openspec.available !== true || !input.openspec.dataset) {
    throw new Error('The caller-selected OpenSpec release snapshot must be available before external classification');
  }
  const proposedOfficial = validateOfficialToolDataset(input.openspec.dataset);
  const vercel = input.vercelSkills;
  const available = vercel && vercel.available !== false;
  const candidates = available ? (vercel.candidates ?? []) : null;

  // Build lookup for official ids to map openSpecToolId
  const officialIds = new Set(proposedOfficial.tools.map((t) => t.id));
  const previousById = new Map(previous.clients.map((c) => [c.id, c]));

  let proposedResearch;
  let report = {
    hasChanges: false,
    writeAllowed: available,
    unavailableSources: [],
    researchQueue: [],
    added: [],
    missing: [],
  };

  if (!available) {
    report.unavailableSources = ['vercel-skills'];
    // keep previous unchanged, but not writable
    proposedResearch = clone(previous);
    // keep source revision/date as previous
  } else {
    const newById = new Map();
    for (const cand of candidates) {
      const id = String(cand.id).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!id) continue;
      const name = String(cand.name ?? cand.id).trim();
      const openSpecToolId = officialIds.has(id) ? id : undefined;
      const prev = previousById.get(id);
      newById.set(id, {
        id,
        name,
        ...(openSpecToolId ? { openSpecToolId } : {}),
        ...(prev?.note ? { note: prev.note } : {}),
      });
    }
    // preserve notes for hermes/forgecode/loaf etc if they already existed but candidate missing? Keep previous clients that are not in new list? For minimal, we keep only candidates.
    // But to detect missing, compare previous ids vs new ids
    const prevIds = new Set(previous.clients.map((c) => c.id));
    const newIds = new Set(newById.keys());
    report.added = [...newIds].filter((id) => !prevIds.has(id));
    report.missing = [...prevIds].filter((id) => !newIds.has(id));
    report.hasChanges = report.added.length > 0 || report.missing.length > 0;
    // also detect explicit refresh/broken evidence as queue
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
      clients: [...newById.values()].sort((a, b) => a.id.localeCompare(b.id)),
    };
    validateResearchDataset(proposedResearch, proposedOfficial);
  }

  const reviewHash = sha256({ input, proposedOfficial, proposedResearch });

  return {
    proposedOfficial,
    proposedResearch,
    report,
    reviewHash,
  };
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
    console.log(JSON.stringify(analysis.report, null, 2));
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
