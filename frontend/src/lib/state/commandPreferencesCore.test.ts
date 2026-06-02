import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { CORE_COMMANDS } from '../types/commandTypes';
import {
  COMMAND_PREFERENCES_STORAGE_KEY,
  createCommandPreferencesStore,
  createDefaultCommandVisibility,
  getVisibleCommands,
} from './commandPreferencesCore';

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

afterEach(() => {
  delete (globalThis as { localStorage?: Storage }).localStorage;
});

test('loads legacy default format as standard and preserves legacy expanded visibility', () => {
  Object.assign(globalThis, {
    localStorage: new MockStorage({
      [COMMAND_PREFERENCES_STORAGE_KEY]: JSON.stringify({
        aiTool: 'default',
        expandedVisibility: {
          continue: false,
          verify: false,
          sync: false,
        },
      }),
    }),
  });

  const store = createCommandPreferencesStore();
  store.initialize();

  assert.equal(store.format, 'standard');
  assert.equal(store.commandVisibility.continue, false);
  assert.equal(store.commandVisibility.verify, false);
  assert.equal(store.commandVisibility.sync, false);

  for (const command of CORE_COMMANDS.filter((command) => command !== 'sync')) {
    assert.equal(store.commandVisibility[command], true);
  }
});

test('persists format and unified commandVisibility state', () => {
  const localStorage = new MockStorage();
  Object.assign(globalThis, { localStorage });

  const store = createCommandPreferencesStore();
  store.initialize();
  store.setFormat('skill');
  store.setCommandVisibility('continue', false);
  store.setCommandVisibility('archive', false);
  store.setCommandVisibility('sync', false);

  const expectedVisibility = createDefaultCommandVisibility();
  expectedVisibility.continue = false;
  expectedVisibility.archive = false;
  expectedVisibility.sync = false;

  assert.equal(
    localStorage.getItem(COMMAND_PREFERENCES_STORAGE_KEY),
    JSON.stringify({
      format: 'skill',
      commandVisibility: expectedVisibility,
    }),
  );

  const reloadedStore = createCommandPreferencesStore();
  reloadedStore.initialize();

  assert.equal(reloadedStore.format, 'skill');
  assert.equal(reloadedStore.commandVisibility.continue, false);
  assert.equal(reloadedStore.commandVisibility.archive, false);
  assert.equal(reloadedStore.commandVisibility.sync, false);
});

test('skill format persists format and unified visibility without storing derived command text', () => {
  const localStorage = new MockStorage();
  Object.assign(globalThis, { localStorage });

  const store = createCommandPreferencesStore();
  store.initialize();
  store.setFormat('skill');

  const stored = JSON.parse(localStorage.getItem(COMMAND_PREFERENCES_STORAGE_KEY) ?? '{}') as Record<string, unknown>;

  assert.deepEqual(stored, {
    format: 'skill',
    commandVisibility: createDefaultCommandVisibility(),
  });
});

test('defaults all core commands to visible when storage is empty', () => {
  Object.assign(globalThis, {
    localStorage: new MockStorage(),
  });

  const store = createCommandPreferencesStore();
  store.initialize();

  for (const command of CORE_COMMANDS) {
    assert.equal(store.commandVisibility[command], true);
  }
});

test('getVisibleCommands applies unified visibility to core and expanded commands', () => {
  const commandVisibility = createDefaultCommandVisibility();
  commandVisibility.propose = false;
  commandVisibility.continue = false;

  assert.deepEqual(
    getVisibleCommands(['propose', 'explore', 'continue', 'verify'], commandVisibility),
    ['explore', 'verify'],
  );
});
