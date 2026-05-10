import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { createUiPreferencesStore } from './uiPreferencesCore';

const STORAGE_KEY = 'openspec-ui-preferences';

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

test('preview tabs are enabled by default when storage is empty', () => {
  Object.assign(globalThis, {
    localStorage: new MockStorage(),
  });

  const store = createUiPreferencesStore();
  store.initialize();

  assert.equal(store.previewTabsEnabled, true);
  assert.equal(store.searchHighlightsEnabled, true);
});

test('preview tab preference persists when toggled off', () => {
  const localStorage = new MockStorage();
  Object.assign(globalThis, { localStorage });

  const store = createUiPreferencesStore();
  store.initialize();
  store.setPreviewTabsEnabled(false);

  assert.equal(store.previewTabsEnabled, false);
  assert.equal(store.searchHighlightsEnabled, true);
  assert.equal(localStorage.getItem(STORAGE_KEY), JSON.stringify({ previewTabsEnabled: false, searchHighlightsEnabled: true }));

  const reloadedStore = createUiPreferencesStore();
  reloadedStore.initialize();
  assert.equal(reloadedStore.previewTabsEnabled, false);
  assert.equal(reloadedStore.searchHighlightsEnabled, true);
});

test('search highlight preference persists when toggled off', () => {
  const localStorage = new MockStorage();
  Object.assign(globalThis, { localStorage });

  const store = createUiPreferencesStore();
  store.initialize();
  store.setSearchHighlightsEnabled(false);

  assert.equal(store.previewTabsEnabled, true);
  assert.equal(store.searchHighlightsEnabled, false);
  assert.equal(localStorage.getItem(STORAGE_KEY), JSON.stringify({ previewTabsEnabled: true, searchHighlightsEnabled: false }));

  const reloadedStore = createUiPreferencesStore();
  reloadedStore.initialize();
  assert.equal(reloadedStore.searchHighlightsEnabled, false);
});

test('invalid stored values fall back to preview tabs enabled', () => {
  Object.assign(globalThis, {
    localStorage: new MockStorage({
      [STORAGE_KEY]: JSON.stringify({ previewTabsEnabled: 'nope', searchHighlightsEnabled: 'nope' }),
    }),
  });

  const store = createUiPreferencesStore();
  store.initialize();

  assert.equal(store.previewTabsEnabled, true);
  assert.equal(store.searchHighlightsEnabled, true);
});
