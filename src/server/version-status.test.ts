import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createVersionSnapshotService } from './version-status.js';

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

  assert.equal(fetchCalls, 2);
  assert.equal(readCalls, 1);

  const releaseWebUiLatest: (value: string) => void = resolveWebUiLatest ?? (() => {
    throw new Error('webui latest-version resolver should be captured');
  });
  releaseWebUiLatest('0.2.0');

  const [firstSnapshot, secondSnapshot] = await Promise.all([firstRefresh, secondRefresh]);

  assert.deepEqual(firstSnapshot, secondSnapshot);
  assert.equal(firstSnapshot.tools.webui.latestVersion, '0.2.0');
  assert.equal(firstSnapshot.tools.openspec.latestVersion, '1.4.0');
});
