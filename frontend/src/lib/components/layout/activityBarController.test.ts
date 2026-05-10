import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { isActivityBarExplorerOpen, shouldToggleCurrentPreset } from './activityBarController';

test('same-section clicks only toggle when the explorer surface is currently open', () => {
  assert.equal(
    shouldToggleCurrentPreset({
      preset: 'home',
      activeSection: 'home',
      hasActiveProject: true,
      responsiveMode: 'wide',
      explorerCollapsed: false,
      narrowDrawerOpen: false,
    }),
    true
  );

  assert.equal(
    shouldToggleCurrentPreset({
      preset: 'archive',
      activeSection: 'archive',
      hasActiveProject: true,
      responsiveMode: 'narrow',
      explorerCollapsed: false,
      narrowDrawerOpen: true,
    }),
    true
  );

  assert.equal(
    shouldToggleCurrentPreset({
      preset: 'specs',
      activeSection: 'specs',
      hasActiveProject: true,
      responsiveMode: 'wide',
      explorerCollapsed: true,
      narrowDrawerOpen: false,
    }),
    false
  );

  assert.equal(
    shouldToggleCurrentPreset({
      preset: 'home',
      activeSection: 'home',
      hasActiveProject: true,
      responsiveMode: 'narrow',
      explorerCollapsed: false,
      narrowDrawerOpen: false,
    }),
    false
  );

  assert.equal(
    shouldToggleCurrentPreset({
      preset: 'home',
      activeSection: 'home',
      hasActiveProject: false,
      responsiveMode: 'wide',
      explorerCollapsed: false,
      narrowDrawerOpen: false,
    }),
    false
  );
});

test('activity bar explorer-open helper ignores persisted explorer state when no project is active', () => {
  assert.equal(
    isActivityBarExplorerOpen({
      hasActiveProject: false,
      responsiveMode: 'wide',
      explorerCollapsed: false,
      narrowDrawerOpen: true,
    }),
    false
  );
});

test('isActivityBarExplorerOpen returns correct state for narrow and wide modes with active project', () => {
  // narrow + drawer open → explorer visible
  assert.equal(
    isActivityBarExplorerOpen({
      hasActiveProject: true,
      responsiveMode: 'narrow',
      explorerCollapsed: false,
      narrowDrawerOpen: true,
    }),
    true
  );

  // narrow + drawer closed → explorer hidden
  assert.equal(
    isActivityBarExplorerOpen({
      hasActiveProject: true,
      responsiveMode: 'narrow',
      explorerCollapsed: false,
      narrowDrawerOpen: false,
    }),
    false
  );

  // wide + pane expanded → explorer visible
  assert.equal(
    isActivityBarExplorerOpen({
      hasActiveProject: true,
      responsiveMode: 'wide',
      explorerCollapsed: false,
      narrowDrawerOpen: false,
    }),
    true
  );

  // wide + pane collapsed → explorer hidden
  assert.equal(
    isActivityBarExplorerOpen({
      hasActiveProject: true,
      responsiveMode: 'wide',
      explorerCollapsed: true,
      narrowDrawerOpen: false,
    }),
    false
  );
});

test('activity bar no longer wires the bottom control to the project selector overlay', async () => {
  const source = await readFile(new URL('./ActivityBar.svelte', import.meta.url), 'utf8');

  assert.equal(source.includes("layoutStore.openOverlay('project-selector')"), false);
  assert.equal(source.includes("layoutStore.overlay === 'project-selector'"), false);
  assert.match(source, /shouldToggleCurrentPreset/);
  assert.match(source, /FIXED_LABELS\.appName/);
});

test('ActivityBar shows a search highlight-state dot only while highlight mode is enabled for a valid query', async () => {
  const source = await readFile(new URL('./ActivityBar.svelte', import.meta.url), 'utf8');

  assert.match(source, /import \{ uiPreferencesStore \} from '\$lib\/state\/uiPreferences\.svelte\.ts';/);
  assert.match(source, /let searchHighlightActive = \$derived/);
  assert.match(source, /uiPreferencesStore\.searchHighlightsEnabled && searchStore\.query\.length >= 2/);
  assert.match(source, /class=\{`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors \$\{buttonClass\('search'\)\}`\}/);
  assert.match(source, /\{#if searchHighlightActive\}/);
  assert.match(source, /absolute right-1 top-1 inline-flex size-2 rounded-full border border-warning-border bg-warning-bg/);
});
