import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import {
  createLocaleStoreWithAdapter,
  type AppLocale,
  type LocaleAdapter,
  type LocaleRuntimeAdapter,
} from './localeCore';

class MockDocumentElement {
  #attributes = new Map<string, string>();

  setAttribute(name: string, value: string) {
    this.#attributes.set(name, value);
  }

  getAttribute(name: string) {
    return this.#attributes.get(name) ?? null;
  }
}

function installDocumentMock() {
  const documentElement = new MockDocumentElement();
  Object.assign(globalThis, {
    document: { documentElement },
  });
  return documentElement;
}

function createTestAdapter(initialLocale: AppLocale = 'en'): LocaleAdapter {
  let locale = initialLocale;
  let version = 0;

  return {
    getLocale: () => locale,
    setLocale: (nextLocale) => {
      locale = nextLocale;
    },
    getVersion: () => version,
    setVersion: (nextVersion) => {
      version = nextVersion;
    },
  };
}

afterEach(() => {
  delete (globalThis as { document?: Document }).document;
});

test('initialize normalizes supported runtime regional variants', () => {
  const documentElement = installDocumentMock();
  const runtime: LocaleRuntimeAdapter = {
    getLocale: () => 'fr-FR',
    setLocale: () => undefined,
    getTextDirection: () => 'ltr',
  };

  const store = createLocaleStoreWithAdapter(createTestAdapter(), runtime);

  assert.equal(store.initialize(), 'fr');
  assert.equal(store.value, 'fr');
  assert.equal(documentElement.getAttribute('lang'), 'fr');
  assert.equal(documentElement.getAttribute('dir'), 'ltr');
});

test('initialize falls back to en when runtime locale is unsupported', () => {
  const documentElement = installDocumentMock();
  const runtime: LocaleRuntimeAdapter = {
    getLocale: () => 'it-IT',
    setLocale: () => undefined,
    getTextDirection: () => 'ltr',
  };

  const store = createLocaleStoreWithAdapter(createTestAdapter(), runtime);

  assert.equal(store.initialize(), 'en');
  assert.equal(store.value, 'en');
  assert.equal(documentElement.getAttribute('lang'), 'en');
  assert.equal(documentElement.getAttribute('dir'), 'ltr');
});

test('initialize syncs runtime locale and document lang/dir', () => {
  const documentElement = installDocumentMock();
  const runtime: LocaleRuntimeAdapter = {
    getLocale: () => 'ja-JP',
    setLocale: () => undefined,
    getTextDirection: (locale) => (locale === 'ja' ? 'ltr' : 'rtl'),
  };

  const store = createLocaleStoreWithAdapter(createTestAdapter(), runtime);

  assert.equal(store.initialize(), 'ja');
  assert.equal(store.initialized, true);
  assert.equal(store.value, 'ja');
  assert.equal(store.version, 1);
  assert.equal(documentElement.getAttribute('lang'), 'ja');
  assert.equal(documentElement.getAttribute('dir'), 'ltr');
});

test('setLocale updates runtime without reload, increments version, and syncs document lang', async () => {
  const documentElement = installDocumentMock();
  const setLocaleCalls: Array<{ locale: AppLocale; options?: { reload?: boolean } }> = [];
  const runtime: LocaleRuntimeAdapter = {
    getLocale: () => 'en',
    setLocale: async (locale, options) => {
      setLocaleCalls.push({ locale, options });
    },
    getTextDirection: () => 'ltr',
  };

  const store = createLocaleStoreWithAdapter(createTestAdapter(), runtime);
  store.initialize();

  await store.setLocale('ja');

  assert.deepEqual(setLocaleCalls, [{ locale: 'ja', options: { reload: false } }]);
  assert.equal(store.value, 'ja');
  assert.equal(store.version, 2);
  assert.equal(documentElement.getAttribute('lang'), 'ja');
});
