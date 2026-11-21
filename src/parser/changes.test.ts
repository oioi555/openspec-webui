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

async function writeSpecDelta(
  changePath: string,
  capabilityPath: string,
  content = '## MODIFIED Requirements\n\n### Requirement: Example\n',
): Promise<string> {
  const specDeltaDir = join(changePath, 'specs', ...capabilityPath.split('/'));
  await mkdir(specDeltaDir, { recursive: true });
  const specPath = join(specDeltaDir, 'spec.md');
  await writeFile(specPath, content);
  return specPath;
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

test('parseChangeByName discovers nested spec deltas with relative capability identity', async () => {
  const fixture = await createChangeFixture('nested-delta-change');
  await writeSpecDelta(fixture.changePath, 'network/auth');

  const result = await parseChangeByName(fixture.root, 'nested-delta-change');

  assert.equal(result.errors.length, 0);
  assert.deepEqual(
    (result.data?.specDeltas ?? []).map((delta) => delta.capability),
    ['network/auth'],
  );
});

test('parseChangeByName mixes top-level and nested spec deltas, skips empty parents, and sorts by capability', async () => {
  const fixture = await createChangeFixture('mixed-delta-change');
  await writeSpecDelta(fixture.changePath, 'network/auth');
  await writeSpecDelta(fixture.changePath, 'explorer-pane');

  const result = await parseChangeByName(fixture.root, 'mixed-delta-change');

  assert.equal(result.errors.length, 0);
  assert.deepEqual(
    (result.data?.specDeltas ?? []).map((delta) => delta.capability),
    ['explorer-pane', 'network/auth'],
  );
});

test('parseChangeByName omits deleted retired spec delta files without error', async () => {
  const fixture = await createChangeFixture('retired-delta-change');
  await writeSpecDelta(fixture.changePath, 'explorer-pane');
  const retiredPath = await writeSpecDelta(fixture.changePath, 'retired');
  await rm(retiredPath, { force: true });

  const result = await parseChangeByName(fixture.root, 'retired-delta-change');

  assert.equal(result.errors.length, 0);
  assert.deepEqual(
    (result.data?.specDeltas ?? []).map((delta) => delta.capability),
    ['explorer-pane'],
  );
});

test('parseChangeByName keeps nested spec deltas out of file groups and Other Files', async () => {
  const fixture = await createRichChangeFixture('nested-delta-other');
  const notesPath = join(fixture.changePath, 'notes.md');
  await writeFile(notesPath, '# Work Notes\n');
  const nestedDeltaPath = await writeSpecDelta(fixture.changePath, 'network/auth');

  await setFileMtime(join(fixture.changePath, 'proposal.md'), '2026-04-10T08:00:00.000Z');
  await setFileMtime(join(fixture.changePath, 'tasks.md'), '2026-04-11T09:30:00.000Z');
  await setFileMtime(join(fixture.changePath, 'design.md'), '2026-04-11T10:00:00.000Z');
  await setFileMtime(notesPath, '2026-04-11T11:00:00.000Z');
  await setFileMtime(nestedDeltaPath, '2026-04-12T07:45:00.000Z');

  const result = await parseChangeByName(fixture.root, 'nested-delta-other');

  assert.equal(result.errors.length, 0);
  assert.ok(result.data);
  assert.deepEqual(
    result.data.specDeltas.map((delta) => delta.capability),
    ['network/auth'],
  );
  assert.deepEqual(
    result.data.files.map((file) => file.path).sort(),
    ['design.md', 'proposal.md', 'tasks.md'],
  );
  assert.deepEqual(
    result.data.otherFiles.map((file) => file.path).sort(),
    ['notes.md'],
  );
  assert.equal(result.data.lastModified, '2026-04-12T07:45:00.000Z');
});

// ---------------------------------------------------------------------------
// Delta header rules (OpenSpec 2.1.1 parity)
// ---------------------------------------------------------------------------
async function parseDeltaOps(content: string) {
  const fixture = await createChangeFixture('delta-headers');
  await writeSpecDelta(fixture.changePath, 'cap', content);
  const result = await parseChangeByName(fixture.root, 'delta-headers');
  assert.ok(result.data);
  return result.data.specDeltas[0].operations;
}

test('delta parser accepts a requirement header without a space after ###', async () => {
  const ops = await parseDeltaOps('## ADDED Requirements\n\n###Requirement: Compact header\nBody\n');
  assert.deepEqual(ops.map((op) => [op.type, op.name]), [['added', 'Compact header']]);
});

test('delta parser strips closing hash runs from section and requirement headers', async () => {
  const ops = await parseDeltaOps('## MODIFIED Requirements ##\n\n### Requirement: Foo ###\nBody\n\n### Requirement: C#\n');
  assert.deepEqual(ops.map((op) => [op.type, op.name]), [['modified', 'Foo'], ['modified', 'C#']]);
});

test('delta parser ignores headers inside fenced code blocks', async () => {
  const content = [
    '## ADDED Requirements',
    '',
    '### Requirement: Outer',
    '````md',
    '### Requirement: Example',
    '```',
    '## REMOVED Requirements',
    '````',
    '~~~',
    '### Requirement: Tilde',
    '~~~',
    'Tail',
  ].join('\n');
  const ops = await parseDeltaOps(content);
  assert.deepEqual(ops.map((op) => [op.type, op.name]), [['added', 'Outer']]);
  assert.equal(ops[0].content, content.split('\n').slice(2).join('\n'));
});

test('delta parser lets an unclosed fence swallow the rest of the file', async () => {
  const ops = await parseDeltaOps('## ADDED Requirements\n\n### Requirement: A\n```\n### Requirement: B\n');
  assert.deepEqual(ops.map((op) => op.name), ['A']);
});

test('delta parser treats a backtick opener with a backtick in its info string as inline code', async () => {
  const ops = await parseDeltaOps('## ADDED Requirements\n\n### Requirement: A\n```npm test```\n\n### Requirement: B\nBody\n');
  assert.deepEqual(ops.map((op) => op.name), ['A', 'B']);
});

test('delta parser gives CRLF and BOM files the same operations as LF', async () => {
  const lf = '## ADDED Requirements\n\n### Requirement: One\nBody\n\n## REMOVED Requirements\n### Requirement: Two\n';
  const lfOps = await parseDeltaOps(lf);
  const crlfOps = await parseDeltaOps('﻿' + lf.replace(/\n/g, '\r\n'));
  assert.deepEqual(crlfOps, lfOps);
  assert.deepEqual(lfOps.map((op) => [op.type, op.name]), [['added', 'One'], ['removed', 'Two']]);
});

test('delta parser ends a requirement at a non-delta ## header', async () => {
  const ops = await parseDeltaOps('## ADDED Requirements\n\n### Requirement: A\nBody\n\n## Notes\nStray\n### Requirement: Orphan\n');
  assert.deepEqual(ops.map((op) => [op.type, op.name, op.content]), [['added', 'A', '### Requirement: A\nBody']]);
});

test('delta parser blanks leading frontmatter and keeps line numbers', async () => {
  const ops = await parseDeltaOps('---\nowner: a\n---\n## ADDED Requirements\n### Requirement: A\nBody\n');
  assert.deepEqual(ops.map((op) => [op.name, op.startLine, op.content]), [['A', 5, '### Requirement: A\nBody']]);
  const rule = await parseDeltaOps('---\n## ADDED Requirements\n### Requirement: B\n');
  assert.deepEqual(rule.map((op) => op.name), ['B']);
});

test('delta parser trims trailing whitespace from requirement content', async () => {
  const ops = await parseDeltaOps('## ADDED Requirements\n### Requirement: A\nBody  \n\n\n### Requirement: B\nEnd\t\n\n');
  assert.deepEqual(ops.map((op) => op.content), ['### Requirement: A\nBody', '### Requirement: B\nEnd']);
});

test('delta parser keeps accepting a singular section header', async () => {
  const ops = await parseDeltaOps('## ADDED Requirement\n### Requirement: A\n');
  assert.deepEqual(ops.map((op) => [op.type, op.name]), [['added', 'A']]);
});
