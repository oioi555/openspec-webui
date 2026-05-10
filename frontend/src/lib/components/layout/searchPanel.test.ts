import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('search panel keeps explanatory placeholder content in the body instead of the header', async () => {
  const source = await readFile(new URL('../shared/explorer-section/search-explorer-section.svelte', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /<p class="mb-3 text-xs leading-relaxed text-muted-foreground">\{t\(m\.search_description\)\}<\/p>/);
  assert.match(source, /\{#if searchStore\.loading\}/);
  assert.match(source, /\{:else if searchStore\.query\.length < 2\}/);
  assert.match(source, /\{t\(m\.search_panel_heading\)\}/);
  assert.match(source, /\{t\(m\.search_start_typing\)\}/);
  assert.match(source, /\{t\(m\.search_no_results, \{ query: searchStore\.query \}\)\}/);
  assert.match(source, /border-dashed border-border bg-secondary\/30 p-4 text-center/);
});

test('search panel renders metadata match previews distinctly from content excerpts', async () => {
  const source = await readFile(new URL('../shared/explorer-section/search-explorer-section.svelte', import.meta.url), 'utf8');
  const messages = await readFile(new URL('../../../../messages/en.json', import.meta.url), 'utf8');

  assert.match(source, /result\.matchSource === 'name'/);
  assert.match(source, /result\.matchSource === 'path'/);
  assert.match(source, /t\(m\.search_match_name, \{ value: result\.excerpt \}\)/);
  assert.match(source, /t\(m\.search_match_path, \{ value: result\.excerpt \}\)/);
  assert.match(messages, /"search_match_name"/);
  assert.match(messages, /"search_match_path"/);
});

test('search panel header only shows transient loading or result-count status text', async () => {
  const source = await readFile(new URL('../shared/explorer-section/search-explorer-section.svelte', import.meta.url), 'utf8');

  assert.match(source, /\{#if searchStore\.loading\}\s*\{FIXED_LABELS\.common\.loading\}/);
  assert.match(source, /\{:else if searchStore\.results\.length > 0\}\s*\{t\(m\.search_result_count, \{ count: searchStore\.results\.length \}\)\}/);
  assert.doesNotMatch(source, /\{t\(m\.search_start_typing\)\}\s*\{:else if searchStore\.loading\}/);
});

test('search panel header exposes a persistent highlight toggle instead of a result badge', async () => {
  const source = await readFile(new URL('../shared/explorer-section/search-explorer-section.svelte', import.meta.url), 'utf8');
  const messages = await readFile(new URL('../../../../messages/en.json', import.meta.url), 'utf8');

  assert.match(source, /Highlighter/);
  assert.match(source, /uiPreferencesStore\.searchHighlightsEnabled/);
  assert.match(source, /uiPreferencesStore\.setSearchHighlightsEnabled\(!uiPreferencesStore\.searchHighlightsEnabled\)/);
  assert.match(source, /aria-pressed=\{uiPreferencesStore\.searchHighlightsEnabled\}/);
  assert.match(source, /t\(m\.search_highlight_matches\)/);
  assert.doesNotMatch(source, /<Badge/);
  assert.match(messages, /"search_highlight_matches"/);
});

test('search panel preserves clear control, result navigation, and change-kind semantics', async () => {
  const source = await readFile(new URL('../shared/explorer-section/search-explorer-section.svelte', import.meta.url), 'utf8');

  assert.match(source, /\{#if searchStore\.query \|\| searchStore\.results\.length > 0\}/);
  assert.match(source, /onclick=\{\(\) => searchStore\.clear\(\)\}/);
  assert.match(source, /searchStore\.openResult\(result, \{ confirmed: !uiPreferencesStore\.previewTabsEnabled \|\| event\.ctrlKey \}\)/);
  assert.match(source, /\{@const resultPath = searchStore\.pathForResult\(result\)\}/);
  assert.match(source, /archivedChanges\.value\.some\(\(change\) => change\.name === result\.name\)/);
  assert.match(source, /activeChanges\.value\.some\(\(change\) => change\.name === result\.name\)/);
  assert.match(source, /active=\{tabStore\.activeTab\?\.path === resultPath\}/);
  assert.match(source, /<ScrollArea\.Root class="min-h-0 flex-1" viewportClass="h-full">/);
});
