import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('tabs.svelte.ts includes settings in TabType and defines a regular closeable settings tab', async () => {
  const source = await readFile(new URL('../../state/tabs.svelte.ts', import.meta.url), 'utf8');

  // TabType includes 'settings'
  assert.match(source, /type TabType = .*'settings'/);

  // createSettingsTab returns id 'settings:home' and path '/settings'
  assert.match(source, /id:\s*'settings:home'/);
  assert.match(source, /path:\s*'\/settings'/);
  assert.match(source, /pinned:\s*false/);
  assert.match(source, /preview:\s*false/);

  // openSettings is exported via the store
  assert.match(source, /openSettings\s*\(/);
  assert.match(source, /SettingsSection = 'general' \| 'workflow' \| 'commands' \| 'validation' \| 'versions'/);

  // normalizePath maps /settings to home (non-routable) when preserveSettings is not set
  assert.match(source, /!options\?\.preserveSettings\s*&&\s*withLeadingSlash\s*===\s*'\/settings'/);
  assert.match(source, /createHomeTab\(\)\.path/);
});

test('tabs.svelte.ts keeps browser history handling compatible with non-routable settings tabs', async () => {
  const source = await readFile(new URL('../../state/tabs.svelte.ts', import.meta.url), 'utf8');

  assert.match(source, /window\.addEventListener\('popstate'/);
  assert.match(source, /tabStore\.handlePath\(window\.location\.pathname, \{ history: 'none' \}\)/);
  assert.match(source, /normalizePath\(tabInput\.path, \{ preserveSettings: tabInput\.type === 'settings' \}\)/);
});

test('SettingsView.svelte includes five section anchors, IntersectionObserver, smooth scroll, and responsive layout', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // Five section ids
  assert.match(source, /id="settings-general"/);
  assert.match(source, /id="settings-workflow"/);
  assert.match(source, /id="settings-commands"/);
  assert.match(source, /id="settings-validation"/);
  assert.match(source, /id="settings-versions"/);

  // data-settings-section anchors for IntersectionObserver
  assert.match(source, /data-settings-section="general"/);
  assert.match(source, /data-settings-section="workflow"/);
  assert.match(source, /data-settings-section="commands"/);
  assert.match(source, /data-settings-section="validation"/);
  assert.match(source, /data-settings-section="versions"/);

  // IntersectionObserver usage
  assert.match(source, /IntersectionObserver/);

  // scrollIntoView with smooth behavior
  assert.match(source, /scrollIntoView\(\s*\{\s*behavior:\s*'smooth'/);

  // Responsive two-column layout class
  assert.match(source, /lg:grid-cols-\[14rem_minmax\(0,1fr\)\]/);
});

test('SettingsView.svelte preserves existing settings control wiring across all sections', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  assert.match(source, /themeStore\.value/);
  assert.match(source, /localeStore\.value/);
  assert.match(source, /commandPreferencesStore\.format/);
  assert.match(source, /validationPreferencesStore\.strict/);
  assert.match(source, /validationPreferencesStore\.autoRun/);
  assert.match(source, /validationPreferencesStore\.concurrency/);
  assert.match(source, /CORE_COMMANDS/);
  assert.match(source, /EXPANDED_COMMANDS/);
  assert.match(source, /versionStatusStore\.snapshot/);
});

test('ActivityBar.svelte wires settings via tabStore.openSettings and does not toggle a settings overlay', async () => {
  const source = await readFile(new URL('./ActivityBar.svelte', import.meta.url), 'utf8');

  // Uses tabStore.openSettings()
  assert.match(source, /tabStore\.openSettings\(\)/);

  // Does not reference settings overlay toggling
  assert.equal(source.includes("openOverlay('settings')"), false);
  assert.equal(source.includes("toggleOverlay('settings')"), false);
  assert.equal(source.includes("overlay === 'settings'"), false);
});

test('MainViewer.svelte renders SettingsView for settings tabs inside the same max-w-7xl frame as Dashboard', async () => {
  const source = await readFile(new URL('./MainViewer.svelte', import.meta.url), 'utf8');

  // Settings branch exists and renders SettingsView directly
  assert.match(source, /activeTab\.type === 'settings'/);
  assert.match(source, /<SettingsView/);

  // Extract the settings branch: from "{:else if activeTab.type === 'settings'}" to the next "{:else}"
  const settingsStart = source.indexOf("{:else if activeTab.type === 'settings'}");
  const elseAfterSettings = source.indexOf('{:else}', settingsStart);
  assert.ok(settingsStart > 0, 'settings branch should exist');
  assert.ok(elseAfterSettings > settingsStart, 'else branch after settings should exist');

  const settingsBlock = source.slice(settingsStart, elseAfterSettings);
  assert.equal(settingsBlock.includes('max-w-7xl'), true,
    'settings branch should wrap SettingsView in max-w-7xl, same as Dashboard');
  assert.match(settingsBlock, /<SettingsView/);
  assert.match(source, /initialSection\?: 'general' \| 'workflow' \| 'commands' \| 'validation' \| 'versions'/);
});

test('TabBar.svelte includes a settings icon mapping in its TAB_ICONS record', async () => {
  const source = await readFile(new URL('./TabBar.svelte', import.meta.url), 'utf8');

  // TAB_ICONS includes settings key with the Settings icon component
  assert.match(source, /settings:\s*\{\s*icon:\s*Settings/);
});

test('layout.svelte.ts no longer includes settings in LayoutOverlay and has no settingsInitialSection', async () => {
  const source = await readFile(new URL('../../state/layout.svelte.ts', import.meta.url), 'utf8');

  // LayoutOverlay does not include 'settings'
  const overlayLine = source.match(/type LayoutOverlay\s*=\s*[^;]+/);
  assert.ok(overlayLine, 'LayoutOverlay type should exist');
  assert.equal(overlayLine[0].includes('settings'), false);

  // No settingsInitialSection field
  assert.equal(source.includes('settingsInitialSection'), false);
});

test('AppLayout.svelte no longer renders a SettingsModal component', async () => {
  const source = await readFile(new URL('./AppLayout.svelte', import.meta.url), 'utf8');

  assert.equal(source.includes('SettingsModal'), false);
  assert.equal(source.includes('SettingsView'), false, 'AppLayout should not directly render SettingsView (that is MainViewer\'s job)');
});

test('App.svelte keeps one-time app bootstrap untracked from locale-dependent translations', async () => {
  const source = await readFile(new URL('../../../App.svelte', import.meta.url), 'utf8');

  assert.match(source, /import \{ untrack \} from 'svelte'/);
  assert.match(source, /\$effect\(\(\) => \{\s*return untrack\(\(\) => \{/s);
  assert.match(source, /await initializeData\(\)/);
  assert.match(source, /unsubscribe = setupWebSocket\(\)/);
});

test('SettingsView.svelte versions section header includes RefreshCw button and checkedAt timestamp', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // RefreshCw icon is imported
  assert.match(source, /import.*RefreshCw.*from '@lucide\/svelte'/);

  assert.match(source, /versionStatusStore\.loading/);

  // Versions section calls manualRefresh on click
  assert.match(source, /versionStatusStore\.manualRefresh\(\)/);

  // Refresh button has aria-label using i18n message
  assert.match(source, /settings_versions_refresh_aria/);

  // RefreshCw adds animate-spin class while loading
  assert.match(source, /animate-spin/);
  assert.match(source, /versionStatusStore\.loading \? 'animate-spin' : ''/);

  // checkedAtLabel is derived from snapshot
  assert.match(source, /checkedAtLabel/);
  assert.match(source, /settings_versions_last_checked/);
  assert.match(source, /settings_versions_never_checked/);

  // checkedAt fallback when null (never_checked message shown)
  assert.match(source, /checkedAt.*\?\?.*null/);
});

test('SettingsView.svelte disables the refresh button while version status loading is in-flight', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // The refresh Button has disabled bound to versionStatusStore.loading
  const versionsStart = source.indexOf('id="settings-versions"');
  const versionsEnd = source.indexOf('</SurfaceCard>', versionsStart);
  assert.ok(versionsStart > 0, 'versions section should exist');
  assert.ok(versionsEnd > versionsStart, 'versions SurfaceCard should close');

  const versionsBlock = source.slice(versionsStart, versionsEnd);

  // Button is disabled while any version-status lookup is in-flight
  assert.match(versionsBlock, /disabled=\{versionStatusStore\.loading\}/);

  // RefreshCw icon is present with animate-spin while the lookup is in-flight
  assert.match(versionsBlock, /<RefreshCw/);
  assert.match(versionsBlock, /versionStatusStore\.loading \? 'animate-spin' : ''/);
});
