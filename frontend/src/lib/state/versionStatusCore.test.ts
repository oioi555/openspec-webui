import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import {
  UPDATE_COMMANDS,
  buildLatestVersionSnapshotId,
  createVersionNotificationStoreWithAdapter,
  getToolsWithAvailableUpdates,
  RELEASE_PAGE_URLS,
} from './versionStatusCore';
import type { VersionStatusResponse } from '$lib/types/api';

class MockStorage {
  #values = new Map<string, string>();

  getItem(key: string) {
    return this.#values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.#values.set(key, String(value));
  }

  removeItem(key: string) {
    this.#values.delete(key);
  }
}

afterEach(() => {
  delete (globalThis as { localStorage?: Storage }).localStorage;
});

function createSnapshot(overrides: Partial<VersionStatusResponse['tools']> = {}): VersionStatusResponse {
  return {
    loading: false,
    checkedAt: '2026-04-29T00:00:00.000Z',
    tools: {
      webui: {
        currentVersion: '0.1.0',
        latestVersion: '0.2.0',
        updateAvailable: true,
        status: 'update-available',
        error: null,
        notInstalled: false,
      },
      openspec: {
        currentVersion: '1.3.1',
        latestVersion: '1.3.1',
        updateAvailable: false,
        status: 'up-to-date',
        error: null,
        notInstalled: false,
      },
      ...overrides,
    },
  };
}

test('buildLatestVersionSnapshotId uses latest version values only', () => {
  assert.equal(
    buildLatestVersionSnapshotId(createSnapshot()),
    JSON.stringify({ webui: '0.2.0', openspec: '1.3.1' }),
  );
});

test('getToolsWithAvailableUpdates returns only outdated tools', () => {
  assert.deepEqual(getToolsWithAvailableUpdates(createSnapshot()), ['webui']);
});

test('version notification store dedupes by latest-version snapshot', () => {
  const localStorage = new MockStorage();
  Object.assign(globalThis, { localStorage });

  let state = { lastNotifiedSnapshotId: null as string | null };
  const store = createVersionNotificationStoreWithAdapter({
    get: () => state,
    set: (nextState) => {
      state = nextState;
    },
  });

  store.initialize();

  const firstSnapshot = createSnapshot();
  assert.equal(store.shouldNotify(firstSnapshot), true);
  store.markNotified(firstSnapshot);
  assert.equal(store.shouldNotify(firstSnapshot), false);

  const nextSnapshot = createSnapshot({
    webui: {
      currentVersion: '0.1.0',
      latestVersion: '0.3.0',
      updateAvailable: true,
      status: 'update-available',
      error: null,
      notInstalled: false,
    },
  });
  assert.equal(store.shouldNotify(nextSnapshot), true);
});

test('release page urls and update commands expose representative constants', () => {
  assert.equal(RELEASE_PAGE_URLS.webui, 'https://github.com/oioi555/openspec-webui/releases');
  assert.equal(RELEASE_PAGE_URLS.openspec, 'https://github.com/Fission-AI/OpenSpec/releases');
  assert.equal(UPDATE_COMMANDS.webui, 'npm install -g openspec-webui@latest');
  assert.equal(UPDATE_COMMANDS.openspec, 'npm install -g @fission-ai/openspec@latest');
  assert.equal(UPDATE_COMMANDS.project, 'openspec update');
});
