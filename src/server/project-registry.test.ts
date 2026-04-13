import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  mkdir,
  mkdtemp,
  readFile,
  rename as renameFile,
  rm,
  stat as statFile,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import type { OpenSpecData } from '../parser/index.js';
import type { createFileWatcher } from '../watcher/file-watcher.js';
import type { CommandAvailability } from './openspec-config.js';
import {
  PROJECT_REGISTRY_VERSION,
  ProjectRegistryError,
  createProjectRegistry,
  getOpenSpecPath,
  type ClosableWatcher,
} from './project-registry.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

interface WatcherRecord extends ClosableWatcher {
  readonly path: string;
  closeCalls: number;
}

async function createTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function createProjectRoot(name: string): Promise<string> {
  const sandbox = await createTempDir('openspec-webui-project-');
  const projectRoot = join(sandbox, name);
  await mkdir(join(projectRoot, 'openspec'), { recursive: true });
  await writeFile(join(projectRoot, 'openspec', 'project.md'), `# ${name}\n`);
  return projectRoot;
}

function createData(openspecPath: string): OpenSpecData {
  const projectName = basename(openspecPath);

  return {
    project: {
      name: projectName,
      description: `Description for ${projectName}`,
      path: join(openspecPath, 'project.md'),
      content: `# ${projectName}`,
    },
    specs: [],
    changes: {
      active: [],
      archived: [],
    },
    stats: {
      totalSpecs: 0,
      activeChanges: 0,
      archivedChanges: 0,
      overallTaskProgress: {
        done: 0,
        total: 0,
        percentage: 0,
      },
    },
  };
}

function createRegistryHarness() {
  const watcherRecords: WatcherRecord[] = [];
  const parseCalls: string[] = [];
  const parseFailures = new Set<string>();
  const watcherFailures = new Set<string>();
  const warnings: string[] = [];
  const cacheValue: CommandAvailability = {
    status: 'ready',
    profile: 'test',
    workflows: ['new'],
    availableExpandedCommands: ['new'],
    error: null,
  };

  return {
    cacheValue,
    parseCalls,
    parseFailures,
    warnings,
    watcherFailures,
    watcherRecords,
    logger: {
      warn: (...args: unknown[]) => warnings.push(args.map(String).join(' ')),
      error: () => undefined,
    },
    parse: async (openspecPath: string) => {
      parseCalls.push(openspecPath);
      if (parseFailures.has(openspecPath)) {
        return {
          data: null,
          errors: [`Failed to parse ${openspecPath}`],
          warnings: [],
        };
      }

      return {
        data: createData(openspecPath),
        errors: [],
        warnings: [],
      };
    },
    createWatcher: ((openspecPath: string, _onChange: unknown) => {
      if (watcherFailures.has(openspecPath)) {
        throw new Error(`Failed to watch ${openspecPath}`);
      }

      const record: WatcherRecord = {
        path: openspecPath,
        closeCalls: 0,
        async close() {
          record.closeCalls += 1;
        },
      };

      watcherRecords.push(record);
      return record as unknown as ReturnType<typeof createFileWatcher>;
    }) as typeof createFileWatcher,
  };
}

async function readRegistryJson(configHome: string) {
  const registryPath = join(configHome, 'openspec-webui', 'projects.json');
  const content = await readFile(registryPath, 'utf8');
  return JSON.parse(content) as {
    version: number;
    projects: Array<{ id: string; path: string; label: string; addedAt: number; lastOpenedAt: number }>;
    activeProjectId: string | null;
  };
}

test('initialize creates missing config directory and empty registry file', async () => {
  const configHome = await createTempDir('openspec-webui-config-');
  const harness = createRegistryHarness();
  const registry = createProjectRegistry({
    env: { XDG_CONFIG_HOME: configHome },
    logger: harness.logger,
    parse: harness.parse,
    createWatcher: harness.createWatcher,
  });

  await registry.initialize();

  const stored = await readRegistryJson(configHome);
  assert.deepEqual(stored, {
    version: PROJECT_REGISTRY_VERSION,
    projects: [],
    activeProjectId: null,
  });
  assert.deepEqual(registry.listProjects(), []);
  assert.equal(registry.getActiveProject(), null);
});

test('add, activate, remove, clear, and getters manage active project session', async () => {
  const configHome = await createTempDir('openspec-webui-config-');
  const projectAlpha = await createProjectRoot('alpha-project');
  const projectBeta = await createProjectRoot('beta-project');
  const harness = createRegistryHarness();
  const registry = createProjectRegistry({
    env: { XDG_CONFIG_HOME: configHome },
    logger: harness.logger,
    parse: harness.parse,
    createWatcher: harness.createWatcher,
    now: (() => {
      let current = 100;
      return () => ++current;
    })(),
    randomId: (() => {
      let current = 0;
      return () => `project-${++current}`;
    })(),
  });

  const first = await registry.addProject(projectAlpha);
  assert.equal(first.status, 'created');
  assert.match(first.entry.id, /^project-\d+$/);
  assert.equal(registry.getActiveProjectRoot(), projectAlpha);
  assert.equal(registry.getActiveOpenSpecPath(), getOpenSpecPath(projectAlpha));
  assert.equal(registry.getActiveData()?.project.path, join(getOpenSpecPath(projectAlpha), 'project.md'));
  assert.equal(registry.listProjects().length, 1);

  registry.setCommandAvailabilityCache(harness.cacheValue);
  assert.deepEqual(registry.getCommandAvailabilityCache(), harness.cacheValue);

  const second = await registry.addProject(projectBeta);
  assert.equal(second.status, 'created');
  assert.equal(registry.getActiveProjectRoot(), projectBeta);
  assert.equal(registry.getCommandAvailabilityCache(), null);
  assert.equal(harness.watcherRecords[0]?.closeCalls, 1);

  const activated = await registry.activateProject(first.entry.id);
  assert.equal(activated.alreadyActive, false);
  assert.equal(registry.getActiveProject()?.id, first.entry.id);
  assert.equal(registry.getActiveProjectRoot(), projectAlpha);
  assert.equal(harness.watcherRecords[1]?.closeCalls, 1);

  const removed = await registry.removeProject(first.entry.id);
  assert.equal(removed.activeChanged, true);
  assert.equal(removed.activeProjectId, second.entry.id);
  assert.equal(registry.getActiveProject()?.id, second.entry.id);

  registry.setCommandAvailabilityCache(harness.cacheValue);
  const cleared = await registry.clearActiveProject();
  assert.equal(cleared.activeChanged, true);
  assert.equal(cleared.previousProjectId, second.entry.id);
  assert.equal(registry.getActiveProject(), null);
  assert.equal(registry.getActiveProjectRoot(), null);
  assert.equal(registry.getActiveOpenSpecPath(), null);
  assert.equal(registry.getActiveData(), null);
  assert.equal(registry.getCommandAvailabilityCache(), null);

  const stored = await readRegistryJson(configHome);
  assert.equal(stored.projects.length, 1);
  assert.equal(stored.projects[0]?.id, second.entry.id);
  assert.equal(stored.activeProjectId, null);
});

test('duplicate project path reactivates existing entry instead of creating a duplicate', async () => {
  const configHome = await createTempDir('openspec-webui-config-');
  const projectAlpha = await createProjectRoot('alpha-project');
  const projectBeta = await createProjectRoot('beta-project');
  const harness = createRegistryHarness();
  const registry = createProjectRegistry({
    env: { XDG_CONFIG_HOME: configHome },
    logger: harness.logger,
    parse: harness.parse,
    createWatcher: harness.createWatcher,
    randomId: (() => {
      let current = 0;
      return () => `project-${++current}`;
    })(),
  });

  const alpha = await registry.addProject(projectAlpha);
  await registry.addProject(projectBeta);
  const duplicate = await registry.addProject(getOpenSpecPath(projectAlpha));

  assert.equal(duplicate.status, 'reactivated');
  assert.equal(duplicate.entry.id, alpha.entry.id);
  assert.equal(registry.listProjects().length, 2);
  assert.equal(registry.getActiveProject()?.id, alpha.entry.id);
});

test('initialize recovers from corrupted JSON by falling back to an empty registry', async () => {
  const configHome = await createTempDir('openspec-webui-config-');
  await mkdir(join(configHome, 'openspec-webui'), { recursive: true });
  await writeFile(join(configHome, 'openspec-webui', 'projects.json'), '{broken-json');

  const harness = createRegistryHarness();
  const registry = createProjectRegistry({
    env: { XDG_CONFIG_HOME: configHome },
    logger: harness.logger,
    parse: harness.parse,
    createWatcher: harness.createWatcher,
  });

  await registry.initialize();

  assert.deepEqual(registry.listProjects(), []);
  assert.equal(registry.getActiveProject(), null);
  assert.match(harness.warnings.join('\n'), /Failed to load project registry/);

  const stored = await readRegistryJson(configHome);
  assert.deepEqual(stored, {
    version: PROJECT_REGISTRY_VERSION,
    projects: [],
    activeProjectId: null,
  });
});

test('initialize ignores invalid saved paths and preserves valid persisted entries safely', async () => {
  const configHome = await createTempDir('openspec-webui-config-');
  const validProject = await createProjectRoot('valid-project');
  const invalidProject = await createTempDir('openspec-webui-invalid-project-');
  await mkdir(join(configHome, 'openspec-webui'), { recursive: true });
  await writeFile(
    join(configHome, 'openspec-webui', 'projects.json'),
    `${JSON.stringify(
      {
        version: PROJECT_REGISTRY_VERSION,
        projects: [
          {
            id: 'valid-1',
            path: validProject,
            label: 'Valid Project',
            addedAt: 1,
            lastOpenedAt: 2,
          },
          {
            id: 'invalid-1',
            path: invalidProject,
            label: 'Invalid Project',
            addedAt: 3,
            lastOpenedAt: 4,
          },
        ],
        activeProjectId: 'invalid-1',
      },
      null,
      2
    )}\n`
  );

  const harness = createRegistryHarness();
  const registry = createProjectRegistry({
    env: { XDG_CONFIG_HOME: configHome },
    logger: harness.logger,
    parse: harness.parse,
    createWatcher: harness.createWatcher,
  });

  await registry.initialize();

  assert.equal(registry.listProjects().length, 1);
  assert.equal(registry.listProjects()[0]?.id, 'valid-1');
  assert.equal(registry.getActiveProject(), null);
  assert.match(harness.warnings.join('\n'), /Ignoring invalid persisted project path/);

  const stored = await readRegistryJson(configHome);
  assert.equal(stored.projects.length, 1);
  assert.equal(stored.projects[0]?.id, 'valid-1');
  assert.equal(stored.activeProjectId, null);
});

test('activation rollback keeps previous session and watcher when target parse fails', async () => {
  const configHome = await createTempDir('openspec-webui-config-');
  const projectAlpha = await createProjectRoot('alpha-project');
  const projectBeta = await createProjectRoot('beta-project');
  const harness = createRegistryHarness();
  const registry = createProjectRegistry({
    env: { XDG_CONFIG_HOME: configHome },
    logger: harness.logger,
    parse: harness.parse,
    createWatcher: harness.createWatcher,
    randomId: (() => {
      let current = 0;
      return () => `project-${++current}`;
    })(),
  });

  const alpha = await registry.addProject(projectAlpha);
  const beta = await registry.addProject(projectBeta);
  await registry.activateProject(alpha.entry.id);

  const activeBeforeFailure = registry.getActiveProject();
  const alphaWatcher = harness.watcherRecords[harness.watcherRecords.length - 1];
  harness.parseFailures.add(getOpenSpecPath(projectBeta));

  await assert.rejects(() => registry.activateProject(beta.entry.id), (error: unknown) => {
    assert.ok(error instanceof ProjectRegistryError);
    assert.equal(error.code, 'ACTIVATION_FAILED');
    return true;
  });

  assert.equal(registry.getActiveProject()?.id, activeBeforeFailure?.id);
  assert.equal(registry.getActiveProjectRoot(), projectAlpha);
  assert.equal(alphaWatcher?.closeCalls, 0);

  const stored = await readRegistryJson(configHome);
  assert.equal(stored.activeProjectId, alpha.entry.id);
});

test('atomic writes use temp file rename semantics', async () => {
  const configHome = await createTempDir('openspec-webui-config-');
  const projectAlpha = await createProjectRoot('alpha-project');
  const harness = createRegistryHarness();
  const writes: string[] = [];
  const renames: Array<{ from: string; to: string }> = [];

  const registry = createProjectRegistry({
    env: { XDG_CONFIG_HOME: configHome },
    logger: harness.logger,
    parse: harness.parse,
    createWatcher: harness.createWatcher,
    fileSystem: {
      async mkdir(path, options) {
        return mkdir(path.toString(), options);
      },
      async readFile(path, encoding) {
        return readFile(path.toString(), encoding);
      },
      async rename(from, to) {
        renames.push({ from: from.toString(), to: to.toString() });
        return renameFile(from, to);
      },
      async stat(path) {
        return statFile(path);
      },
      async writeFile(path, data, encoding) {
        writes.push(path.toString());
        return writeFile(path, data, encoding);
      },
    },
  });

  await registry.initialize();
  await registry.addProject(projectAlpha);

  const registryPath = join(configHome, 'openspec-webui', 'projects.json');
  assert.ok(writes.length >= 2);
  assert.ok(writes.every((path) => path !== registryPath));
  assert.ok(renames.length >= 2);
  assert.ok(renames.every(({ from, to }) => from.endsWith('.tmp') && to === registryPath));
});
