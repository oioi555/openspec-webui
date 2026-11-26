import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const panelUrl = new URL('../shared/explorer-section/specs-tree-panel.svelte', import.meta.url);
const folderRowUrl = new URL('../shared/explorer-section/specs-tree-folder-row.svelte', import.meta.url);

test('Specs panel has a fixed header with title, count, Name-default sort, and an empty state', async () => {
  const source = await readFile(panelUrl, 'utf8');

  assert.match(source, /let sortMode = \$state<ExplorerSortMode>\('name'\);/);
  assert.match(source, /<div class="shrink-0 border-b border-border bg-card px-3 py-3">/);
  assert.match(source, /\{FIXED_LABELS\.explorer\.specs\}/);
  assert.match(source, /\{specs\.value\.length\}/);
  assert.match(source, /<ExplorerSortControl/);
  assert.match(source, /<ScrollArea\.Root class="min-h-0 flex-1"/);
  assert.match(source, /m\.explorer_no_specs_found\(\)/);
});

test('Specs panel spec rows keep full ids for tooltip, open, and context menu', async () => {
  const source = await readFile(panelUrl, 'utf8');
  const itemSource = await readFile(new URL('../shared/explorer-section/explorer-section-item.svelte', import.meta.url), 'utf8');
  const buttonSource = await readFile(new URL('../shared/explorer-section/explorer-list-item-button.svelte', import.meta.url), 'utf8');

  assert.match(source, /<ExplorerSectionItem[\s\S]*name=\{spec\.name\}[\s\S]*displayName=\{row\.node\.segment\}/);
  assert.match(source, /path=\{specPath\(spec\.name\)\}/);
  assert.match(source, /`\/specs\/\$\{encodeURIComponent\(name\)\}`/);
  // The tooltip uses the full id while the label shows the segment.
  assert.match(buttonSource, /title=\{name\}>\{displayName \?\? name\}/);
  // Search Related Changes receives the full id passed as `name`.
  assert.match(itemSource, /searchStore\.open\(name\)/);
});

test('Specs panel indents rows, renders folder rows, and toggles folders from a shared chevron column', async () => {
  const source = await readFile(panelUrl, 'utf8');
  const folderSource = await readFile(folderRowUrl, 'utf8');

  assert.match(source, /const INDENT_PX = 12;/);
  assert.match(source, /padding-left: \$\{\(row\.level - 1\) \* INDENT_PX\}px/);
  assert.match(source, /<SpecsTreeFolderRow[\s\S]*count=\{countSpecs\(row\.node\)\}/);
  // Every row reserves the same chevron column so sibling icons line up;
  // only rows with children render a toggle button in it.
  assert.match(source, /'flex w-6 shrink-0 justify-end border-b border-border\/50'/);
  assert.match(source, /\{#if row\.hasChildren\}\s*<button[\s\S]*onclick=\{\(\) => toggleFolder\(row\.node\.path\)\}/);
  assert.doesNotMatch(folderSource, /<ChevronRight/);
  assert.match(folderSource, /<StatusIndicator state=\{validationStatus\} format="minimal"/);
});

test('Specs panel exposes tree semantics with a roving tabindex and pure key handling', async () => {
  const source = await readFile(panelUrl, 'utf8');

  assert.match(source, /role="tree"/);
  assert.match(source, /role="treeitem"/);
  assert.match(source, /aria-level=\{row\.level\}/);
  assert.match(source, /aria-expanded=\{row\.hasChildren \? row\.expanded : undefined\}/);
  assert.match(source, /tabindex=\{index === focusIndex \? 0 : -1\}/);
  assert.match(source, /nextTreeFocus\(rows, index, event\.key\)/);
});

test('Specs panel reveals the active spec without collapsing other folders', async () => {
  const source = await readFile(panelUrl, 'utf8');

  assert.match(source, /ancestorPaths\(name\)/);
  assert.match(source, /specTreeExpansionStore\.expandMany\(id, ancestors\)/);
  assert.match(source, /scrollIntoView\(\{ block: 'nearest' \}\)/);
  assert.doesNotMatch(source, /setExpanded/);
});

test('Specs panel strings exist in every locale', async () => {
  for (const locale of ['de', 'en', 'es', 'fr', 'ja', 'pt-BR', 'zh-CN']) {
    const messages = JSON.parse(await readFile(new URL(`../../../../messages/${locale}.json`, import.meta.url), 'utf8'));
    for (const key of ['specs_tree_folder_label', 'specs_tree_expand', 'specs_tree_collapse']) {
      assert.equal(typeof messages[key], 'string', `${locale}: ${key}`);
    }
  }
});
