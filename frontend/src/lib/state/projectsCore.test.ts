import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ACTIVE_PROJECT_SESSION_STORAGE_KEY,
  loadPreferredProjectId,
  persistPreferredProjectId,
  resolveProjectSelection,
  shouldSkipProjectBind,
  shouldRestoreProjectBinding,
} from './projectsCore';

class MockStorage {
  #values = new Map<string, string>();

  constructor(initialValues: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(initialValues)) {
      this.#values.set(key, value);
    }
  }

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

test('loadPreferredProjectId reads the tab-local project override from session storage', () => {
  const storage = new MockStorage({
    [ACTIVE_PROJECT_SESSION_STORAGE_KEY]: 'project-b',
  });

  assert.equal(loadPreferredProjectId(storage), 'project-b');
});

test('persistPreferredProjectId clears the stored override when no tab-local project remains', () => {
  const storage = new MockStorage({
    [ACTIVE_PROJECT_SESSION_STORAGE_KEY]: 'project-b',
  });

  persistPreferredProjectId(null, storage);

  assert.equal(storage.getItem(ACTIVE_PROJECT_SESSION_STORAGE_KEY), null);
});

test('resolveProjectSelection prefers the stored tab-local project when it still exists', () => {
  assert.deepEqual(
    resolveProjectSelection(
      {
        projects: [
          { id: 'project-a', path: '/tmp/a', label: 'A', addedAt: 1, lastOpenedAt: 1 },
          { id: 'project-b', path: '/tmp/b', label: 'B', addedAt: 2, lastOpenedAt: 2 },
        ],
        activeProjectId: 'project-a',
      },
      'project-b'
    ),
    {
      activeProjectId: 'project-b',
      preferredProjectId: 'project-b',
    }
  );
});

test('resolveProjectSelection falls back to the server default and clears the stored override when missing', () => {
  assert.deepEqual(
    resolveProjectSelection(
      {
        projects: [{ id: 'project-a', path: '/tmp/a', label: 'A', addedAt: 1, lastOpenedAt: 1 }],
        activeProjectId: 'project-a',
      },
      'project-b'
    ),
    {
      activeProjectId: 'project-a',
      preferredProjectId: null,
    }
  );
});

test('shouldRestoreProjectBinding only rebinds websocket context for a stored tab-local override', () => {
  assert.equal(shouldRestoreProjectBinding('project-b', 'project-a'), true);
  assert.equal(shouldRestoreProjectBinding('project-a', 'project-a'), false);
  assert.equal(shouldRestoreProjectBinding(null, 'project-a'), false);
});

test('first add from empty state still binds when local snapshot already points at the new project', () => {
  assert.equal(
    shouldSkipProjectBind({
      targetProjectId: 'project-a',
      authoritativeProjectId: null,
      hasPendingBind: false,
    }),
    false
  );
});

test('reactivating an existing project still binds when websocket state has not confirmed it yet', () => {
  assert.equal(
    shouldSkipProjectBind({
      targetProjectId: 'project-a',
      authoritativeProjectId: 'project-b',
      hasPendingBind: false,
    }),
    false
  );
});

test('shouldSkipProjectBind only skips when the authoritative binding already matches', () => {
  assert.equal(
    shouldSkipProjectBind({
      targetProjectId: 'project-a',
      authoritativeProjectId: 'project-a',
      hasPendingBind: false,
    }),
    true
  );

  assert.equal(
    shouldSkipProjectBind({
      targetProjectId: 'project-a',
      authoritativeProjectId: 'project-a',
      hasPendingBind: true,
    }),
    false
  );

  assert.equal(
    shouldSkipProjectBind({
      targetProjectId: 'project-a',
      authoritativeProjectId: 'project-a',
      hasPendingBind: false,
      force: true,
    }),
    false
  );
});
