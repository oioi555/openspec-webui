import assert from 'node:assert/strict';
import { createServer as createTcpServer } from 'node:net';
import { afterEach, beforeEach, test } from 'node:test';
import { chmod, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { createServer } from './index.js';
import { createVersionSnapshotService, type VersionSnapshotService } from './version-status.js';

const WS_OPEN = 1;

const tempDirs: string[] = [];
const originalCwd = process.cwd();
const originalEnv = {
  XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
  PATH: process.env.PATH,
};

beforeEach(() => {
  delete process.env.XDG_CONFIG_HOME;
});

afterEach(async () => {
  process.chdir(originalCwd);
  process.env.XDG_CONFIG_HOME = originalEnv.XDG_CONFIG_HOME;
  process.env.PATH = originalEnv.PATH;
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function createProjectConfigYaml(name: string, options: { context?: string; schema?: string } = {}) {
  const context = options.context ?? `Description for ${name}.`;
  const schema = options.schema ?? 'default-workflow';
  const indent = (value: string) =>
    value
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');

  return `schema: |\n${indent(schema)}\ncontext: |\n${indent(context)}\nrules:\n  tasks:\n    guidance: Keep ${name} synchronized.\n`;
}

async function createProjectFixture(name: string): Promise<string> {
  const sandbox = await createTempDir('openspec-webui-server-project-');
  const projectRoot = join(sandbox, name);
  await mkdir(projectRoot, { recursive: true });
  await cp(join(originalCwd, 'test-openspec'), join(projectRoot, 'openspec'), { recursive: true });
  await writeFile(
    join(projectRoot, 'openspec', 'config.yaml'),
    createProjectConfigYaml(name),
    'utf8'
  );
  return projectRoot;
}

async function createBrokenProjectFixture(name: string): Promise<string> {
  const projectRoot = await createProjectFixture(name);
  await rm(join(projectRoot, 'openspec', 'changes'), { recursive: true, force: true });
  await writeFile(join(projectRoot, 'openspec', 'changes'), 'not-a-directory', 'utf8');
  return projectRoot;
}

async function installFakeOpenSpecCommand(config: {
  readyProjectRoots: Set<string>;
  unavailableProjectRoots?: Set<string>;
  version?: string;
}) {
  const binDir = await createTempDir('openspec-webui-fake-bin-');
  const scriptPath = join(binDir, 'openspec');
  const readyRoots = JSON.stringify([...config.readyProjectRoots]);
  const unavailableRoots = JSON.stringify([...(config.unavailableProjectRoots ?? new Set())]);
  const version = JSON.stringify(config.version ?? '1.3.1');

  await writeFile(
    scriptPath,
    `#!/usr/bin/env node
const readyRoots = new Set(${readyRoots});
const unavailableRoots = new Set(${unavailableRoots});
const version = ${version};
const cwd = process.cwd();
const key = process.argv[4];

if (process.argv.includes('--version')) {
  process.stdout.write(version + '\\n');
  process.exit(0);
}

if (unavailableRoots.has(cwd)) {
  process.stderr.write('workflow unavailable');
  process.exit(1);
}

if (!readyRoots.has(cwd)) {
  process.stderr.write('unexpected cwd:' + cwd);
  process.exit(1);
}

if (key === 'profile') {
  process.stdout.write('test-profile\\n');
  process.exit(0);
}

if (key === 'workflows') {
  process.stdout.write('["new","verify"]\\n');
  process.exit(0);
  }

process.stderr.write('unsupported key:' + key);
process.exit(1);
`,
    'utf8'
  );
  await chmod(scriptPath, 0o755);
  process.env.PATH = `${binDir}:${process.env.PATH ?? ''}`;
}

async function startServer(options: {
  port?: number;
  host?: string;
  cwd?: string;
  versionSnapshotService?: VersionSnapshotService;
} = {}) {
  const { cwd = await createTempDir('openspec-webui-server-cwd-'), ...serverOptions } = options;
  const previousCwd = process.cwd();
  process.chdir(cwd);

  let server;
  try {
    server = await createServer({
      port: 0,
      host: '127.0.0.1',
      ...serverOptions,
    });
  } finally {
    process.chdir(previousCwd);
  }

  return {
    server,
    baseUrl: server.url,
    async close() {
      await server.close();
    },
  };
}

async function apiJson(baseUrl: string, path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
}

function formatMessage(message: unknown): string {
  return JSON.stringify(message);
}

async function waitForWebSocketOpen(ws: WebSocket): Promise<void> {
  if (ws.readyState === WS_OPEN) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const handleOpen = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error('WebSocket failed to open'));
    };
    const cleanup = () => {
      ws.removeEventListener('open', handleOpen);
      ws.removeEventListener('error', handleError);
    };

    ws.addEventListener('open', handleOpen, { once: true });
    ws.addEventListener('error', handleError, { once: true });
  });
}

async function openWsClient(baseUrl: string) {
  const ws = new WebSocket(baseUrl.replace('http', 'ws') + '/ws');
  const recorder = createWsRecorder(ws);
  await waitForWebSocketOpen(ws);
  return { ws, recorder };
}

function sendWsJson(ws: WebSocket, payload: unknown) {
  ws.send(JSON.stringify(payload));
}

async function readRegistry(configHome: string) {
  const raw = await readFile(join(configHome, 'openspec-webui', 'projects.json'), 'utf8');
  return JSON.parse(raw) as {
    version: number;
    projects: Array<{ id: string; path: string; label: string }>;
    activeProjectId: string | null;
  };
}

function createWsRecorder(ws: WebSocket) {
  const queue: unknown[] = [];
  const waiters: Array<{
    mode: 'next' | 'none';
    resolve: (message: unknown) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }> = [];

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    const waiter = waiters.shift();
    if (waiter) {
      clearTimeout(waiter.timer);
      if (waiter.mode === 'none') {
        waiter.reject(new Error(`Unexpected WebSocket message: ${formatMessage(message)}`));
        return;
      }

      waiter.resolve(message);
      return;
    }

    queue.push(message);
  });

  return {
    async nextMessage(timeoutMs = 2_000): Promise<unknown> {
      if (queue.length > 0) {
        return queue.shift();
      }

      return new Promise((resolve, reject) => {
        const waiter = {
          mode: 'next' as const,
          resolve,
          reject,
          timer: setTimeout(() => {
            const index = waiters.indexOf(waiter);
            if (index >= 0) {
              waiters.splice(index, 1);
            }
            reject(new Error(`Timed out waiting for WebSocket message after ${timeoutMs}ms`));
          }, timeoutMs),
        };

        waiters.push(waiter);
      });
    },
    async expectNoMessage(timeoutMs = 250): Promise<void> {
      if (queue.length > 0) {
        assert.fail(`Unexpected WebSocket message: ${formatMessage(queue[0])}`);
      }

      await new Promise<void>((resolve, reject) => {
        const waiter = {
          mode: 'none' as const,
          resolve: () => {
            resolve();
          },
          reject,
          timer: setTimeout(() => {
            const index = waiters.indexOf(waiter);
            if (index >= 0) {
              waiters.splice(index, 1);
            }
            resolve();
          }, timeoutMs),
        };

        waiters.push(waiter);
      });
    },
  };
}

function assertProjectBoundMessage(
  message: unknown,
  expectedProjectId: string | null,
  expectedProjectName?: string
) {
  const payload = message as {
    type: string;
    activeProjectId: string | null;
    data?: { project?: { name?: string } } | null;
  };

  assert.equal(payload.type, 'project:bound');
  assert.equal(payload.activeProjectId, expectedProjectId);

  if (expectedProjectId === null) {
    assert.equal(payload.data ?? null, null);
    return;
  }

  assert.equal(payload.data?.project?.name, expectedProjectName);
}

test('server integration covers explicit websocket binding, scoped API routing, CRUD, and default-project activation without rebinding clients', async () => {
  const configHome = await createTempDir('openspec-webui-server-config-');
  process.env.XDG_CONFIG_HOME = configHome;
  const alphaRoot = await createProjectFixture('alpha-project');
  const betaRoot = await createProjectFixture('beta-project');
  await installFakeOpenSpecCommand({
    readyProjectRoots: new Set([alphaRoot]),
    unavailableProjectRoots: new Set([betaRoot]),
  });

  const runtime = await startServer();
  const alphaClient = await openWsClient(runtime.baseUrl);

  try {
    const initMessage = await alphaClient.recorder.nextMessage();
    assert.deepEqual(initMessage, { type: 'connection:init', activeProjectId: null });

    let result = await apiJson(runtime.baseUrl, '/api/project');
    assert.equal(result.response.status, 503);
    assert.equal(result.body.code, 'NO_ACTIVE_PROJECT');

    result = await apiJson(runtime.baseUrl, '/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: alphaRoot }),
    });
    assert.equal(result.response.status, 201);
    assert.equal(result.body.project.path, alphaRoot);
    const alphaId = result.body.project.id as string;
    assert.equal(result.body.activeProjectId, alphaId);
    await alphaClient.recorder.expectNoMessage();

    sendWsJson(alphaClient.ws, { type: 'project:bind', projectId: alphaId });
    assertProjectBoundMessage(
      await alphaClient.recorder.nextMessage(),
      alphaId,
      'Alpha Project'
    );

    result = await apiJson(runtime.baseUrl, '/api/project');
    assert.equal(result.response.status, 200);
    assert.equal(result.body.project.name, 'Alpha Project');

    result = await apiJson(runtime.baseUrl, '/api/commands/availability');
    assert.equal(result.response.status, 200);
    assert.equal(result.body.availability.status, 'ready');
    assert.deepEqual(result.body.availability.availableExpandedCommands, ['new', 'verify']);
    assert.equal(result.body.availability.profile, 'test-profile');

    result = await apiJson(runtime.baseUrl, '/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: alphaRoot }),
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.project.id, alphaId);
    await alphaClient.recorder.expectNoMessage();

    result = await apiJson(runtime.baseUrl, '/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: betaRoot }),
    });
    assert.equal(result.response.status, 201);
    const betaId = result.body.project.id as string;
    await alphaClient.recorder.expectNoMessage();

    result = await apiJson(runtime.baseUrl, '/api/project');
    assert.equal(result.body.project.name, 'Beta Project');

    result = await apiJson(runtime.baseUrl, '/api/project', {
      headers: { 'X-Project-Id': alphaId },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.project.name, 'Alpha Project');

    result = await apiJson(runtime.baseUrl, '/api/projects');
    assert.equal(result.response.status, 200);
    assert.equal(result.body.projects.length, 2);
    assert.equal(result.body.activeProjectId, betaId);

    result = await apiJson(runtime.baseUrl, '/api/commands/availability', {
      headers: { 'X-Project-Id': alphaId },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.availability.status, 'ready');
    assert.deepEqual(result.body.availability.availableExpandedCommands, ['new', 'verify']);
    assert.equal(result.body.availability.profile, 'test-profile');

    result = await apiJson(runtime.baseUrl, '/api/commands/availability', {
      headers: { 'X-Project-Id': betaId },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.availability.status, 'unavailable');
    assert.match(result.body.availability.error, /workflow unavailable/i);

    const betaClient = await openWsClient(runtime.baseUrl);

    try {
      assert.deepEqual(await betaClient.recorder.nextMessage(), {
        type: 'connection:init',
        activeProjectId: betaId,
      });

      result = await apiJson(runtime.baseUrl, `/api/projects/${encodeURIComponent(alphaId)}/activate`, {
        method: 'POST',
      });
      assert.equal(result.response.status, 200);
      assert.equal(result.body.activeProjectId, alphaId);
      await alphaClient.recorder.expectNoMessage();
      await betaClient.recorder.expectNoMessage();

      result = await apiJson(runtime.baseUrl, '/api/project');
      assert.equal(result.body.project.name, 'Alpha Project');

      result = await apiJson(runtime.baseUrl, '/api/project', {
        headers: { 'X-Project-Id': betaId },
      });
      assert.equal(result.response.status, 200);
      assert.equal(result.body.project.name, 'Beta Project');

      result = await apiJson(runtime.baseUrl, '/api/commands/availability');
      assert.equal(result.response.status, 200);
      assert.equal(result.body.availability.status, 'ready');
      assert.deepEqual(result.body.availability.availableExpandedCommands, ['new', 'verify']);

      result = await apiJson(runtime.baseUrl, `/api/projects/${encodeURIComponent(alphaId)}`, {
        method: 'DELETE',
      });
      assert.equal(result.response.status, 200);
      assert.equal(result.body.removedProjectId, alphaId);
      assert.equal(result.body.activeProjectId, betaId);
      assertProjectBoundMessage(
        await alphaClient.recorder.nextMessage(),
        betaId,
        'Beta Project'
      );
      await betaClient.recorder.expectNoMessage();

      result = await apiJson(runtime.baseUrl, '/api/project');
      assert.equal(result.body.project.name, 'Beta Project');

      result = await apiJson(runtime.baseUrl, '/api/commands/availability');
      assert.equal(result.response.status, 200);
      assert.equal(result.body.availability.status, 'unavailable');
      assert.match(result.body.availability.error, /workflow unavailable/i);

      result = await apiJson(runtime.baseUrl, `/api/projects/${encodeURIComponent(betaId)}`, {
        method: 'DELETE',
      });
      assert.equal(result.response.status, 200);
      assert.equal(result.body.activeProjectId, null);
      assertProjectBoundMessage(await alphaClient.recorder.nextMessage(), null);
      assertProjectBoundMessage(await betaClient.recorder.nextMessage(), null);

      result = await apiJson(runtime.baseUrl, '/api/commands/availability');
      assert.equal(result.response.status, 200);
      assert.equal(result.body.availability.status, 'unavailable');
      assert.equal(result.body.availability.error, 'No active project selected');
    } finally {
      betaClient.ws.close();
    }

    const registry = await readRegistry(configHome);
    assert.deepEqual(registry.projects, []);
    assert.equal(registry.activeProjectId, null);
  } finally {
    alphaClient.ws.close();
    await runtime.close();
  }
});

test('startup bootstraps a valid cwd openspec directory and removes stale persisted invalid paths', async () => {
  const configHome = await createTempDir('openspec-webui-server-config-');
  process.env.XDG_CONFIG_HOME = configHome;
  const validRoot = await createProjectFixture('bootstrap-project');
  const invalidRoot = join(await createTempDir('openspec-webui-stale-project-'), 'missing-project');

  await mkdir(join(configHome, 'openspec-webui'), { recursive: true });
  await writeFile(
    join(configHome, 'openspec-webui', 'projects.json'),
    JSON.stringify(
      {
        version: 1,
        projects: [
          {
            id: 'stale-project',
            path: invalidRoot,
            label: 'Stale Project',
            addedAt: 1,
            lastOpenedAt: 1,
          },
        ],
        activeProjectId: 'stale-project',
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  const runtime = await startServer({ cwd: join(validRoot, 'openspec') });

  try {
    const result = await apiJson(runtime.baseUrl, '/api/projects');
    assert.equal(result.response.status, 200);
    assert.equal(result.body.projects.length, 1);
    assert.equal(result.body.projects[0].path, validRoot);
    assert.equal(result.body.activeProjectId, result.body.projects[0].id);

    const project = await apiJson(runtime.baseUrl, '/api/project');
    assert.equal(project.response.status, 200);
    assert.equal(project.body.project.name, 'Bootstrap Project');

    const registry = await readRegistry(configHome);
    assert.equal(registry.projects.length, 1);
    assert.equal(registry.projects[0]?.path, validRoot);
    assert.equal(registry.activeProjectId, registry.projects[0]?.id ?? null);
  } finally {
    await runtime.close();
  }
});

test('startup with existing registered projects suppresses cwd bootstrap and preserves the global default', async () => {
  const configHome = await createTempDir('openspec-webui-server-config-');
  process.env.XDG_CONFIG_HOME = configHome;
  const existingRoot = await createProjectFixture('existing-project');
  const cwdRoot = await createProjectFixture('cwd-project');

  await mkdir(join(configHome, 'openspec-webui'), { recursive: true });
  await writeFile(
    join(configHome, 'openspec-webui', 'projects.json'),
    JSON.stringify(
      {
        version: 1,
        projects: [
          {
            id: 'existing-project',
            path: existingRoot,
            label: 'Existing Project',
            addedAt: 1,
            lastOpenedAt: 1,
          },
        ],
        activeProjectId: 'existing-project',
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  const runtime = await startServer({ cwd: join(cwdRoot, 'openspec') });

  try {
    const projects = await apiJson(runtime.baseUrl, '/api/projects');
    assert.equal(projects.response.status, 200);
    assert.equal(projects.body.projects.length, 1);
    assert.equal(projects.body.projects[0].id, 'existing-project');
    assert.equal(projects.body.projects[0].path, existingRoot);
    assert.equal(projects.body.activeProjectId, 'existing-project');

    const project = await apiJson(runtime.baseUrl, '/api/project');
    assert.equal(project.response.status, 200);
    assert.equal(project.body.project.name, 'Existing Project');

    const registry = await readRegistry(configHome);
    assert.equal(registry.projects.length, 1);
    assert.equal(registry.projects[0]?.id, 'existing-project');
    assert.equal(registry.projects[0]?.path, existingRoot);
    assert.equal(registry.activeProjectId, 'existing-project');
  } finally {
    await runtime.close();
  }
});

test('startup with registered projects but no active default still suppresses cwd bootstrap', async () => {
  const configHome = await createTempDir('openspec-webui-server-config-');
  process.env.XDG_CONFIG_HOME = configHome;
  const existingRoot = await createProjectFixture('existing-project');
  const cwdRoot = await createProjectFixture('cwd-project');

  await mkdir(join(configHome, 'openspec-webui'), { recursive: true });
  await writeFile(
    join(configHome, 'openspec-webui', 'projects.json'),
    JSON.stringify(
      {
        version: 1,
        projects: [
          {
            id: 'existing-project',
            path: existingRoot,
            label: 'Existing Project',
            addedAt: 1,
            lastOpenedAt: 1,
          },
        ],
        activeProjectId: null,
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  const runtime = await startServer({ cwd: join(cwdRoot, 'openspec') });

  try {
    const projects = await apiJson(runtime.baseUrl, '/api/projects');
    assert.equal(projects.response.status, 200);
    assert.equal(projects.body.projects.length, 1);
    assert.equal(projects.body.projects[0].id, 'existing-project');
    assert.equal(projects.body.projects[0].path, existingRoot);
    assert.equal(projects.body.activeProjectId, null);

    const registry = await readRegistry(configHome);
    assert.equal(registry.projects.length, 1);
    assert.equal(registry.projects[0]?.id, 'existing-project');
    assert.equal(registry.projects[0]?.path, existingRoot);
    assert.equal(registry.activeProjectId, null);
  } finally {
    await runtime.close();
  }
});

test('startup from a non-project cwd succeeds without auto-adding a project or bootstrap warnings', async () => {
  const configHome = await createTempDir('openspec-webui-server-config-');
  const nonProjectRoot = await createTempDir('openspec-webui-non-project-cwd-');
  process.env.XDG_CONFIG_HOME = configHome;
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map((arg) => String(arg)).join(' '));
  };

  let runtime: Awaited<ReturnType<typeof startServer>> | null = null;

  try {
    runtime = await startServer({ cwd: nonProjectRoot });

    const projects = await apiJson(runtime.baseUrl, '/api/projects');
    assert.equal(projects.response.status, 200);
    assert.deepEqual(projects.body.projects, []);
    assert.equal(projects.body.activeProjectId, null);

    const project = await apiJson(runtime.baseUrl, '/api/project');
    assert.equal(project.response.status, 503);
    assert.equal(project.body.code, 'NO_ACTIVE_PROJECT');

    const registry = await readRegistry(configHome);
    assert.deepEqual(registry.projects, []);
    assert.equal(registry.activeProjectId, null);

    assert.deepEqual(
      warnings.filter((warning) => warning.includes('Failed to bootstrap startup project')),
      []
    );
  } finally {
    console.warn = originalWarn;
    await runtime?.close();
  }
});

test('version status endpoint returns current, latest, and registered project guidance data', async () => {
  const configHome = await createTempDir('openspec-webui-server-config-');
  process.env.XDG_CONFIG_HOME = configHome;
  const projectRoot = await createProjectFixture('alpha-project');
  await installFakeOpenSpecCommand({
    readyProjectRoots: new Set([projectRoot]),
    version: '1.3.1',
  });

  const versionSnapshotService = createVersionSnapshotService({
    autoStart: false,
    deps: {
      getWebUiCurrentVersion: () => '0.1.0',
      fetchLatestPackageVersion: async (packageName: string) => packageName === 'openspec-webui' ? '0.2.0' : '1.4.0',
      readOpenSpecVersion: async () => '1.3.1',
      now: () => new Date('2026-04-29T00:00:00.000Z'),
    },
  });
  await versionSnapshotService.refresh();

  const runtime = await startServer({ versionSnapshotService });

  try {
    await apiJson(runtime.baseUrl, '/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: projectRoot }),
    });

    const result = await apiJson(runtime.baseUrl, '/api/version-status');
    assert.equal(result.response.status, 200);
    assert.equal(typeof result.body.checkedAt, 'string');
    assert.equal(result.body.loading, false);
    assert.equal(result.body.tools.webui.currentVersion, '0.1.0');
    assert.equal(result.body.tools.webui.latestVersion, '0.2.0');
    assert.equal(result.body.tools.openspec.currentVersion, '1.3.1');
    assert.equal(result.body.tools.openspec.latestVersion, '1.4.0');
  } finally {
    await runtime.close();
  }
});

test('server reports a helpful error when the port is already in use', async () => {
  const configHome = await createTempDir('openspec-webui-server-config-');
  const nonProjectRoot = await createTempDir('openspec-webui-port-check-cwd-');
  process.env.XDG_CONFIG_HOME = configHome;
  process.chdir(nonProjectRoot);

  const blocker = createTcpServer();
  await new Promise<void>((resolve, reject) => {
    blocker.once('error', reject);
    blocker.listen(0, '127.0.0.1', () => {
      blocker.off('error', reject);
      resolve();
    });
  });

  const address = blocker.address();
  assert.ok(address && typeof address !== 'string');

  try {
    await assert.rejects(
      () => createServer({ port: address.port, host: '127.0.0.1' }),
      new RegExp(`Port ${address.port} is already in use`)
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      blocker.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});

test('activation rollback on parse failure keeps the previous active project context when the target session is not loaded', async () => {
  const configHome = await createTempDir('openspec-webui-server-config-');
  process.env.XDG_CONFIG_HOME = configHome;
  const alphaRoot = await createProjectFixture('healthy-project');
  const brokenRoot = await createBrokenProjectFixture('broken-project');
  const nonProjectRoot = await createTempDir('openspec-webui-activation-cwd-');

  await mkdir(join(configHome, 'openspec-webui'), { recursive: true });
  await writeFile(
    join(configHome, 'openspec-webui', 'projects.json'),
    JSON.stringify(
      {
        version: 1,
        projects: [
          {
            id: 'healthy-project-id',
            path: alphaRoot,
            label: 'Healthy Project',
            addedAt: 1,
            lastOpenedAt: 2,
          },
          {
            id: 'broken-project-id',
            path: brokenRoot,
            label: 'Broken Project',
            addedAt: 3,
            lastOpenedAt: 4,
          },
        ],
        activeProjectId: 'healthy-project-id',
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  const runtime = await startServer({ cwd: nonProjectRoot });

  try {
    let result = await apiJson(runtime.baseUrl, `/api/projects/${encodeURIComponent('broken-project-id')}/activate`, {
      method: 'POST',
    });
    assert.equal(result.response.status, 500);
    assert.equal(result.body.code, 'ACTIVATION_FAILED');

    result = await apiJson(runtime.baseUrl, '/api/project');
    assert.equal(result.response.status, 200);
    assert.equal(result.body.project.name, 'Healthy Project');

    const projects = await apiJson(runtime.baseUrl, '/api/projects');
    assert.equal(projects.response.status, 200);
    assert.equal(projects.body.projects.length, 2);
    assert.equal(projects.body.activeProjectId, 'healthy-project-id');
  } finally {
    await runtime.close();
  }
});

test('activation succeeds when config.yaml is malformed but the viewer can expose degraded project data', async () => {
  const configHome = await createTempDir('openspec-webui-server-config-');
  process.env.XDG_CONFIG_HOME = configHome;
  const alphaRoot = await createProjectFixture('healthy-project');
  const invalidRoot = await createProjectFixture('invalid-project');
  const nonProjectRoot = await createTempDir('openspec-webui-invalid-activation-cwd-');

  await writeFile(
    join(invalidRoot, 'openspec', 'config.yaml'),
    'schema: default-workflow\ncontext: "Broken "quote" content"\n',
    'utf8'
  );

  await mkdir(join(configHome, 'openspec-webui'), { recursive: true });
  await writeFile(
    join(configHome, 'openspec-webui', 'projects.json'),
    JSON.stringify(
      {
        version: 1,
        projects: [
          {
            id: 'healthy-project-id',
            path: alphaRoot,
            label: 'Healthy Project',
            addedAt: 1,
            lastOpenedAt: 2,
          },
          {
            id: 'invalid-project-id',
            path: invalidRoot,
            label: 'Invalid Project',
            addedAt: 3,
            lastOpenedAt: 4,
          },
        ],
        activeProjectId: 'healthy-project-id',
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  const runtime = await startServer({ cwd: nonProjectRoot });

  try {
    let result = await apiJson(runtime.baseUrl, `/api/projects/${encodeURIComponent('invalid-project-id')}/activate`, {
      method: 'POST',
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.activeProjectId, 'invalid-project-id');

    result = await apiJson(runtime.baseUrl, '/api/project');
    assert.equal(result.response.status, 200);
    assert.equal(result.body.project.name, 'Invalid Project');
    assert.equal(result.body.project.planningContext.status, 'invalid');
    assert.match(result.body.project.planningContext.parseErrors[0], /Unexpected scalar/);
  } finally {
    await runtime.close();
  }
});

test('project-scoped websocket refresh only reaches clients bound to the changed project', async () => {
  const configHome = await createTempDir('openspec-webui-server-config-');
  process.env.XDG_CONFIG_HOME = configHome;
  const alphaRoot = await createProjectFixture('alpha-project');
  const betaRoot = await createProjectFixture('beta-project');

  const runtime = await startServer();

  try {
    let result = await apiJson(runtime.baseUrl, '/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: alphaRoot }),
    });
    assert.equal(result.response.status, 201);
    const alphaId = result.body.project.id as string;

    result = await apiJson(runtime.baseUrl, '/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: betaRoot }),
    });
    assert.equal(result.response.status, 201);
    const betaId = result.body.project.id as string;

    const alphaClient = await openWsClient(runtime.baseUrl);
    const betaClient = await openWsClient(runtime.baseUrl);

    try {
      assert.deepEqual(await alphaClient.recorder.nextMessage(), {
        type: 'connection:init',
        activeProjectId: betaId,
      });
      assert.deepEqual(await betaClient.recorder.nextMessage(), {
        type: 'connection:init',
        activeProjectId: betaId,
      });

      sendWsJson(alphaClient.ws, { type: 'project:bind', projectId: alphaId });
      assertProjectBoundMessage(
        await alphaClient.recorder.nextMessage(),
        alphaId,
        'Alpha Project'
      );

      await writeFile(
        join(alphaRoot, 'openspec', 'config.yaml'),
        createProjectConfigYaml('alpha-project', {
          context: 'Updated description for alpha-project.\nSupports refreshed planning context.',
          schema: 'refined-workflow',
        }),
        'utf8'
      );

      const message = await alphaClient.recorder.nextMessage(3_000);
      const refresh = message as {
        type: string;
        entity: string;
        data?: {
          project?: {
            name?: string;
            description?: string;
            path?: string;
            planningContext?: {
              source?: { path?: string; type?: string };
              status?: string;
              aiContext?: string;
              workflowSchema?: string;
            };
            legacyProjectDoc?: unknown;
            migrationState?: string;
            content?: string;
          };
        };
      };
      assert.equal(refresh.type, 'data:refresh');
      assert.equal(refresh.entity, 'project');
      assert.equal(refresh.data?.project?.name, 'Alpha Project');
      assert.equal(refresh.data?.project?.description, 'Updated description for alpha-project.');
      assert.equal(refresh.data?.project?.path, join(alphaRoot, 'openspec', 'config.yaml'));
      assert.equal(
        refresh.data?.project?.planningContext?.source?.path,
        join(alphaRoot, 'openspec', 'config.yaml')
      );
      assert.equal(refresh.data?.project?.planningContext?.source?.type, 'config');
      assert.equal(refresh.data?.project?.planningContext?.status, 'parsed');
      assert.equal(
        refresh.data?.project?.planningContext?.aiContext,
        'Updated description for alpha-project.\nSupports refreshed planning context.'
      );
      assert.equal(refresh.data?.project?.planningContext?.workflowSchema, 'refined-workflow');
      assert.equal(refresh.data?.project?.legacyProjectDoc ?? null, null);
      assert.equal(refresh.data?.project?.migrationState, 'config-only');
      assert.match(refresh.data?.project?.content ?? '', /Updated description for alpha-project\./);
      await betaClient.recorder.expectNoMessage(500);
    } finally {
      alphaClient.ws.close();
      betaClient.ws.close();
    }
  } finally {
    await runtime.close();
  }
});

test('project-scoped websocket refresh publishes degraded invalid planning context after malformed config change', async () => {
  const configHome = await createTempDir('openspec-webui-server-config-');
  process.env.XDG_CONFIG_HOME = configHome;
  const alphaRoot = await createProjectFixture('alpha-project');

  const runtime = await startServer();

  try {
    const result = await apiJson(runtime.baseUrl, '/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: alphaRoot }),
    });
    assert.equal(result.response.status, 201);
    const alphaId = result.body.project.id as string;

    const alphaClient = await openWsClient(runtime.baseUrl);

    try {
      assert.deepEqual(await alphaClient.recorder.nextMessage(), {
        type: 'connection:init',
        activeProjectId: alphaId,
      });

      sendWsJson(alphaClient.ws, { type: 'project:bind', projectId: alphaId });
      assertProjectBoundMessage(await alphaClient.recorder.nextMessage(), alphaId, 'Alpha Project');

      await writeFile(
        join(alphaRoot, 'openspec', 'config.yaml'),
        'schema: default-workflow\ncontext: "Broken "quote" content"\n',
        'utf8'
      );

      const refresh = (await alphaClient.recorder.nextMessage(3_000)) as {
        type: string;
        entity: string;
        data?: {
          project?: {
            planningContext?: {
              status?: string;
              parseErrors?: string[];
              rawConfig?: string;
            };
            description?: string;
          };
        };
      };

      assert.equal(refresh.type, 'data:refresh');
      assert.equal(refresh.entity, 'project');
      assert.equal(refresh.data?.project?.description, '');
      assert.equal(refresh.data?.project?.planningContext?.status, 'invalid');
      assert.match(refresh.data?.project?.planningContext?.parseErrors?.[0] ?? '', /Unexpected scalar/);
      assert.equal(
        refresh.data?.project?.planningContext?.rawConfig,
        'schema: default-workflow\ncontext: "Broken "quote" content"\n'
      );
    } finally {
      alphaClient.ws.close();
    }
  } finally {
    await runtime.close();
  }
});

test('filesystem browse endpoint returns default listings and expected error payloads', async () => {
  const runtime = await startServer();

  try {
    const result = await apiJson(runtime.baseUrl, '/api/fs/browse');
    assert.equal(result.response.status, 200);
    assert.equal(result.body.path, resolve(homedir()));
    assert.ok(Array.isArray(result.body.dirs));
    assert.equal(result.body.error, undefined);
  } finally {
    await runtime.close();
  }

  const missingPath = join(await createTempDir('openspec-webui-browse-missing-parent-'), 'missing');
  const fileRoot = await createTempDir('openspec-webui-browse-file-');
  const filePath = join(fileRoot, 'plain-file.txt');
  await writeFile(filePath, 'not a directory', 'utf8');

  const secondRuntime = await startServer();

  try {
    let result = await apiJson(secondRuntime.baseUrl, `/api/fs/browse?path=${encodeURIComponent(missingPath)}`);
    assert.equal(result.response.status, 200);
    assert.deepEqual(result.body, {
      path: missingPath,
      parent: null,
      dirs: [],
      error: 'Directory not found',
    });

    result = await apiJson(secondRuntime.baseUrl, `/api/fs/browse?path=${encodeURIComponent(filePath)}`);
    assert.equal(result.response.status, 200);
    assert.deepEqual(result.body, {
      path: filePath,
      parent: null,
      dirs: [],
      error: 'Not a directory',
    });
  } finally {
    await secondRuntime.close();
  }
});

test('filesystem browse endpoint excludes hidden directories and reports hasOpenSpec', async () => {
  const browseRoot = await createTempDir('openspec-webui-browse-root-');
  const alphaDir = join(browseRoot, 'alpha');
  const betaDir = join(browseRoot, 'beta');
  const hiddenDir = join(browseRoot, '.hidden');

  await mkdir(join(alphaDir, 'openspec'), { recursive: true });
  await mkdir(betaDir, { recursive: true });
  await mkdir(hiddenDir, { recursive: true });
  await writeFile(join(browseRoot, 'notes.txt'), 'ignore me', 'utf8');

  const runtime = await startServer();

  try {
    const result = await apiJson(runtime.baseUrl, `/api/fs/browse?path=${encodeURIComponent(browseRoot)}`);
    assert.equal(result.response.status, 200);
    assert.deepEqual(result.body, {
      path: browseRoot,
      parent: resolve(browseRoot, '..'),
      dirs: [
        {
          name: 'alpha',
          path: alphaDir,
          hasOpenSpec: true,
        },
        {
          name: 'beta',
          path: betaDir,
          hasOpenSpec: false,
        },
      ],
    });
  } finally {
    await runtime.close();
  }
});
