import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { register } from 'node:module';
import { test } from 'node:test';
import { render } from 'svelte/server';

// Compile `.svelte` / `.svelte.ts` modules for server rendering (no DOM).
await register(new URL('../layout/settings-ssr-loader.mjs', import.meta.url));

const { specs, activeChanges } = await import('../../state/appData.svelte.ts');
const { uiPreferencesStore } = await import('../../state/uiPreferences.svelte.ts');
const { pathStatusStore } = await import('../../state/pathStatus.svelte.ts');
const { default: MarkdownRenderer } = await import('./MarkdownRenderer.svelte');

specs.value = [{ name: 'auth', path: '/repo/openspec/specs/auth', lastModified: null }];
activeChanges.value = [{
  name: 'add-auth',
  path: '/repo/openspec/changes/add-auth',
  isArchived: false,
  archivedDate: null,
  lastModified: null,
  taskProgress: { done: 0, total: 0, percentage: 0 },
  specDeltaCount: 0,
  hasProposal: true,
  hasDesign: false,
  fileCount: 1,
  groupCount: 1,
  otherFileCount: 0,
}];

const CONTENT = '[spec](../../specs/auth/spec.md) [tasks](./tasks.md) [code](../../../src/a.ts#L5)';
const SOURCE = '/repo/openspec/changes/add-auth/proposal.md';

function renderBody(props: Record<string, unknown>) {
  return render(MarkdownRenderer, { props: { content: CONTENT, ...props } }).body;
}

test('MarkdownRenderer resolves links against sourcePath using the app spec and change lists', () => {
  const body = renderBody({ sourcePath: SOURCE });

  assert.match(body, /href="\/specs\/auth" data-md-link="spec"/);
  assert.match(body, /href="\/changes\/add-auth" data-md-link="change"[^>]*data-md-change-file="tasks\.md"/);
  assert.match(body, /href="file:\/\/\/repo\/src\/a\.ts"[^>]*data-md-link="file"/);
});

test('MarkdownRenderer keeps raw hrefs without sourcePath', () => {
  const body = renderBody({});

  assert.match(body, /href="\.\.\/\.\.\/specs\/auth\/spec\.md"/);
  assert.doesNotMatch(body, /data-md-link="spec"/);
});

test('MarkdownRenderer file links follow the open-files-with preference', () => {
  uiPreferencesStore.setOpenFilesWith('vscode');
  try {
    assert.match(renderBody({ sourcePath: SOURCE }), /href="vscode:\/\/file\/repo\/src\/a\.ts:5"/);

    uiPreferencesStore.setOpenFilesWith('custom');
    uiPreferencesStore.setCustomEditorTemplate('javascript:{path}');
    assert.match(renderBody({ sourcePath: SOURCE }), /href="file:\/\/\/repo\/src\/a\.ts"/, 'invalid template falls back to copy');
  } finally {
    uiPreferencesStore.setOpenFilesWith('copy');
    uiPreferencesStore.setCustomEditorTemplate('');
  }
});

test('MarkdownRenderer copies the path when no editor URL is available', async () => {
  const source = await readFile(new URL('./MarkdownRenderer.svelte', import.meta.url), 'utf8');

  assert.match(source, /const url = buildEditorUrl\(/);
  assert.match(source, /window\.location\.href = url;/);
  assert.match(source, /copyToClipboard\(path, t\(m\.markdown_link_path_label\)\)/);
});

test('MarkdownRenderer feeds unknown paths to the path status store and copies missing paths with a warning', async () => {
  // The store fetches over HTTP, which SSR tests cannot serve. Rendering of missing links is
  // covered in markdown.test.ts; this checks the renderer wiring to the store and the click path.
  const source = await readFile(new URL('./MarkdownRenderer.svelte', import.meta.url), 'utf8');

  assert.match(source, /pathStatus: \(path\) => pathStatusStore\.get\(path\)/);
  assert.match(source, /onUnknownPath: \(path\) => unknownPaths\.add\(path\)/);
  assert.match(source, /pathStatusStore\.request\(unknownPaths\)/);
  assert.match(source, /if \(missing\) \{\s*void copyMissingPath\(path\);/);
  assert.match(source, /toast\.warning\(t\(m\.markdown_link_missing_toast/);
  assert.equal(pathStatusStore.get('/never-requested'), undefined);
});
