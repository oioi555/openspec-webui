import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';

import {
  LOCALE_STORAGE_KEY,
  loadStoredLocale,
  resolveBootstrapLocale,
  resolvePreferredLocale,
  saveStoredLocale,
} from './locale';

const ONBOARDING_GUIDANCE_KEYS = [
  'add_project_init_hint',
  'add_project_invalid_project_guidance',
  'empty_project_init_hint',
  'docs_intro',
  'docs_install_label',
  'docs_setup_label',
] as const;

const ONBOARDING_COMMAND_KEYS = [
  'add_project_init_hint',
  'add_project_invalid_project_guidance',
  'empty_project_init_hint',
] as const;

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
}

function installNavigatorMock(navigatorValue: Pick<Navigator, 'language' | 'languages'>) {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: navigatorValue,
  });
}

async function readJson<T>(relativePath: string): Promise<T> {
  const content = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  return JSON.parse(content) as T;
}

afterEach(() => {
  delete (globalThis as { localStorage?: Storage }).localStorage;
  delete (globalThis as { navigator?: Navigator }).navigator;
});

test('saveStoredLocale and loadStoredLocale persist supported locales', () => {
  const localStorage = new MockStorage();
  Object.assign(globalThis, { localStorage });

  saveStoredLocale('ja');

  assert.equal(localStorage.getItem(LOCALE_STORAGE_KEY), 'ja');
  assert.equal(loadStoredLocale(), 'ja');
});

test('resolveBootstrapLocale prefers stored locale over browser locale', () => {
  Object.assign(globalThis, {
    localStorage: new MockStorage({
      [LOCALE_STORAGE_KEY]: 'fr-FR',
    }),
  });
  installNavigatorMock({
    language: 'en-US',
    languages: ['en-US'],
  });

  assert.equal(resolveBootstrapLocale(), 'fr');
});

test('resolvePreferredLocale normalizes supported regional browser variants', () => {
  const cases = [
    { input: 'es-MX', expected: 'es' },
    { input: 'fr-FR', expected: 'fr' },
    { input: 'zh-Hans-CN', expected: 'zh-CN' },
    { input: 'de-DE', expected: 'de' },
    { input: 'pt-PT', expected: 'pt-BR' },
    { input: 'pt-BR', expected: 'pt-BR' },
  ] as const;

  for (const { input, expected } of cases) {
    installNavigatorMock({
      language: input,
      languages: [input],
    });

    assert.equal(resolvePreferredLocale(), expected);
  }
});

test('resolveBootstrapLocale normalizes supported stored regional variants', () => {
  const cases = [
    { input: 'es-MX', expected: 'es' },
    { input: 'fr-FR', expected: 'fr' },
    { input: 'zh-Hans-CN', expected: 'zh-CN' },
    { input: 'de-DE', expected: 'de' },
    { input: 'pt-PT', expected: 'pt-BR' },
    { input: 'pt-BR', expected: 'pt-BR' },
  ] as const;

  for (const { input, expected } of cases) {
    Object.assign(globalThis, {
      localStorage: new MockStorage({
        [LOCALE_STORAGE_KEY]: input,
      }),
    });
    installNavigatorMock({
      language: 'en-US',
      languages: ['en-US'],
    });

    assert.equal(resolveBootstrapLocale(), expected);
  }
});

test('resolvePreferredLocale falls back from unsupported browser preferences to en', () => {
  installNavigatorMock({
    language: 'it-IT',
    languages: ['it-IT', 'nl-NL'],
  });

  assert.equal(resolvePreferredLocale(), 'en');
  assert.equal(resolveBootstrapLocale(), 'en');
});

test('compiled runtime keeps en as the base locale fallback', async () => {
  const runtimeSource = await readFile(new URL('./paraglide/runtime.js', import.meta.url), 'utf8');

  assert.match(runtimeSource, /export const baseLocale = "en";/);
  assert.match(runtimeSource, /export const locales = .*\["en"/);
  assert.match(runtimeSource, /"baseLocale"/);
});

test('supported locales provide onboarding guidance message keys', async () => {
  const settings = await readJson<{ locales: string[] }>('../../project.inlang/settings.json');

  for (const locale of settings.locales) {
    const messages = await readJson<Record<string, string>>(`../../messages/${locale}.json`);

    for (const key of ONBOARDING_GUIDANCE_KEYS) {
      assert.equal(typeof messages[key], 'string', `${locale} is missing ${key}`);
      assert.notEqual(messages[key].trim(), '', `${locale} has empty ${key}`);
    }
  }
});

test('translated onboarding guidance keeps `openspec init` in English', async () => {
  const settings = await readJson<{ locales: string[] }>('../../project.inlang/settings.json');

  for (const locale of settings.locales.filter((candidate) => candidate !== 'en')) {
    const messages = await readJson<Record<string, string>>(`../../messages/${locale}.json`);

    for (const key of ONBOARDING_COMMAND_KEYS) {
      assert.match(messages[key], /openspec init/, `${locale}.${key} should keep openspec init in English`);
    }
  }
});
