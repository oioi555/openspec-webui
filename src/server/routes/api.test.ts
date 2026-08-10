import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import {
  normalizeValidationOptions,
  buildValidationArgs,
  buildValidationCommandString,
  deriveProjectRelationshipFacts,
} from './api.js';

test('normalizeValidationOptions returns defaults for empty/missing body', () => {
  assert.deepEqual(normalizeValidationOptions(null), { strict: true, concurrency: null });
  assert.deepEqual(normalizeValidationOptions(undefined), { strict: true, concurrency: null });
  assert.deepEqual(normalizeValidationOptions({}), { strict: true, concurrency: null });
});

test('normalizeValidationOptions preserves valid strict boolean', () => {
  assert.equal(normalizeValidationOptions({ strict: false }).strict, false);
  assert.equal(normalizeValidationOptions({ strict: true }).strict, true);
});

test('normalizeValidationOptions accepts positive integer concurrency', () => {
  assert.equal(normalizeValidationOptions({ concurrency: 4 }).concurrency, 4);
  assert.equal(normalizeValidationOptions({ concurrency: 1 }).concurrency, 1);
});

test('normalizeValidationOptions normalizes invalid concurrency to null', () => {
  assert.equal(normalizeValidationOptions({ concurrency: 0 }).concurrency, null);
  assert.equal(normalizeValidationOptions({ concurrency: -1 }).concurrency, null);
  assert.equal(normalizeValidationOptions({ concurrency: 3.5 }).concurrency, null);
  assert.equal(normalizeValidationOptions({ concurrency: '4' }).concurrency, null);
});

test('buildValidationArgs produces default command with strict', () => {
  const args = buildValidationArgs({ strict: true, concurrency: null });
  assert.deepEqual(args, ['validate', '--all', '--strict', '--json']);
});

test('buildValidationArgs omits --strict when strict is false', () => {
  const args = buildValidationArgs({ strict: false, concurrency: null });
  assert.deepEqual(args, ['validate', '--all', '--json']);
  assert.equal(args.includes('--strict'), false);
});

test('buildValidationArgs includes --concurrency n when concurrency is set', () => {
  const args = buildValidationArgs({ strict: true, concurrency: 8 });
  assert.deepEqual(args, ['validate', '--all', '--strict', '--concurrency', '8', '--json']);
});

test('buildValidationArgs combines strict=false with concurrency', () => {
  const args = buildValidationArgs({ strict: false, concurrency: 2 });
  assert.deepEqual(args, ['validate', '--all', '--concurrency', '2', '--json']);
});

test('buildValidationCommandString joins args with openspec prefix', () => {
  const cmd = buildValidationCommandString(['validate', '--all', '--strict', '--json']);
  assert.equal(cmd, 'openspec validate --all --strict --json');
});

/**
 * Recursively snapshot a directory: relative paths -> { content, mtimeMs }.
 * Used to prove relationship derivation never creates, removes, or modifies
 * any file or directory.
 */
type DirSnapshot = Map<string, { content: string; mtimeMs: number }>;

async function snapshotDir(root: string): Promise<DirSnapshot> {
  const snapshot: DirSnapshot = new Map();
  snapshot.set('.', { content: '', mtimeMs: (await stat(root)).mtimeMs });

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const rel = relative(root, fullPath);
      const fileStat = await stat(fullPath);
      snapshot.set(rel, {
        content: entry.isDirectory() ? '' : await readFile(fullPath, 'utf8'),
        mtimeMs: fileStat.mtimeMs,
      });
      if (entry.isDirectory()) {
        await walk(fullPath);
      }
    }
  }

  await walk(root);
  return snapshot;
}

function assertDirInvariant(before: DirSnapshot, after: DirSnapshot, label: string): void {
  const beforePaths = [...before.keys()].sort();
  const afterPaths = [...after.keys()].sort();
  assert.deepEqual(afterPaths, beforePaths, `${label}: path set changed (created/removed)`);

  for (const [rel, beforeEntry] of before) {
    const afterEntry = after.get(rel);
    assert.ok(afterEntry, `${label}: entry missing after derivation: ${rel}`);
    assert.equal(afterEntry.content, beforeEntry.content, `${label}: content changed: ${rel}`);
    assert.equal(afterEntry.mtimeMs, beforeEntry.mtimeMs, `${label}: mtime changed: ${rel}`);
  }
}

async function createRelationshipFixture(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  try {
    await mkdir(join(root, 'openspec'), { recursive: true });
  } catch (error) {
    await rm(root, { recursive: true, force: true });
    throw error;
  }
  return root;
}

test('deriveProjectRelationshipFacts reads config.yaml without modifying the filesystem', async () => {
  const root = await createRelationshipFixture('openspec-webui-rel-yaml-');
  try {
    await writeFile(
      join(root, 'openspec', 'config.yaml'),
      `schema: default-workflow\ncontext: |\n  Relationship fixture.\nstore: my-store\nreferences:\n  - ref-one\n  - { id: ref-two, remote: git@example.com:ref-two.git }\n`,
      'utf8'
    );

    const before = await snapshotDir(root);
    const facts = await deriveProjectRelationshipFacts(root);
    const after = await snapshotDir(root);

    assert.equal(facts.pointerStoreId, 'my-store');
    assert.deepEqual(facts.referenceStoreIds, ['ref-one', 'ref-two']);
    assertDirInvariant(before, after, 'config.yaml derivation');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('deriveProjectRelationshipFacts reads config.yml without modifying the filesystem', async () => {
  const root = await createRelationshipFixture('openspec-webui-rel-yml-');
  try {
    await writeFile(
      join(root, 'openspec', 'config.yml'),
      `schema: default-workflow\ncontext: |\n  Yml relationship fixture.\nstore: yml-store\nreferences:\n  - yml-ref\n`,
      'utf8'
    );

    const before = await snapshotDir(root);
    const facts = await deriveProjectRelationshipFacts(root);
    const after = await snapshotDir(root);

    assert.equal(facts.pointerStoreId, 'yml-store');
    assert.deepEqual(facts.referenceStoreIds, ['yml-ref']);
    assertDirInvariant(before, after, 'config.yml derivation');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('deriveProjectRelationshipFacts prefers config.yaml and leaves both files untouched', async () => {
  const root = await createRelationshipFixture('openspec-webui-rel-both-');
  try {
    await writeFile(
      join(root, 'openspec', 'config.yaml'),
      `schema: default-workflow\ncontext: |\n  Yaml preferred.\nstore: yaml-store\nreferences:\n  - yaml-ref\n`,
      'utf8'
    );
    await writeFile(
      join(root, 'openspec', 'config.yml'),
      `schema: default-workflow\ncontext: |\n  Yml ignored.\nstore: yml-store\n`,
      'utf8'
    );

    const before = await snapshotDir(root);
    const facts = await deriveProjectRelationshipFacts(root);
    const after = await snapshotDir(root);

    assert.equal(facts.pointerStoreId, 'yaml-store');
    assert.deepEqual(facts.referenceStoreIds, ['yaml-ref']);
    assertDirInvariant(before, after, 'config.yaml preference derivation');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('deriveProjectRelationshipFacts leaves the filesystem unchanged when config is absent', async () => {
  const root = await createRelationshipFixture('openspec-webui-rel-none-');
  try {
    const before = await snapshotDir(root);
    const facts = await deriveProjectRelationshipFacts(root);
    const after = await snapshotDir(root);

    assert.equal(facts.pointerStoreId, null);
    assert.deepEqual(facts.referenceStoreIds, []);
    assertDirInvariant(before, after, 'absent config derivation');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
