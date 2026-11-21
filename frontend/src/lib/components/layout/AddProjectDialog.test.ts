import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { ApiError } from '../../api';
import {
  OPENSPEC_COMMANDS_DOCS_URL,
  OPENSPEC_INSTALL_DOCS_URL,
  OPENSPEC_SETUP_DOCS_URL,
  OPENSPEC_SUPPORTED_TOOLS_DOCS_URL,
  OPENSPEC_WORKFLOWS_DOCS_URL,
} from '../../openspecDocs';
import {
  shouldShowProjectInitGuidance,
} from '../../projectOnboarding';
import { DIRECTORY_LIST_LIMIT, deriveVisibleDirectories } from '../../directoryBrowser';
import type { BrowseDirEntry } from '../../types/api';

function dir(name: string, hasOpenSpec = false): BrowseDirEntry {
  return { name, path: `/root/${name}`, hasOpenSpec };
}

test('invalid-project init guidance only appears for missing OpenSpec initialization errors', () => {

  const missingInitError = new ApiError({
    status: 400,
    code: 'INVALID_PROJECT_PATH',
    message: 'OpenSpec project not found at /tmp/demo',
    metadata: { path: '/tmp/demo', openspecPath: '/tmp/demo/openspec' },
  });
  const missingPathError = new ApiError({
    status: 400,
    code: 'INVALID_PROJECT_PATH',
    message: 'Project root does not exist or is not a directory: /tmp/missing',
    metadata: { path: '/tmp/missing' },
  });

  assert.equal(
    shouldShowProjectInitGuidance(missingInitError, missingInitError.message),
    true,
    'guidance should show when the INVALID_PROJECT_PATH error means openspec init is missing'
  );
  assert.equal(
    shouldShowProjectInitGuidance(missingPathError, missingPathError.message),
    false,
    'guidance should stay hidden for missing-path or non-directory INVALID_PROJECT_PATH errors'
  );
  assert.equal(
    shouldShowProjectInitGuidance(null, 'OpenSpec project not found at /tmp/demo'),
    true,
    'guidance should still show when only the missing-init message string is available'
  );
  assert.equal(
    shouldShowProjectInitGuidance(null, 'Project root does not exist or is not a directory: /tmp/missing'),
    false,
    'guidance should stay hidden when only a missing-path or non-directory message string is available'
  );
});

test('project onboarding components share docs links and keep onboarding actions wired', async () => {
  const addProjectDialogSource = await readFile(new URL('./AddProjectDialog.svelte', import.meta.url), 'utf8');
  const emptyProjectStateSource = await readFile(new URL('./EmptyProjectState.svelte', import.meta.url), 'utf8');
  const settingsViewSource = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  assert.equal(OPENSPEC_INSTALL_DOCS_URL, 'https://openspec.dev/docs/installation');
  assert.equal(OPENSPEC_SETUP_DOCS_URL, 'https://openspec.dev/docs/setup');
  assert.equal(OPENSPEC_SUPPORTED_TOOLS_DOCS_URL, 'https://openspec.dev/docs/supported-tools');
  assert.equal(OPENSPEC_COMMANDS_DOCS_URL, 'https://openspec.dev/docs/skills');
  assert.equal(OPENSPEC_WORKFLOWS_DOCS_URL, 'https://openspec.dev/docs/profiles');

  for (const source of [addProjectDialogSource, emptyProjectStateSource]) {
    assert.match(source, /OPENSPEC_INSTALL_DOCS_URL/);
    assert.match(source, /OPENSPEC_SETUP_DOCS_URL/);
    assert.match(source, /t\(m\.docs_intro\)/);
  }

  for (const source of [settingsViewSource]) {
    assert.match(source, /OPENSPEC_SUPPORTED_TOOLS_DOCS_URL/);
    assert.match(source, /OPENSPEC_COMMANDS_DOCS_URL/);
    assert.match(source, /OPENSPEC_WORKFLOWS_DOCS_URL/);
    assert.match(source, /t\(m\.docs_intro\)/);
  }

  assert.match(addProjectDialogSource, /shouldShowProjectInitGuidance/);
  assert.match(addProjectDialogSource, /t\(m\.add_project_init_hint\)/);
  assert.match(addProjectDialogSource, /t\(m\.add_project_invalid_project_guidance\)/);
  assert.match(addProjectDialogSource, /projectStore\.clearError\(\)/);
  assert.match(emptyProjectStateSource, /t\(m\.empty_project_init_hint\)/);
  assert.match(emptyProjectStateSource, /layoutStore\.openOverlay\('add-project'\)/);
  assert.match(settingsViewSource, /t\(m\.settings_docs_supported_tools\)/);
  assert.match(settingsViewSource, /t\(m\.settings_docs_commands\)/);
  assert.match(settingsViewSource, /t\(m\.settings_docs_workflows\)/);
});

test('directory list puts OpenSpec folders first and keeps name order inside each group', () => {
  const { visible } = deriveVisibleDirectories([dir('alpha'), dir('beta', true), dir('gamma'), dir('zeta', true)], '');
  assert.deepEqual(visible.map((d) => d.name), ['beta', 'zeta', 'alpha', 'gamma']);
});

test('directory filter is a case-insensitive name match on the already loaded list', async () => {
  const result = deriveVisibleDirectories([dir('scratchpad'), dir('other')], 'SCRATCH');
  assert.deepEqual(result.visible.map((d) => d.name), ['scratchpad']);
  assert.equal(result.matchCount, 1);

  const source = await readFile(new URL('./AddProjectDialog.svelte', import.meta.url), 'utf8');
  // The filter derives from browseResult; only loadBrowse() calls the browse API.
  assert.equal(source.match(/browseDirectory\(/g)?.length, 1);
  assert.match(source, /deriveVisibleDirectories\(browseResult\?\.dirs \?\? \[\], dirFilter, dirLimit\)/);
  assert.match(source, /bind:value=\{dirFilter\}/);
});

test('large folders render 200 entries first and the reveal control shows the rest', async () => {
  const dirs = Array.from({ length: 931 }, (_, i) => dir(`d${String(i).padStart(4, '0')}`));
  const first = deriveVisibleDirectories(dirs, '', DIRECTORY_LIST_LIMIT);
  assert.equal(DIRECTORY_LIST_LIMIT, 200);
  assert.equal(first.visible.length, 200);
  assert.equal(first.hiddenCount, 731);

  const all = deriveVisibleDirectories(dirs, '', Infinity);
  assert.equal(all.visible.length, 931);
  assert.equal(all.hiddenCount, 0);

  const source = await readFile(new URL('./AddProjectDialog.svelte', import.meta.url), 'utf8');
  assert.match(source, /m\.add_project_show_all_remaining\(\{ count: dirList\.hiddenCount \}\)/);
  assert.match(source, /onclick=\{\(\) => \(dirLimit = Infinity\)\}/);
});

test('navigation resets the filter and the render limit before browsing', async () => {
  const source = await readFile(new URL('./AddProjectDialog.svelte', import.meta.url), 'utf8');
  const loadBrowse = source.match(/async function loadBrowse[\s\S]*?browseDirectory\(/)?.[0] ?? '';
  assert.match(loadBrowse, /dirFilter = '';/);
  assert.match(loadBrowse, /dirLimit = DIRECTORY_LIST_LIMIT;/);
  // Open subdir, go up, go back and the path bar all go through loadBrowse().
  assert.match(source, /function navigateTo[\s\S]*?loadBrowse\(dirPath\)/);
  assert.match(source, /function goUp[\s\S]*?loadBrowse\(browseResult\.parent\)/);
});

test('empty filter match shows the filter text with a clear button, distinct from no subdirectories', async () => {
  const result = deriveVisibleDirectories([dir('alpha')], 'nomatch');
  assert.equal(result.matchCount, 0);
  assert.equal(result.visible.length, 0);

  const source = await readFile(new URL('./AddProjectDialog.svelte', import.meta.url), 'utf8');
  assert.match(source, /\{#if dirList\.matchCount === 0\}/);
  assert.match(source, /m\.add_project_filter_no_matches\(\{ filter: dirFilter \}\)/);
  assert.match(source, /onclick=\{\(\) => \(dirFilter = ''\)\}/);
  assert.match(source, /m\.add_project_no_subdirectories\(\)/);

  for (const locale of ['en', 'de', 'es', 'fr', 'ja', 'pt-BR', 'zh-CN']) {
    const messages = JSON.parse(
      await readFile(new URL(`../../../../messages/${locale}.json`, import.meta.url), 'utf8'),
    ) as Record<string, string>;
    for (const key of [
      'add_project_filter_placeholder',
      'add_project_filter_no_matches',
      'add_project_filter_clear',
      'add_project_show_all_remaining',
    ]) {
      assert.ok(messages[key], `${locale} should define ${key}`);
    }
    assert.match(messages.add_project_filter_no_matches, /\{filter\}/);
    assert.match(messages.add_project_show_all_remaining, /\{count\}/);
  }
});

test('Enter in the filter opens the entry only when exactly one matches', async () => {
  const single = deriveVisibleDirectories([dir('scratchpad'), dir('other')], 'scr');
  assert.equal(single.matchCount, 1);
  assert.equal(single.visible[0].path, '/root/scratchpad');

  const source = await readFile(new URL('./AddProjectDialog.svelte', import.meta.url), 'utf8');
  assert.match(
    source,
    /e\.key === 'Enter' && dirList\.matchCount === 1\)[\s\S]*?navigateTo\(dirList\.visible\[0\]\.path\)/,
  );
});

test('path bar does not re-browse when its value already matches the current directory', async () => {
  const source = await readFile(new URL('./AddProjectDialog.svelte', import.meta.url), 'utf8');
  assert.match(
    source,
    /function navigateToPathBar\(value: string\) \{\s*const dirPath = value\.trim\(\);\s*if \(dirPath === browseResult\?\.path\) return;\s*navigateTo\(dirPath\);/,
  );
  assert.match(source, /onchange=\{\(e\) => \{\s*navigateToPathBar\(/);
  assert.match(source, /e\.key === 'Enter'\) \{\s*e\.preventDefault\(\);\s*navigateToPathBar\(/);
  assert.doesNotMatch(source, /navigateTo\(\(e\.target as HTMLInputElement\)\.value\)/);
});
