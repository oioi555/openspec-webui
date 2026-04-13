import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { chmod, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { createServer } from './index.js';

const tempDirs: string[] = [];
const originalEnv = {
  XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
  OPENSPEC_INITIAL_PROJECT: process.env.OPENSPEC_INITIAL_PROJECT,
  PATH: process.env.PATH,
};

beforeEach(() => {
  delete process.env.XDG_CONFIG_HOME;
  delete process.env.OPENSPEC_INITIAL_PROJECT;
});

afterEach(async () => {
  process.env.XDG_CONFIG_HOME = originalEnv.XDG_CONFIG_HOME;
  process.env.OPENSPEC_INITIAL_PROJECT = originalEnv.OPENSPEC_INITIAL_PROJECT;
  process.env.PATH = originalEnv.PATH;
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function createProjectFixture(name: string): Promise<string> {
  const sandbox = await createTempDir('openspec-webui-server-project-');
  const projectRoot = join(sandbox, name);
  await mkdir(projectRoot, { recursive: true });
  await cp(resolve('test-openspec'), join(projectRoot, 'openspec'), { recursive: true });
  await writeFile(join(projectRoot, 'openspec', 'project.md'), `# ${name}\n\nDescription for ${name}.\n`, 'utf8');
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
}) {
  const binDir = await createTempDir('openspec-webui-fake-bin-');
  const scriptPath = join(binDir, 'openspec');
  const readyRoots = JSON.stringify([...config.readyProjectRoots]);
  const unavailableRoots = JSON.stringify([...(config.unavailableProjectRoots ?? new Set())]);

  await writeFile(
    scriptPath,
    `#!/usr/bin/env node
const readyRoots = new Set(${readyRoots});
const unavailableRoots = new Set(${unavailableRoots});
const cwd = process.cwd();
const key = process.argv[4];

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

async function startServer(options: { initialProjectPath?: string } = {}) {
  const server = await createServer({
    port: 0,
    host: '127.0.0.1',
    ...options,
  });

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
  const waiters: Array<(message: unknown) => void> = [];

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    const waiter = waiters.shift();
    if (waiter) {
      waiter(message);
      return;
    }

    queue.push(message);
  });

  return {
    async nextMessage(): Promise<unknown> {
      if (queue.length > 0) {
        return queue.shift();
      }

      return new Promise((resolve) => {
        waiters.push(resolve);
      });
    },
  };
}

test('server integration covers /api/projects CRUD, duplicate-path 200, active-project routing, websocket events, and stale availability invalidation', async () => {
  const configHome = await createTempDir('openspec-webui-server-config-');
  process.env.XDG_CONFIG_HOME = configHome;
  const alphaRoot = await createProjectFixture('alpha-project');
  const betaRoot = await createProjectFixture('beta-project');
  await installFakeOpenSpecCommand({
    readyProjectRoots: new Set([alphaRoot]),
    unavailableProjectRoots: new Set([betaRoot]),
  });

  const runtime = await startServer();
  const ws = new WebSocket(runtime.baseUrl.replace('http', 'ws') + '/ws');
  const recorder = createWsRecorder(ws);

  try {
    const initMessage = await recorder.nextMessage();
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
    assert.deepEqual(await recorder.nextMessage(), { type: 'project:switched', activeProjectId: alphaId });

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

    result = await apiJson(runtime.baseUrl, '/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: betaRoot }),
    });
    assert.equal(result.response.status, 201);
    const betaId = result.body.project.id as string;
    assert.deepEqual(await recorder.nextMessage(), { type: 'project:switched', activeProjectId: betaId });

    result = await apiJson(runtime.baseUrl, '/api/project');
    assert.equal(result.body.project.name, 'Beta Project');

    result = await apiJson(runtime.baseUrl, '/api/projects');
    assert.equal(result.response.status, 200);
    assert.equal(result.body.projects.length, 2);
    assert.equal(result.body.activeProjectId, betaId);

    result = await apiJson(runtime.baseUrl, `/api/projects/${encodeURIComponent(alphaId)}/activate`, {
      method: 'POST',
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.activeProjectId, alphaId);
    assert.deepEqual(await recorder.nextMessage(), { type: 'project:switched', activeProjectId: alphaId });

    result = await apiJson(runtime.baseUrl, '/api/project');
    assert.equal(result.body.project.name, 'Alpha Project');

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
    assert.deepEqual(await recorder.nextMessage(), { type: 'project:switched', activeProjectId: betaId });

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
    assert.deepEqual(await recorder.nextMessage(), { type: 'project:switched', activeProjectId: null });

    result = await apiJson(runtime.baseUrl, '/api/commands/availability');
    assert.equal(result.response.status, 200);
    assert.equal(result.body.availability.status, 'unavailable');
    assert.equal(result.body.availability.error, 'No active project selected');

    const registry = await readRegistry(configHome);
    assert.deepEqual(registry.projects, []);
    assert.equal(registry.activeProjectId, null);
  } finally {
    ws.close();
    await runtime.close();
  }
});

test('startup bootstraps a valid OPENSPEC_INITIAL_PROJECT and removes stale persisted invalid paths', async () => {
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

  process.env.OPENSPEC_INITIAL_PROJECT = validRoot;
  const runtime = await startServer();

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

test('activation rollback on parse failure keeps the previous active project context', async () => {
  const configHome = await createTempDir('openspec-webui-server-config-');
  process.env.XDG_CONFIG_HOME = configHome;
  const alphaRoot = await createProjectFixture('healthy-project');
  const brokenRoot = await createBrokenProjectFixture('broken-project');

  const runtime = await startServer({ initialProjectPath: alphaRoot });

  try {
    let result = await apiJson(runtime.baseUrl, '/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: brokenRoot }),
    });
    assert.equal(result.response.status, 500);
    assert.equal(result.body.code, 'ACTIVATION_FAILED');

    result = await apiJson(runtime.baseUrl, '/api/project');
    assert.equal(result.response.status, 200);
    assert.equal(result.body.project.name, 'Healthy Project');

    const projects = await apiJson(runtime.baseUrl, '/api/projects');
    assert.equal(projects.response.status, 200);
    assert.equal(projects.body.projects.length, 1);
    assert.equal(projects.body.projects[0].path, alphaRoot);
    assert.equal(projects.body.activeProjectId, projects.body.projects[0].id);
  } finally {
    await runtime.close();
  }
});
