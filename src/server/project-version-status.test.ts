import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createProjectVersionStatusService } from './project-version-status.js';
import type { ProjectEntry } from './project-registry.js';
import { detectProjectGenerationVersion } from './skill-scanner.js';
import type { VersionSnapshot, VersionSnapshotService } from './version-status.js';

const tempDirs: string[] = [];

async function makeProjectRoot(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'openspec-webui-project-version-'));
  tempDirs.push(dir);
  return dir;
}

async function write(dir: string, relPath: string, content = ''): Promise<void> {
  const full = join(dir, relPath);
  await mkdir(join(full, '..'), { recursive: true });
  await writeFile(full, content, 'utf8');
}

function skillMarkdown(generatedBy: string): string {
  return [
    '---',
    'name: openspec-propose',
    'description: Propose a new change.',
    'metadata:',
    '  author: openspec',
    '  version: "1.0"',
    `  generatedBy: "${generatedBy}"`,
    '---',
    '',
    '# openspec-propose',
    '',
  ].join('\n');
}

function makeProjectEntry(path: string, index: number): ProjectEntry {
  return {
    id: `project-${index}`,
    path,
    label: `Project ${index}`,
    addedAt: index,
    lastOpenedAt: index,
  };
}

function makeToolSnapshot(currentVersion: string | null) {
  return {
    currentVersion,
    latestVersion: null,
    updateAvailable: false,
    status: currentVersion ? 'unknown' : 'unavailable',
    error: null,
    notInstalled: currentVersion === null,
  } as const;
}

function makeVersionSnapshot(currentVersion: string | null): VersionSnapshot {
  return {
    loading: false,
    checkedAt: null,
    tools: {
      webui: makeToolSnapshot('0.3.5'),
      openspec: makeToolSnapshot(currentVersion),
    },
  };
}

interface FakeVersionSnapshotService extends Pick<VersionSnapshotService, 'getSnapshot' | 'refresh'> {
  refreshCalls: number;
}

function makeVersionSnapshotService(options: {
  current: string | null;
  afterRefresh?: string | null;
}): FakeVersionSnapshotService {
  let version = options.current;
  const service = {
    refreshCalls: 0,
    getSnapshot: (): VersionSnapshot => makeVersionSnapshot(version),
    refresh: async (): Promise<VersionSnapshot> => {
      service.refreshCalls += 1;
      if (options.afterRefresh !== undefined) {
        version = options.afterRefresh;
      }
      return makeVersionSnapshot(version);
    },
  };
  return service;
}

const FIXED_NOW = '2026-08-11T00:00:00.000Z';

function createService(options: {
  projects: readonly ProjectEntry[];
  versionSnapshotService: FakeVersionSnapshotService;
  detectGenerationVersion?: (projectRoot: string) => Promise<string | null>;
  now?: () => Date;
}) {
  return createProjectVersionStatusService({
    autoStart: false,
    deps: {
      listProjects: () => options.projects,
      detectGenerationVersion: options.detectGenerationVersion ?? detectProjectGenerationVersion,
      versionSnapshotService: options.versionSnapshotService,
      now: options.now ?? (() => new Date(FIXED_NOW)),
    },
  });
}

test('reports up-to-date when generation equals the current CLI version', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  const version = makeVersionSnapshotService({ current: '1.8.0' });
  const service = createService({
    projects: [makeProjectEntry(root, 1)],
    versionSnapshotService: version,
  });

  const snapshot = await service.refresh();

  assert.equal(snapshot.currentCliVersion, '1.8.0');
  assert.equal(snapshot.checkedAt, FIXED_NOW);
  assert.deepEqual(snapshot.projects, [
    {
      path: root,
      generationVersion: '1.8.0',
      currentVersion: '1.8.0',
      status: 'up-to-date',
    },
  ]);
});

test('reports up-to-date when generation is newer than the current CLI version', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.9.0'));
  const service = createService({
    projects: [makeProjectEntry(root, 1)],
    versionSnapshotService: makeVersionSnapshotService({ current: '1.8.0' }),
  });

  const snapshot = await service.refresh();

  assert.equal(snapshot.projects[0]?.status, 'up-to-date');
});

test('reports update-available when the current CLI version is newer', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.7.0'));
  const service = createService({
    projects: [makeProjectEntry(root, 1)],
    versionSnapshotService: makeVersionSnapshotService({ current: '1.8.0' }),
  });

  const snapshot = await service.refresh();

  assert.equal(snapshot.projects[0]?.status, 'update-available');
  assert.equal(snapshot.projects[0]?.generationVersion, '1.7.0');
  assert.equal(snapshot.projects[0]?.currentVersion, '1.8.0');
});

test('reports update-available for a prerelease generation against a release CLI', async () => {
  const root = await makeProjectRoot();
  await write(root, '.opencode/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0-rc.1'));
  const service = createService({
    projects: [makeProjectEntry(root, 1)],
    versionSnapshotService: makeVersionSnapshotService({ current: '1.8.0' }),
  });

  const snapshot = await service.refresh();

  assert.equal(snapshot.projects[0]?.status, 'update-available');
});

test('normalizes versions consistently with version-compare helpers', async () => {
  const root = await makeProjectRoot();
  await write(root, '.github/skills/openspec-propose/SKILL.md', skillMarkdown('v1.8.0'));
  const service = createService({
    projects: [makeProjectEntry(root, 1)],
    versionSnapshotService: makeVersionSnapshotService({ current: 'v1.8.0' }),
  });

  const snapshot = await service.refresh();

  assert.equal(snapshot.currentCliVersion, '1.8.0');
  assert.equal(snapshot.projects[0]?.generationVersion, '1.8.0');
  assert.equal(snapshot.projects[0]?.status, 'up-to-date');
});

test('preserves registry order and isolates per-project failures as unknown', async () => {
  const older = await makeProjectRoot();
  const unreadable = await makeProjectRoot();
  const newer = await makeProjectRoot();
  await write(older, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.5.0'));
  // A directory named SKILL.md cannot be read as a file (EISDIR), so detection
  // for this project must fail deterministically.
  await mkdir(join(unreadable, '.claude/skills/openspec-propose/SKILL.md'), { recursive: true });
  await write(newer, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.9.0'));

  const service = createService({
    projects: [
      makeProjectEntry(older, 1),
      makeProjectEntry(unreadable, 2),
      makeProjectEntry(newer, 3),
    ],
    versionSnapshotService: makeVersionSnapshotService({ current: '1.8.0' }),
  });

  const snapshot = await service.refresh();

  assert.deepEqual(
    snapshot.projects.map((entry) => [entry.path, entry.generationVersion, entry.status]),
    [
      [older, '1.5.0', 'update-available'],
      [unreadable, null, 'unknown'],
      [newer, '1.9.0', 'up-to-date'],
    ]
  );
});

test('reports unknown when no skill marker exists', async () => {
  const root = await makeProjectRoot();
  await write(root, 'openspec/config.yaml', 'schema: spec-driven');
  const service = createService({
    projects: [makeProjectEntry(root, 1)],
    versionSnapshotService: makeVersionSnapshotService({ current: '1.8.0' }),
  });

  const snapshot = await service.refresh();

  assert.equal(snapshot.currentCliVersion, '1.8.0');
  assert.deepEqual(snapshot.projects, [
    {
      path: root,
      generationVersion: null,
      currentVersion: '1.8.0',
      status: 'unknown',
    },
  ]);
});

test('reports unknown statuses but still scans and preserves generation versions when the CLI version is unavailable', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  const secondRoot = await makeProjectRoot();
  const scanner = { calls: 0 };
  const service = createService({
    projects: [makeProjectEntry(root, 1), makeProjectEntry(secondRoot, 2)],
    versionSnapshotService: makeVersionSnapshotService({ current: null, afterRefresh: null }),
    detectGenerationVersion: async (projectRoot) => {
      scanner.calls += 1;
      return detectProjectGenerationVersion(projectRoot);
    },
  });

  const snapshot = await service.refresh();

  assert.equal(snapshot.currentCliVersion, null);
  assert.equal(snapshot.checkedAt, FIXED_NOW);
  // The unavailable baseline must not suppress detection: every registered
  // project is still scanned.
  assert.equal(scanner.calls, 2);
  assert.deepEqual(snapshot.projects, [
    { path: root, generationVersion: '1.8.0', currentVersion: null, status: 'unknown' },
    { path: secondRoot, generationVersion: null, currentVersion: null, status: 'unknown' },
  ]);
});

test('awaits the version snapshot refresh when the CLI version is not yet cached (startup race)', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  const version = makeVersionSnapshotService({ current: null, afterRefresh: '1.8.0' });
  const service = createService({
    projects: [makeProjectEntry(root, 1)],
    versionSnapshotService: version,
  });

  const snapshot = await service.refresh();

  assert.equal(version.refreshCalls, 1);
  assert.equal(snapshot.currentCliVersion, '1.8.0');
  assert.equal(snapshot.projects[0]?.status, 'up-to-date');
});

test('uses the cached CLI version without triggering a version refresh when available', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  const version = makeVersionSnapshotService({ current: '1.8.0' });
  const service = createService({
    projects: [makeProjectEntry(root, 1)],
    versionSnapshotService: version,
  });

  const snapshot = await service.refresh();

  assert.equal(version.refreshCalls, 0);
  assert.equal(snapshot.projects[0]?.status, 'up-to-date');
});

test('isolates a throwing scanner as unknown and keeps the other projects', async () => {
  const failing = await makeProjectRoot();
  const working = await makeProjectRoot();
  await write(working, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  const service = createService({
    projects: [makeProjectEntry(failing, 1), makeProjectEntry(working, 2)],
    versionSnapshotService: makeVersionSnapshotService({ current: '1.8.0' }),
    detectGenerationVersion: async (projectRoot) => {
      if (projectRoot === failing) {
        throw new Error('boom');
      }
      return detectProjectGenerationVersion(projectRoot);
    },
  });

  const snapshot = await service.refresh();

  assert.deepEqual(
    snapshot.projects.map((entry) => [entry.path, entry.status]),
    [
      [failing, 'unknown'],
      [working, 'up-to-date'],
    ]
  );
});

test('returns an empty project list with the current CLI version when no projects are registered', async () => {
  const service = createService({
    projects: [],
    versionSnapshotService: makeVersionSnapshotService({ current: '1.8.0' }),
  });

  const snapshot = await service.refresh();

  assert.equal(snapshot.currentCliVersion, '1.8.0');
  assert.equal(snapshot.checkedAt, FIXED_NOW);
  assert.deepEqual(snapshot.projects, []);
});

test('getSnapshot returns a cached clone that callers cannot mutate', async () => {
  const root = await makeProjectRoot();
  await write(root, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  const service = createService({
    projects: [makeProjectEntry(root, 1)],
    versionSnapshotService: makeVersionSnapshotService({ current: '1.8.0' }),
  });

  // Before any refresh the cached snapshot is the empty initial state.
  assert.deepEqual(service.getSnapshot(), { currentCliVersion: null, checkedAt: null, projects: [] });

  await service.refresh();
  const first = service.getSnapshot();
  first.projects[0]!.status = 'update-available';
  first.projects.push({ path: '/fake', generationVersion: null, currentVersion: null, status: 'unknown' });

  const second = service.getSnapshot();
  assert.equal(second.projects.length, 1);
  assert.equal(second.projects[0]?.status, 'up-to-date');
});

test('dedups concurrent refresh calls into a single scan', async () => {
  const rootA = await makeProjectRoot();
  const rootB = await makeProjectRoot();
  await write(rootA, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  await write(rootB, '.claude/skills/openspec-propose/SKILL.md', skillMarkdown('1.8.0'));
  const scanner = { calls: 0 };
  const service = createService({
    projects: [makeProjectEntry(rootA, 1), makeProjectEntry(rootB, 2)],
    versionSnapshotService: makeVersionSnapshotService({ current: '1.8.0' }),
    detectGenerationVersion: async (projectRoot) => {
      scanner.calls += 1;
      return detectProjectGenerationVersion(projectRoot);
    },
  });

  const [first, second] = await Promise.all([service.refresh(), service.refresh()]);

  assert.equal(scanner.calls, 2);
  assert.equal(first.projects.length, 2);
  assert.deepEqual(second, first);
});

// Cleanup temp dirs after all tests.
process.on('exit', () => {
  for (const dir of tempDirs.splice(0)) {
    void rm(dir, { recursive: true, force: true });
  }
});
