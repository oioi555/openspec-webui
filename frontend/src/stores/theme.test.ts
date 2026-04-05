import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { createThemeStore } from './themeCore';

const STORAGE_KEY = 'openspec-theme';

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

  clear() {
    this.#values.clear();
  }
}

class MockDocumentElement {
  #attributes = new Map<string, string>();

  setAttribute(name: string, value: string) {
    this.#attributes.set(name, value);
  }

  getAttribute(name: string) {
    return this.#attributes.get(name) ?? null;
  }

  removeAttribute(name: string) {
    this.#attributes.delete(name);
  }
}

function installBrowserMocks(prefersDark = true) {
  const localStorage = new MockStorage();
  const documentElement = new MockDocumentElement();
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const added: Array<(event: MediaQueryListEvent) => void> = [];
  const removed: Array<(event: MediaQueryListEvent) => void> = [];
  let currentMatches = prefersDark;

  const mediaQuery = {
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener(type: string, listener: (event: MediaQueryListEvent) => void) {
      if (type === 'change') {
        listeners.add(listener);
        added.push(listener);
      }
    },
    removeEventListener(type: string, listener: (event: MediaQueryListEvent) => void) {
      if (type === 'change') {
        listeners.delete(listener);
        removed.push(listener);
      }
    },
    dispatch(matches: boolean) {
      currentMatches = matches;
      const event = { matches, media: this.media } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    }
  } as MediaQueryList & { dispatch(matches: boolean): void };

  Object.defineProperty(mediaQuery, 'matches', {
    configurable: true,
    get: () => currentMatches
  });

  Object.assign(globalThis, {
    localStorage,
    document: { documentElement },
    window: {
      matchMedia: () => mediaQuery
    }
  });

  return {
    localStorage,
    documentElement,
    mediaQuery,
    added,
    removed,
    listenerCount: () => listeners.size
  };
}

afterEach(() => {
  delete (globalThis as { window?: Window }).window;
  delete (globalThis as { document?: Document }).document;
  delete (globalThis as { localStorage?: Storage }).localStorage;
});

test('loads dark theme by default when storage is empty', () => {
  const mocks = installBrowserMocks(false);
  const store = createThemeStore();

  assert.equal(store.value, 'dark');

  store.initialize();

  assert.equal(store.value, 'dark');
  assert.equal(mocks.documentElement.getAttribute('data-theme'), 'dark');
});

test('persists selected theme and updates html data-theme for light/dark/system', () => {
  const mocks = installBrowserMocks(true);
  const store = createThemeStore();

  store.initialize();
  store.setTheme('light');
  assert.equal(mocks.localStorage.getItem(STORAGE_KEY), 'light');
  assert.equal(mocks.documentElement.getAttribute('data-theme'), 'light');

  store.setTheme('dark');
  assert.equal(mocks.localStorage.getItem(STORAGE_KEY), 'dark');
  assert.equal(mocks.documentElement.getAttribute('data-theme'), 'dark');

  store.setTheme('system');
  assert.equal(mocks.localStorage.getItem(STORAGE_KEY), 'system');
  assert.equal(mocks.documentElement.getAttribute('data-theme'), null);
});

test('initializes and destroys the matchMedia listener cleanly', () => {
  const mocks = installBrowserMocks(true);
  const store = createThemeStore();

  store.initialize();

  assert.equal(mocks.added.length, 1);
  assert.equal(mocks.listenerCount(), 1);

  store.setTheme('system');
  mocks.documentElement.setAttribute('data-theme', 'dark');
  mocks.mediaQuery.dispatch(false);
  assert.equal(mocks.documentElement.getAttribute('data-theme'), null);

  const addedListener = mocks.added[0];
  store.destroy();

  assert.equal(mocks.removed.length, 1);
  assert.equal(mocks.removed[0], addedListener);
  assert.equal(mocks.listenerCount(), 0);
});
