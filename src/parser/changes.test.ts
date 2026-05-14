import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { mkdir, mkdtemp, rm, utimes, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { parseChangeByName, parseChanges } from './changes.js';

// ---------------------------------------------------------------------------
// Helper: create a change fixture with standard artifacts plus optional
// non-standard files so tests can verify both current and future behaviour.
// ---------------------------------------------------------------------------
async function createRichChangeFixture(name: string) {
  const root = await mkdtemp(join(tmpdir(), 'openspec-webui-changes-'));
  tempDirs.push(root);

  const changePath = join(root, 'changes', name);
  await mkdir(changePath, { recursive: true });

  // Standard artifacts
  await writeFile(join(changePath, 'proposal.md'), '## Why\n\nTest proposal\n');
  await writeFile(join(changePath, 'tasks.md'), '- [x] completed task\n- [ ] pending task\n');
  await writeFile(join(changePath, 'design.md'), '## Design\n\nTest design content\n');

  return { root, changePath };
}

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))
  );
});

async function createChangeFixture(name: string) {
  const root = await mkdtemp(join(tmpdir(), 'openspec-webui-changes-'));
  tempDirs.push(root);

  const changePath = join(root, 'changes', name);
  await mkdir(changePath, { recursive: true });

  const proposalPath = join(changePath, 'proposal.md');
  const tasksPath = join(changePath, 'tasks.md');

  await writeFile(proposalPath, '## Why\n\nTest proposal\n');
  await writeFile(tasksPath, '- [x] completed task\n- [ ] pending task\n');

  return { root, changePath, proposalPath, tasksPath };
}

async function setFileMtime(path: string, iso: string) {
  const date = new Date(iso);
  await utimes(path, date, date);
}

test('parseChangeByName uses the newest root change file for lastModified', async () => {
  const fixture = await createChangeFixture('root-mtime-change');

  await setFileMtime(fixture.proposalPath, '2026-04-10T08:00:00.000Z');
  await setFileMtime(fixture.tasksPath, '2026-04-11T09:30:00.000Z');

  const result = await parseChangeByName(fixture.root, 'root-mtime-change');

  assert.equal(result.errors.length, 0);
  assert.equal(result.data?.lastModified, '2026-04-11T09:30:00.000Z');
});

test('parseChangeByName includes files under changes/<name>/specs in lastModified', async () => {
  const fixture = await createChangeFixture('spec-delta-mtime-change');
  const specDeltaDir = join(fixture.changePath, 'specs', 'explorer-pane');
  const specDeltaPath = join(specDeltaDir, 'spec.md');

  await mkdir(specDeltaDir, { recursive: true });
  await writeFile(specDeltaPath, '## MODIFIED Requirements\n\n### Requirement: Example\n');

  await setFileMtime(fixture.proposalPath, '2026-04-10T08:00:00.000Z');
  await setFileMtime(fixture.tasksPath, '2026-04-11T09:30:00.000Z');
  await setFileMtime(specDeltaPath, '2026-04-12T07:45:00.000Z');

  const result = await parseChangeByName(fixture.root, 'spec-delta-mtime-change');

  assert.equal(result.errors.length, 0);
  assert.equal(result.data?.specDeltas.length, 1);
  assert.equal(result.data?.lastModified, '2026-04-12T07:45:00.000Z');
});

test('parseChanges sorts archived changes by newest lastModified first', async () => {
  const root = await mkdtemp(join(tmpdir(), 'openspec-webui-archive-sort-'));
  tempDirs.push(root);

  const olderPath = join(root, 'changes', 'archive', '2026-04-10-older-change');
  const newerPath = join(root, 'changes', 'archive', '2026-04-10-newer-change');

  await mkdir(olderPath, { recursive: true });
  await mkdir(newerPath, { recursive: true });

  const olderTasksPath = join(olderPath, 'tasks.md');
  const newerTasksPath = join(newerPath, 'tasks.md');

  await writeFile(olderTasksPath, '- [x] done\n');
  await writeFile(newerTasksPath, '- [x] done\n');

  await setFileMtime(olderTasksPath, '2026-04-10T08:00:00.000Z');
  await setFileMtime(newerTasksPath, '2026-04-10T09:00:00.000Z');

  const result = await parseChanges(root);

  assert.equal(result.errors.length, 0);
  assert.deepEqual(result.data?.archived.map((change) => change.name), [
    '2026-04-10-newer-change',
    '2026-04-10-older-change',
  ]);
});

// ---------------------------------------------------------------------------
// Other Files – parser behaviour for non-standard change-directory files
// ---------------------------------------------------------------------------

test('parseChangeByName exposes direct change-directory other files separately from standard artifacts', async () => {
  const fixture = await createRichChangeFixture('non-md-other');
  // Non-standard files that belong directly in the change directory
  await writeFile(join(fixture.changePath, '.openspec.yaml'), 'schema: spec-driven\n');
  await writeFile(join(fixture.changePath, 'revisions.json'), JSON.stringify({ revisions: [] }));
  await writeFile(join(fixture.changePath, 'notes.md'), '# Work Notes\n\nContext about this change.\n');

  const result = await parseChangeByName(fixture.root, 'non-md-other');

  assert.equal(result.errors.length, 0);
  assert.ok(result.data);

  // Standard artifacts still parse correctly regardless of other files present
  assert.equal(result.data!.proposal, '## Why\n\nTest proposal\n');
  assert.equal(result.data!.tasks.length, 2);
  assert.equal(result.data!.tasks[0]!.text, 'completed task');
  assert.equal(result.data!.tasks[1]!.text, 'pending task');
  assert.equal(result.data!.design, '## Design\n\nTest design content\n');

  // Main tab groups still only contain standard markdown artifacts.
  assert.equal(result.data!.files.length, 3);
  assert.equal(result.data!.specDeltas.length, 0);

  const filePaths = result.data!.files.map((f) => f.path).sort();
  assert.deepEqual(filePaths, ['design.md', 'proposal.md', 'tasks.md']);

  // Other Files are exposed separately and counted without .openspec.yaml noise.
  const otherFilePaths = result.data!.otherFiles.map((f) => f.path).sort();
  assert.deepEqual(otherFilePaths, ['.openspec.yaml', 'notes.md', 'revisions.json']);
  assert.equal(result.data!.otherFileCount, 2);

  // fileGroups remain the standard core groups only.
  const groupNames = result.data!.fileGroups.map((g) => g.name);
  assert.deepEqual(groupNames, ['Proposal', 'Tasks', 'Design']);
});

test('other file count excludes standard artifacts and spec delta docs', async () => {
  const fixture = await createRichChangeFixture('other-exclusions');
  await writeFile(join(fixture.changePath, '.openspec.yaml'), 'schema: spec-driven\n');
  await writeFile(join(fixture.changePath, 'revisions.json'), JSON.stringify({ revisions: [] }));

  // Create spec delta (should NOT count as other file)
  const specDeltaDir = join(fixture.changePath, 'specs', 'test-spec');
  await mkdir(specDeltaDir, { recursive: true });
  await writeFile(join(specDeltaDir, 'spec.md'), '## MODIFIED Requirements\n\n### Requirement: Example\n');

  const result = await parseChangeByName(fixture.root, 'other-exclusions');
  assert.equal(result.errors.length, 0);
  assert.ok(result.data);

  assert.equal(result.data!.specDeltas.length, 1, 'spec delta should still be parsed');
  assert.ok(result.data!.proposal, 'proposal should still be parsed');
  assert.ok(result.data!.design, 'design should still be parsed');
  assert.deepEqual(
    result.data!.otherFiles.map((file) => file.path).sort(),
    ['.openspec.yaml', 'revisions.json'],
  );
  assert.equal(result.data!.otherFileCount, 1);
});
