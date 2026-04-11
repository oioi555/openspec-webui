import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { mkdir, mkdtemp, rm, utimes, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { parseChangeByName } from './changes.js';

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
  const specDeltaDesignPath = join(specDeltaDir, 'design.md');

  await mkdir(specDeltaDir, { recursive: true });
  await writeFile(specDeltaPath, '## MODIFIED Requirements\n\n### Requirement: Example\n');
  await writeFile(specDeltaDesignPath, '## Context\n\nFollow-up design note\n');

  await setFileMtime(fixture.proposalPath, '2026-04-10T08:00:00.000Z');
  await setFileMtime(fixture.tasksPath, '2026-04-11T09:30:00.000Z');
  await setFileMtime(specDeltaPath, '2026-04-12T07:45:00.000Z');
  await setFileMtime(specDeltaDesignPath, '2026-04-13T11:15:00.000Z');

  const result = await parseChangeByName(fixture.root, 'spec-delta-mtime-change');

  assert.equal(result.errors.length, 0);
  assert.equal(result.data?.specDeltas.length, 1);
  assert.equal(result.data?.lastModified, '2026-04-13T11:15:00.000Z');
});
