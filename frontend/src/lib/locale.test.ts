import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';

import {
  buildArtifactLanguageInitCommand,
  CLI_LANGUAGE_BY_LOCALE,
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

const TOOLS_COMMAND_KEYS = [
  'settings_tools_init_command_caption',
  'settings_tools_init_command_aria',
  'settings_tools_no_active_project',
] as const;

const LANGUAGE_AND_ZED_KEYS = [
  'settings_section_language',
  'settings_language_display_heading',
  'settings_language_independence',
  'settings_language_artifact_heading',
  'settings_language_artifact_description',
  'settings_language_existing_project',
  'settings_language_structural_keywords',
  'settings_language_docs',
  'settings_language_new_project_caption',
  'settings_language_command_aria',
  'settings_tools_shared_target_zed',
  'settings_tools_shared_target_agents',
  'settings_tools_shared_target_codex',
  'settings_tools_shared_target_legacy',
] as const;

const TOOL_REFERENCE_KEYS = [
  'settings_tools_reference_button',
  'tool_reference_title',
  'tool_reference_description',
  'tool_reference_close',
  'tool_reference_loading',
  'tool_reference_error',
  'tool_reference_retry',
  'tool_reference_view_official',
  'tool_reference_view_shared',
  'tool_reference_search_label',
  'tool_reference_search_placeholder',
  'tool_reference_search_clear',
  'tool_reference_no_results',
  'tool_reference_official_intro',
  'tool_reference_official_source',
  'tool_reference_verified',
  'tool_reference_researched',
  'tool_reference_tool',
  'tool_reference_client',
  'tool_reference_commands',
  'tool_reference_skills',
  'tool_reference_invocation',
  'tool_reference_not_defined',
  'tool_reference_not_documented',
  'tool_reference_shared_intro',
  'tool_reference_open_spec_targets',
  'tool_reference_shared_path',
  'tool_reference_invocation_style',
  'tool_reference_codex_rule_title',
  'tool_reference_codex_rule',
  'tool_reference_shared_disclaimer',
  'tool_reference_access_mode',
  'tool_reference_scopes',
  'tool_reference_evidence',
  'tool_reference_source',
  'tool_reference_version',
  'tool_reference_external_client',
  'tool_reference_mode_native_project',
  'tool_reference_mode_native_global',
  'tool_reference_mode_configurable',
  'tool_reference_mode_import',
  'tool_reference_mode_format_only',
  'tool_reference_mode_unverified',
  'tool_reference_mode_detail_native_project',
  'tool_reference_mode_detail_native_global',
  'tool_reference_mode_detail_configurable',
  'tool_reference_mode_detail_import',
  'tool_reference_mode_detail_format_only',
  'tool_reference_mode_detail_unverified',
  'tool_reference_scope_project',
  'tool_reference_scope_global',
  'tool_reference_scope_none',
  'tool_reference_evidence_vendor_docs',
  'tool_reference_evidence_standard_listing',
  'tool_reference_evidence_research_summary',
  'tool_reference_evidence_runtime_observed',
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

test('every supported locale maps to the expected artifact-language command example', () => {
  const expected = {
    en: 'English',
    ja: 'Japanese',
    de: 'German',
    es: 'Spanish',
    fr: 'French',
    'pt-BR': 'Portuguese (pt-BR)',
    'zh-CN': 'Chinese (Simplified)',
  } as const;

  assert.deepEqual(CLI_LANGUAGE_BY_LOCALE, expected);
  for (const [locale, language] of Object.entries(expected)) {
    assert.equal(
      buildArtifactLanguageInitCommand(locale as keyof typeof expected),
      `openspec init --language "${language}"`,
    );
  }
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

test('translated tools section keeps `openspec init` in English', async () => {
  const settings = await readJson<{ locales: string[] }>('../../project.inlang/settings.json');

  for (const locale of settings.locales.filter((candidate) => candidate !== 'en')) {
    const messages = await readJson<Record<string, string>>(`../../messages/${locale}.json`);

    for (const key of TOOLS_COMMAND_KEYS) {
      assert.match(messages[key], /openspec init/, `${locale}.${key} should keep openspec init in English`);
    }
  }
});

test('translated commands section keeps CLI command tokens in English', async () => {
  const settings = await readJson<{ locales: string[] }>('../../project.inlang/settings.json');

  for (const locale of settings.locales.filter((candidate) => candidate !== 'en')) {
    const messages = await readJson<Record<string, string>>(`../../messages/${locale}.json`);

    assert.match(
      messages.settings_commands_config_profile_caption,
      /openspec update/,
      `${locale}.settings_commands_config_profile_caption should keep openspec update in English`,
    );
    assert.match(
      messages.settings_commands_config_profile_aria,
      /openspec config profile/,
      `${locale}.settings_commands_config_profile_aria should keep openspec config profile in English`,
    );
  }
});

test('every locale has complete Language and Zed copy with fixed OpenSpec tokens', async () => {
  const settings = await readJson<{ locales: string[] }>('../../project.inlang/settings.json');

  for (const locale of settings.locales) {
    const messages = await readJson<Record<string, string>>(`../../messages/${locale}.json`);
    for (const key of LANGUAGE_AND_ZED_KEYS) {
      assert.equal(typeof messages[key], 'string', `${locale} is missing ${key}`);
      assert.notEqual(messages[key].trim(), '', `${locale} has empty ${key}`);
    }

    assert.match(messages.settings_language_independence, /openspec\/config\.yaml/);
    assert.match(messages.settings_language_existing_project, /`context`/);
    assert.match(messages.settings_language_existing_project, /openspec\/config\.yaml/);
    assert.match(messages.settings_language_structural_keywords, /`SHALL`/);
    assert.match(messages.settings_language_structural_keywords, /`MUST`/);
    assert.match(messages.settings_tools_shared_target_zed, /Zed/);
    assert.match(messages.settings_tools_shared_target_agents, /\.agents/);
  }
});

test('every locale has complete tool-reference copy with fixed technical tokens', async () => {
  const settings = await readJson<{ locales: string[] }>('../../project.inlang/settings.json');

  for (const locale of settings.locales) {
    const messages = await readJson<Record<string, string>>(`../../messages/${locale}.json`);
    for (const key of TOOL_REFERENCE_KEYS) {
      assert.equal(typeof messages[key], 'string', `${locale} is missing ${key}`);
      assert.notEqual(messages[key].trim(), '', `${locale} has empty ${key}`);
    }
    assert.match(messages.tool_reference_description, /OpenSpec/);
    assert.match(messages.tool_reference_view_shared, /\.agents/);
    assert.match(messages.tool_reference_codex_rule, /codex/);
    assert.match(messages.tool_reference_codex_rule, /agents/);
  }
});

// ---------------------------------------------------------------------------
// Raw source-catalog parity (before Paraglide compilation can supply fallbacks)
// ---------------------------------------------------------------------------

async function readSourceCatalogs(): Promise<Array<{ locale: string; messages: Record<string, string> }>> {
  const settings = await readJson<{ locales: string[] }>('../../project.inlang/settings.json');
  return Promise.all(
    settings.locales.map(async (locale) => ({
      locale,
      messages: await readJson<Record<string, string>>(`../../messages/${locale}.json`),
    })),
  );
}

test('every source catalog has exact key parity with the en base catalog', async () => {
  const catalogs = await readSourceCatalogs();
  const en = catalogs.find((catalog) => catalog.locale === 'en')!;
  const enKeys = Object.keys(en.messages).sort();

  for (const { locale, messages } of catalogs) {
    const keys = Object.keys(messages).sort();
    const missing = enKeys.filter((key) => !keys.includes(key));
    const extra = keys.filter((key) => !enKeys.includes(key));

    assert.deepEqual(
      keys,
      enKeys,
      `${locale}: source catalog key set must exactly match en` +
        (missing.length > 0 ? ` — missing ${missing.join(', ')}` : '') +
        (extra.length > 0 ? ` — unexpected ${extra.join(', ')}` : ''),
    );
  }
});

test('every source catalog value is a non-empty string', async () => {
  const catalogs = await readSourceCatalogs();

  for (const { locale, messages } of catalogs) {
    for (const [key, value] of Object.entries(messages)) {
      assert.equal(typeof value, 'string', `${locale}.${key} must be a string`);
      assert.notEqual(value.trim(), '', `${locale}.${key} must not be empty`);
    }
  }
});

test('non-Japanese catalogs contain no hiragana or katakana', async () => {
  const catalogs = await readSourceCatalogs();
  // Hiragana and katakana only; Han characters (shared with Chinese) are allowed.
  const kana = /[\u3040-\u309F\u30A0-\u30FF]/;

  for (const { locale, messages } of catalogs) {
    if (locale === 'ja') {
      continue;
    }
    for (const [key, value] of Object.entries(messages)) {
      assert.doesNotMatch(value, kana, `${locale}.${key} contains Japanese kana`);
    }
  }
});

// ---------------------------------------------------------------------------
// Required CLI command tokens stay English in every Settings message that
// embeds them. The target keys and their expected tokens are derived from the
// en base catalog, so a newly added message cannot be missed by the whitelist.
// ---------------------------------------------------------------------------

const SETTINGS_COMMAND_TOKENS = [
  'openspec init',
  'openspec update',
  'openspec config profile',
] as const;

test('every Settings message keeps its required CLI command tokens in English across all locales', async () => {
  const catalogs = await readSourceCatalogs();
  const en = catalogs.find((catalog) => catalog.locale === 'en')!;

  // Derive the expected token map from the en catalog: for each key whose en
  // value embeds a supported CLI command token, that token must survive every
  // translation. `openspec update` in en may be wrapped in backticks; the
  // token comparison ignores surrounding punctuation.
  const expectedTokensByKey = new Map<string, string[]>();
  for (const [key, value] of Object.entries(en.messages)) {
    const tokens = SETTINGS_COMMAND_TOKENS.filter((token) => value.includes(token));
    if (tokens.length > 0) {
      expectedTokensByKey.set(key, tokens);
    }
  }
  assert.ok(expectedTokensByKey.size > 0, 'en catalog should embed CLI command tokens');

  for (const { locale, messages } of catalogs) {
    if (locale === 'en') {
      continue;
    }
    for (const [key, tokens] of expectedTokensByKey) {
      for (const token of tokens) {
        assert.ok(
          messages[key].includes(token),
          `${locale}.${key} must keep "${token}" in English (translated: "${messages[key]}")`,
        );
      }
    }
  }
});
