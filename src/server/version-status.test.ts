import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createVersionSnapshotService, parseOpenSpecVersionCheckOutput } from './version-status.js';

test('version snapshot marks tools as update-available when newer versions exist', async () => {
  const service = createVersionSnapshotService({
    autoStart: false,
    deps: {
      getWebUiCurrentVersion: () => '0.1.0',
      fetchLatestPackageVersion: async (packageName: string) => packageName === 'openspec-webui' ? '0.2.0' : '1.4.0',
      readOpenSpecVersion: async () => '1.3.1',
      now: () => new Date('2026-04-29T00:00:00.000Z'),
    },
  });

  const snapshot = await service.refresh();

  assert.equal(snapshot.loading, false);
  assert.equal(snapshot.checkedAt, '2026-04-29T00:00:00.000Z');
  assert.equal(snapshot.tools.webui.currentVersion, '0.1.0');
  assert.equal(snapshot.tools.webui.latestVersion, '0.2.0');
  assert.equal(snapshot.tools.webui.updateAvailable, true);
  assert.equal(snapshot.tools.webui.status, 'update-available');
  assert.equal(snapshot.tools.openspec.currentVersion, '1.3.1');
  assert.equal(snapshot.tools.openspec.latestVersion, '1.4.0');
  assert.equal(snapshot.tools.openspec.updateAvailable, true);
  assert.equal(snapshot.tools.openspec.status, 'update-available');
});

test('version snapshot tolerates unavailable npm and OpenSpec CLI lookups', async () => {
  const service = createVersionSnapshotService({
    autoStart: false,
    deps: {
      getWebUiCurrentVersion: () => '0.1.0',
      fetchLatestPackageVersion: async () => {
        throw new Error('registry unavailable');
      },
      readOpenSpecVersion: async () => {
        const error = new Error('spawn openspec ENOENT') as Error & { code?: string };
        error.code = 'ENOENT';
        throw error;
      },
      now: () => new Date('2026-04-29T00:00:00.000Z'),
    },
  });

  const snapshot = await service.refresh();

  assert.equal(snapshot.tools.webui.currentVersion, '0.1.0');
  assert.equal(snapshot.tools.webui.latestVersion, null);
  assert.equal(snapshot.tools.webui.status, 'unknown');
  assert.match(snapshot.tools.webui.error ?? '', /registry unavailable/);
  assert.equal(snapshot.tools.openspec.currentVersion, null);
  assert.equal(snapshot.tools.openspec.latestVersion, null);
  assert.equal(snapshot.tools.openspec.status, 'unavailable');
  assert.equal(snapshot.tools.openspec.notInstalled, true);
  assert.match(snapshot.tools.openspec.error ?? '', /not installed/i);
});

test('version snapshot deduplicates concurrent refresh requests', async () => {
  let fetchCalls = 0;
  let readCalls = 0;
  let resolveWebUiLatest: ((value: string) => void) | null = null;

  const pendingWebUiLatest = new Promise<string>((resolve) => {
    resolveWebUiLatest = resolve;
  });

  const service = createVersionSnapshotService({
    autoStart: false,
    deps: {
      getWebUiCurrentVersion: () => '0.1.0',
      fetchLatestPackageVersion: async (packageName: string) => {
        fetchCalls += 1;
        if (packageName === 'openspec-webui') {
          return pendingWebUiLatest;
        }

        return '1.4.0';
      },
      readOpenSpecVersion: async () => {
        readCalls += 1;
        return '1.3.1';
      },
      now: () => new Date('2026-04-29T00:00:00.000Z'),
    },
  });

  const firstRefresh = service.refresh();
  const secondRefresh = service.refresh();

  const releaseWebUiLatest: (value: string) => void = resolveWebUiLatest ?? (() => {
    throw new Error('webui latest-version resolver should be captured');
  });
  releaseWebUiLatest('0.2.0');

  const [firstSnapshot, secondSnapshot] = await Promise.all([firstRefresh, secondRefresh]);

  assert.equal(fetchCalls, 2);
  assert.equal(readCalls, 1);
  assert.deepEqual(firstSnapshot, secondSnapshot);
  assert.equal(firstSnapshot.tools.webui.latestVersion, '0.2.0');
  assert.equal(firstSnapshot.tools.openspec.latestVersion, '1.4.0');
});

// Captured from OpenSpec 2.1.1 on a Linux npm-global install.
const NPM_VERSION_CHECK_JSON = '{"schemaVersion":1,"version":"2.1.1","install":{"location":"/home/user/.npm-global/lib/node_modules/@fission-ai/openspec","packageManager":"npm","scope":"global"},"update":{"status":"current","latest":"2.1.1","command":null,"canSelfUpgrade":false}}';
const STANDALONE_VERSION_CHECK_JSON = '{"schemaVersion":1,"version":"2.0.0","install":{"location":"C:\\\\Users\\\\user\\\\AppData\\\\Local\\\\OpenSpec\\\\openspec.exe","packageManager":"standalone","scope":"user"},"update":{"status":"available","latest":"2.1.1","command":"openspec install","canSelfUpgrade":true}}';
const HOMEBREW_VERSION_CHECK_JSON = '{"schemaVersion":1,"version":"2.0.0","install":{"location":"/opt/homebrew/bin/openspec","packageManager":"homebrew","scope":"global"},"update":{"status":"available","latest":"2.1.1","command":null,"canSelfUpgrade":false}}';

test('parseOpenSpecVersionCheckOutput reads npm, standalone, and homebrew output', () => {
  assert.deepEqual(parseOpenSpecVersionCheckOutput(NPM_VERSION_CHECK_JSON), {
    version: '2.1.1',
    installManager: 'npm',
    installScope: 'global',
    latestVersion: '2.1.1',
    updateCommand: null,
  });
  assert.deepEqual(parseOpenSpecVersionCheckOutput(STANDALONE_VERSION_CHECK_JSON), {
    version: '2.0.0',
    installManager: 'standalone',
    installScope: 'user',
    latestVersion: '2.1.1',
    updateCommand: 'openspec install',
  });
  assert.equal(parseOpenSpecVersionCheckOutput(HOMEBREW_VERSION_CHECK_JSON)?.installManager, 'homebrew');
});

test('parseOpenSpecVersionCheckOutput skips leading noise and rejects malformed output', () => {
  assert.equal(
    parseOpenSpecVersionCheckOutput(`warning: something\n${NPM_VERSION_CHECK_JSON}\n`)?.version,
    '2.1.1',
  );
  assert.equal(parseOpenSpecVersionCheckOutput(''), null);
  assert.equal(parseOpenSpecVersionCheckOutput('1.3.1\n'), null);
  assert.equal(parseOpenSpecVersionCheckOutput('{"version":'), null);
  assert.equal(parseOpenSpecVersionCheckOutput('{"version":"2.1.1"}'), null);
  assert.equal(parseOpenSpecVersionCheckOutput('{"install":{"packageManager":"npm"}}'), null);
  assert.equal(parseOpenSpecVersionCheckOutput('[1,2]'), null);
});

test('version snapshot uses the CLI install check without querying the OpenSpec registry', async () => {
  const fetched: string[] = [];
  let versionReads = 0;
  const service = createVersionSnapshotService({
    autoStart: false,
    deps: {
      getWebUiCurrentVersion: () => '0.1.0',
      fetchLatestPackageVersion: async (packageName: string) => {
        fetched.push(packageName);
        return '0.1.0';
      },
      readOpenSpecVersion: async () => {
        versionReads += 1;
        return '1.0.0';
      },
      readOpenSpecInstallInfo: async () => parseOpenSpecVersionCheckOutput(STANDALONE_VERSION_CHECK_JSON),
      now: () => new Date('2026-04-29T00:00:00.000Z'),
    },
  });

  const snapshot = await service.refresh();

  assert.deepEqual(fetched, ['openspec-webui']);
  assert.equal(versionReads, 0);
  assert.equal(snapshot.tools.openspec.currentVersion, '2.0.0');
  assert.equal(snapshot.tools.openspec.latestVersion, '2.1.1');
  assert.equal(snapshot.tools.openspec.status, 'update-available');
  assert.equal(snapshot.tools.openspec.installManager, 'standalone');
  assert.equal(snapshot.tools.openspec.installScope, 'user');
  assert.equal(snapshot.tools.openspec.updateCommand, 'openspec install');
  assert.equal(snapshot.tools.webui.installManager, null);
});

test('version snapshot falls back to --version and the registry for older CLIs', async () => {
  const fetched: string[] = [];
  const service = createVersionSnapshotService({
    autoStart: false,
    deps: {
      getWebUiCurrentVersion: () => '0.1.0',
      fetchLatestPackageVersion: async (packageName: string) => {
        fetched.push(packageName);
        return packageName === 'openspec-webui' ? '0.1.0' : '1.4.0';
      },
      readOpenSpecVersion: async () => '1.3.1',
      readOpenSpecInstallInfo: async () => parseOpenSpecVersionCheckOutput('error: unknown command version'),
      now: () => new Date('2026-04-29T00:00:00.000Z'),
    },
  });

  const snapshot = await service.refresh();

  assert.deepEqual([...fetched].sort(), ['@fission-ai/openspec', 'openspec-webui']);
  assert.equal(snapshot.tools.openspec.currentVersion, '1.3.1');
  assert.equal(snapshot.tools.openspec.latestVersion, '1.4.0');
  assert.equal(snapshot.tools.openspec.installManager, null);
  assert.equal(snapshot.tools.openspec.updateCommand, null);
});
