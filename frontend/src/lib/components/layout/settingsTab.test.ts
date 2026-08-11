import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { register } from 'node:module';
import { afterEach, test } from 'node:test';
import { render } from 'svelte/server';

import type { AppLocale } from '$lib/locale';

// ---------------------------------------------------------------------------
// Server-rendered Settings localization tests (3.5)
//
// The standard node --test runner cannot load `.svelte` files, so the
// `settings-ssr-loader.mjs` test-support module is registered here to compile
// Svelte components (`svelte/server` render, no DOM) and `.svelte.ts` rune
// modules. This lets us render the real SettingsView under a locale and prove
// the rendered output follows the active locale without mounting a browser.
// ---------------------------------------------------------------------------
await register(new URL('./settings-ssr-loader.mjs', import.meta.url));

const { getLocale: originalGetLocale, overwriteGetLocale } = await import('$lib/paraglide/runtime.js');

afterEach(() => {
  overwriteGetLocale(originalGetLocale);
});

/** Render SettingsView under the given locale and return the SSR body. */
async function renderSettingsUnderLocale(locale: AppLocale): Promise<string> {
  overwriteGetLocale(() => locale);
  const { default: SettingsView } = await import('./SettingsView.svelte');
  return render(SettingsView, { props: { initialSection: 'general' } }).body;
}

async function readMessageCatalog(locale: string): Promise<Record<string, string>> {
  const content = await readFile(
    new URL(`../../../../messages/${locale}.json`, import.meta.url),
    'utf8',
  );
  return JSON.parse(content) as Record<string, string>;
}

/**
 * Representative General/Tools/Commands/Versions copy that renders regardless
 * of store state: sidebar section labels, General headings and theme options,
 * workflow labels and descriptions in the Commands section, and Tools status
 * and refresh/aria text.
 */
const SETTINGS_RENDER_MESSAGE_KEYS = [
  'settings_section_general',
  'settings_section_tools',
  'settings_section_commands',
  'settings_section_validation',
  'settings_section_versions',
  'settings_heading_theme',
  'settings_heading_language',
  'settings_theme_light',
  'settings_theme_dark',
  'settings_theme_system',
  'workflow_label_propose',
  'workflow_label_update',
  'settings_command_desc_propose',
  'settings_command_desc_sync',
  'settings_tools_no_active_project',
  'settings_tools_refresh',
  'settings_commands_refresh_aria',
  'settings_versions_never_checked',
  'settings_versions_refresh_aria',
] as const;

/**
 * Keys whose English value is a distinctive word or phrase that only appears
 * when a message silently falls back to the base locale. Curated empirically:
 * other keys legitimately contain English terms inside their translations
 * (e.g. "Validation panel" in the Japanese description), so an absence check
 * would be a false positive there.
 */
const ENGLISH_FALLBACK_GUARD_KEYS = [
  'settings_section_general',
  'settings_section_commands',
  'settings_heading_theme',
  'settings_heading_language',
  'settings_theme_light',
  'settings_theme_dark',
  'settings_command_desc_propose',
  'settings_command_desc_sync',
  'settings_tools_no_active_project',
  'settings_commands_refresh_aria',
  'workflow_label_propose',
  'workflow_label_update',
] as const;

async function assertSettingsLocaleRender(locale: AppLocale): Promise<void> {
  const body = await renderSettingsUnderLocale(locale);
  const catalog = await readMessageCatalog(locale);
  const en = await readMessageCatalog('en');

  // The rendered Settings output must carry the target locale's copy.
  for (const key of SETTINGS_RENDER_MESSAGE_KEYS) {
    const expected = catalog[key];
    assert.ok(typeof expected === 'string' && expected.length > 0, `${locale} catalog should have non-empty ${key}`);
    assert.ok(body.includes(expected), `${locale} render should contain ${key} = "${expected}"`);
  }

  // No silent English fallback for the distinctive guarded keys.
  for (const key of ENGLISH_FALLBACK_GUARD_KEYS) {
    if (en[key] !== catalog[key]) {
      assert.ok(!body.includes(en[key]), `${locale} render must not fall back to en "${en[key]}" for ${key}`);
    }
  }
}

test('SettingsView server-renders representative Japanese copy from the ja catalog', async () => {
  await assertSettingsLocaleRender('ja');
});

test('SettingsView server-renders representative German copy from the de catalog', async () => {
  await assertSettingsLocaleRender('de');
});

test('switching the locale and re-rendering updates the Settings output without reload', async () => {
  const ja = await readMessageCatalog('ja');
  const de = await readMessageCatalog('de');

  const jaBody = await renderSettingsUnderLocale('ja');
  const deBody = await renderSettingsUnderLocale('de');

  // The same component instance re-renders into different localized output.
  assert.notEqual(jaBody, deBody, 're-rendering under a different locale must change the output');

  // Section labels follow the locale.
  assert.ok(jaBody.includes(ja.settings_section_general), 'ja render should show the ja General label');
  assert.ok(deBody.includes(de.settings_section_general), 'de render should show the de General label');
  assert.ok(!jaBody.includes(de.settings_section_general), 'ja render must not contain the de General label');

  // Workflow labels follow the locale too.
  assert.ok(jaBody.includes(ja.workflow_label_propose), 'ja render should show the ja workflow label');
  assert.ok(deBody.includes(de.workflow_label_propose), 'de render should show the de workflow label');
  assert.ok(!jaBody.includes(de.workflow_label_propose), 'ja render must not contain the de workflow label');
});

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
  assert.match(source, /SettingsSection = 'general' \| 'tools' \| 'commands' \| 'validation' \| 'versions'/);

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
  assert.match(source, /id="settings-tools"/);
  assert.match(source, /id="settings-commands"/);
  assert.match(source, /id="settings-validation"/);
  assert.match(source, /id="settings-versions"/);

  // data-settings-section anchors for IntersectionObserver
  assert.match(source, /data-settings-section="general"/);
  assert.match(source, /data-settings-section="tools"/);
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
  assert.match(source, /commandPreferencesStore\.availability/);
  assert.match(source, /validationPreferencesStore\.strict/);
  assert.match(source, /validationPreferencesStore\.autoRun/);
  assert.match(source, /validationPreferencesStore\.autoRunOnArtifactChange/);
  assert.match(source, /validationPreferencesStore\.concurrency/);
  assert.match(source, /CORE_COMMANDS/);
  assert.match(source, /EXPANDED_COMMANDS/);
  assert.match(source, /versionStatusStore\.snapshot/);
});

test('commandTypes.ts keeps sync and update in core commands and out of expanded commands', async () => {
  const source = await readFile(new URL('../../types/commandTypes.ts', import.meta.url), 'utf8');
  const workflowMetadataSource = await readFile(new URL('../../workflowMetadata.ts', import.meta.url), 'utf8');

  const coreCommandsBlock = source.match(/export const CORE_COMMANDS = \[(.*?)\] as const;/s);
  const expandedCommandsBlock = source.match(/export const EXPANDED_COMMANDS = \[(.*?)\] as const;/s);

  assert.ok(coreCommandsBlock, 'CORE_COMMANDS block should exist');
  assert.ok(expandedCommandsBlock, 'EXPANDED_COMMANDS block should exist');

  assert.match(coreCommandsBlock[1], /'sync'/);
  assert.doesNotMatch(expandedCommandsBlock[1], /'sync'/);
  assert.match(coreCommandsBlock[1], /'update'/);
  assert.doesNotMatch(expandedCommandsBlock[1], /'update'/);
  assert.match(coreCommandsBlock[1], /'propose',\s*'explore',\s*'apply',\s*'sync',\s*'archive'/);

  // Workflow labels are centralized in the metadata module (was
  // CORE_COMMAND_LABELS / EXPANDED_COMMAND_LABELS in commandTypes.ts).
  assert.match(workflowMetadataSource, /sync: \{ id: 'sync', labelMessageId: 'workflow_label_sync'/);
  assert.match(workflowMetadataSource, /update: \{ id: 'update', labelMessageId: 'workflow_label_update'/);
});

test('SettingsView and shared settings surfaces use restrained solid radii', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');
  const calloutSource = await readFile(
    new URL('../shared/callout/callout.svelte', import.meta.url),
    'utf8',
  );
  const optionCardSource = await readFile(
    new URL('../shared/option-card/option-card.svelte', import.meta.url),
    'utf8',
  );

  assert.match(source, /items-center gap-3 rounded-md border px-4 py-3 text-left/);
  assert.match(source, /rounded-md border border-border bg-secondary\/50 p-4/);
  assert.match(source, /divide-y divide-border overflow-hidden rounded-md border border-border bg-secondary\/50/);
  assert.match(source, /rounded-sm border border-border bg-background px-3 py-2/);

  assert.match(calloutSource, /rounded-sm border px-4 py-3 text-sm/);
  assert.match(optionCardSource, /rounded-md border-2 bg-card p-4/);
  assert.match(optionCardSource, /rounded-md bg-background p-3 transition-colors/);
  assert.equal(optionCardSource.includes('rounded-xl'), false);
  assert.equal(optionCardSource.includes('rounded-full'), false);
  assert.equal(optionCardSource.includes('group-hover:scale'), false);
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
  assert.match(source, /initialSection\?: 'general' \| 'tools' \| 'commands' \| 'validation' \| 'versions'/);
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

  // RefreshCw adds animate-spin class while either version store is loading
  assert.match(source, /animate-spin/);
  assert.match(source, /versionStatusStore\.loading \|\| projectVersionStatusStore\.loading \? 'animate-spin' : ''/);

  // checkedAtLabel is derived from snapshot
  assert.match(source, /checkedAtLabel/);
  assert.match(source, /settings_versions_last_checked/);
  assert.match(source, /settings_versions_never_checked/);

  // checkedAt fallback when null (never_checked message shown)
  assert.match(source, /checkedAt.*\?\?.*null/);
});

test('SettingsView.svelte disables the refresh button while either version status store is loading', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // The refresh Button has disabled bound to either store's loading state
  const versionsStart = source.indexOf('id="settings-versions"');
  const versionsEnd = source.indexOf('</SurfaceCard>', versionsStart);
  assert.ok(versionsStart > 0, 'versions section should exist');
  assert.ok(versionsEnd > versionsStart, 'versions SurfaceCard should close');

  const versionsBlock = source.slice(versionsStart, versionsEnd);

  // Button is disabled while the global or the per-project version-status lookup is in-flight
  assert.match(versionsBlock, /disabled=\{versionStatusStore\.loading \|\| projectVersionStatusStore\.loading\}/);

  // RefreshCw icon is present with animate-spin while either lookup is in-flight
  assert.match(versionsBlock, /<RefreshCw/);
  assert.match(versionsBlock, /versionStatusStore\.loading \|\| projectVersionStatusStore\.loading \? 'animate-spin' : ''/);
});

test('SettingsView.svelte combined refresh handler refreshes global version status before per-project status', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // The handler awaits the global version status refresh first so the per-project
  // comparison runs against the freshly refreshed global CLI baseline, then
  // refreshes the per-project statuses.
  assert.match(
    source,
    /async function handleRefreshVersions\(\)\s*\{\s*await versionStatusStore\.manualRefresh\(\);\s*await projectVersionStatusStore\.manualRefresh\(\);\s*\}/,
  );

  // The refresh button invokes the combined handler (not just the global refresh)
  assert.match(source, /onclick=\{\(\) => handleRefreshVersions\(\)\}/);
  assert.equal(source.includes('onclick={() => versionStatusStore.manualRefresh()}'), false,
    'Refresh button should no longer call only versionStatusStore.manualRefresh()');
});

test('SettingsView.svelte renders per-project status rows with status dot, generation version, and truncated path', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // Imports projectVersionStatusStore
  assert.match(source, /import.*projectVersionStatusStore.*from '\$lib\/state\/projectVersionStatus\.svelte\.ts'/);

  // Imports buildProjectUpdateCommand from core
  assert.match(source, /import.*buildProjectUpdateCommand.*from '\$lib\/state\/projectVersionStatusCore'/);

  // Imports ProjectVersionUpdateStatus type
  assert.match(source, /import.*ProjectVersionUpdateStatus.*from '\$lib\/types\/api'/);

  // projectVersionSnapshot derived from store
  assert.match(source, /projectVersionSnapshot.*=.*\$derived\(projectVersionStatusStore\.snapshot\)/);

  // Per-project row iterates projectStore.projects with key
  assert.match(source, /#each projectStore\.projects as project \(project\.path\)/);

  // Looks up matching entry from projectVersionSnapshot
  assert.match(source, /projectVersionSnapshot\?\.projects\.find/);

  // Status dot uses getProjectStatusDotClass
  assert.match(source, /getProjectStatusDotClass\(status\)/);

  // Status dot is a small rounded-full span
  assert.match(source, /h-2 w-2 shrink-0 rounded-full/);

  // Path is truncated with full path in title attribute
  assert.match(source, /title=\{project\.path\}/);
  assert.match(source, /class="min-w-0 flex-1 truncate text-foreground"/);

  // Generation version shown when available (looked up from entry)
  assert.match(source, /entry\?\.generationVersion/);

  // Status label via getProjectStatusLabel
  assert.match(source, /getProjectStatusLabel\(status\)/);
});

test('SettingsView.svelte wires per-project copy with buildProjectUpdateCommand and icon-only button', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // Copy button uses buildProjectUpdateCommand for per-project command
  assert.match(source, /buildProjectUpdateCommand\(project\.path\)/);

  // Copy button passes project path as the label
  assert.match(source, /handleCopyCommand\(buildProjectUpdateCommand\(project\.path\), project\.path\)/);

  // Icon-only copy button with smaller size
  assert.match(source, /class="size-7 shrink-0 text-muted-foreground hover:text-foreground"/);

  // Copy icon uses slightly smaller size than the tool update copy buttons
  assert.match(source, /<Copy class="h-3\.5 w-3\.5"/);

  // Aria-label includes "Copy" and the project path
  assert.match(source, /aria-label=.*t\(m\.common_copy\).*project\.path/);
});

test('SettingsView.svelte no longer renders the single project update command copy block', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // The old single project command copy block is removed
  assert.equal(source.includes('UPDATE_COMMANDS.project'), false,
    'Single UPDATE_COMMANDS.project copy should be removed');
  assert.equal(source.includes('FIXED_LABELS.settings.versions.projectCommand'), false,
    'ProjectCommand label should not appear in the post-upgrade block');
});

test('SettingsView.svelte preserves the projectsToUpdate heading and empty-state message', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // projectsToUpdate heading still present
  assert.match(source, /t\(m\.settings_versions_projects_to_update\)/);

  // Empty state when no projects registered
  assert.match(source, /settings_versions_no_registered_projects/);

  // afterUpdatingOpenSpec heading still present
  assert.match(source, /t\(m\.settings_versions_after_updating\)/);

  // post_update_description still present
  assert.match(source, /settings_versions_post_update_description/);
});

test('SettingsView.svelte removes old format/buildCommand/isExpandedCommandAvailable API references', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // Old format API is gone
  assert.equal(source.includes('buildCommand('), false, 'buildCommand should be removed');
  assert.equal(source.includes('CommandFormat'), false, 'CommandFormat type should be removed');
  assert.equal(source.includes('setFormat('), false, 'setFormat should be removed');
  assert.equal(source.includes("commandPreferencesStore.format"), false, 'format property should be removed');
  assert.equal(source.includes('isExpandedCommandAvailable'), false, 'isExpandedCommandAvailable should be removed');
  assert.equal(source.includes('workflowFormats'), false, 'workflowFormats labels should be removed');

  // Tools section does NOT use OptionCard (general section still does for theme)
  const toolsStart = source.indexOf('id="settings-tools"');
  const toolsEnd = source.indexOf('<!-- commands section -->', toolsStart);
  assert.ok(toolsStart > 0, 'tools section should exist');
  const toolsBlock = source.slice(toolsStart, toolsEnd);
  assert.equal(toolsBlock.includes('OptionCard'), false, 'OptionCard should not be used in Tools section');
});

test('SettingsView.svelte has Tools section with read-only content and refresh', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // Tools section exists
  assert.match(source, /id="settings-tools"/);
  assert.match(source, /data-settings-section="tools"/);

  // Sidebar label uses 'tools' section id
  assert.match(source, /'tools' as const/);

  // Tools heading
  assert.match(source, /t\(m\.settings_heading_tools\)/);

  // Description uses i18n
  assert.match(source, /settings_tools_description/);

  // Supported tools docs link
  assert.match(source, /OPENSPEC_SUPPORTED_TOOLS_DOCS_URL/);

  // Refresh button with loading state
  assert.match(source, /commandPreferencesStore\.refreshAvailability/);
  assert.match(source, /commandPreferencesStore\.availabilityLoading/);
  assert.match(source, /settings_tools_refreshing/);

  // Integration list rendering
  assert.match(source, /integrations\.length/);
  assert.match(source, /settings_tools_no_integrations/);

  // Integration details: tool, delivery, example, source
  assert.match(source, /integration\.tool/);
  assert.match(source, /integration\.delivery/);
  assert.match(source, /integration\.example/);
  assert.match(source, /integration\.source/);

  // Delivery label helper
  assert.match(source, /getDeliveryLabel/);
  assert.match(source, /t\(m\.settings_tools_delivery_commands\)/);
  assert.match(source, /t\(m\.settings_tools_delivery_skills\)/);
  assert.match(source, /t\(m\.settings_tools_delivery_both\)/);

  // ExternalLink icon for docs
  assert.match(source, /ExternalLink/);

  // No "installed tools" wording
  assert.equal(source.toLowerCase().includes('installed tools'), false, 'Must not use "installed tools"');
});

test('SettingsView.svelte Tools section shows active repository and copyable openspec init command', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // buildToolsInitCommand is imported beside buildProjectUpdateCommand from core
  assert.match(source, /import \{ buildProjectUpdateCommand, buildToolsInitCommand \} from '\$lib\/state\/projectVersionStatusCore'/);

  // OPENSPEC_INIT_DOCS_URL is imported from openspecDocs
  assert.match(source, /import.*?OPENSPEC_INIT_DOCS_URL.*?from '\$lib\/openspecDocs'/s);

  // activeRepositoryPath is derived from the active project's path
  assert.match(source, /activeRepositoryPath.*=.*\$derived/);
  assert.match(source, /projectStore\.projects\.find\(\(p\) => p\.id === projectStore\.activeProjectId\)\?\.path \?\? null/);

  const toolsStart = source.indexOf('id="settings-tools"');
  const toolsEnd = source.indexOf('<!-- commands section -->', toolsStart);
  assert.ok(toolsStart > 0, 'tools section should exist');
  const toolsBlock = source.slice(toolsStart, toolsEnd);

  // Init-command block at the bottom of the Tools body, styled to match Versions update-command pattern
  assert.match(toolsBlock, /settings_tools_init_command_caption/);
  assert.match(toolsBlock, /settings_tools_init_command_aria/);

  // Full path available as tooltip on the code element
  assert.match(toolsBlock, /title=\{activeRepositoryPath\}/);

  // Command block uses the same border/background pattern as Versions section
  assert.match(toolsBlock, /rounded-sm border border-border bg-background px-3 py-2/);

  // Copy button is wired to handleCopyCommand(buildToolsInitCommand(activeRepositoryPath), activeRepositoryPath)
  assert.match(toolsBlock, /buildToolsInitCommand\(activeRepositoryPath\)/);
  assert.match(toolsBlock, /handleCopyCommand\(buildToolsInitCommand\(activeRepositoryPath\), activeRepositoryPath\)/);

  // Both documentation links render in the same paragraph: supported-tools and openspec init reference
  assert.match(toolsBlock, /OPENSPEC_SUPPORTED_TOOLS_DOCS_URL/);
  assert.match(toolsBlock, /OPENSPEC_INIT_DOCS_URL/);
  assert.match(toolsBlock, /t\(m\.settings_docs_init_command\)/);
});

test('SettingsView.svelte Tools section shows empty state and keeps docs links and refresh when no project is active', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  const toolsStart = source.indexOf('id="settings-tools"');
  const toolsEnd = source.indexOf('<!-- commands section -->', toolsStart);
  assert.ok(toolsStart > 0, 'tools section should exist');
  const toolsBlock = source.slice(toolsStart, toolsEnd);

  // Empty-state message rendered when no active project
  assert.match(toolsBlock, /settings_tools_no_active_project/);

  // The empty-state message sits in the {:else} branch of the inline init-command supplement
  assert.match(toolsBlock, /\{:else\}/);

  // Both documentation links remain visible
  assert.match(toolsBlock, /OPENSPEC_SUPPORTED_TOOLS_DOCS_URL/);
  assert.match(toolsBlock, /OPENSPEC_INIT_DOCS_URL/);

  // Refresh control remains visible
  assert.match(toolsBlock, /commandPreferencesStore\.refreshAvailability/);
  assert.match(toolsBlock, /settings_tools_refreshing/);
});

test('SettingsView.svelte Commands section gates every row on availability.workflows', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // Every row computes isAvailable from the workflows list via availability.workflows.includes
  assert.match(source, /availability\.workflows\.includes\(command\)/);
  assert.match(source, /commandPreferencesStore\.availability\.workflows\.includes/);
});

test('SettingsView.svelte Commands section header has refresh button wired to refreshAvailability', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  const commandsStart = source.indexOf('id="settings-commands"');
  const commandsEnd = source.indexOf('<!-- validation section -->', commandsStart);
  assert.ok(commandsStart > 0, 'commands section should exist');
  assert.ok(commandsEnd > commandsStart, 'validation section comment should follow commands section');
  const commandsBlock = source.slice(commandsStart, commandsEnd);

  // Refresh button inside the Commands SectionHeader calls refreshAvailability on click
  assert.match(commandsBlock, /onclick=\{\(\) => commandPreferencesStore\.refreshAvailability\(\)\}/);

  // aria-label uses the commands-specific refresh i18n message (and the checking message while loading)
  assert.match(commandsBlock, /settings_commands_refresh_aria/);
  assert.match(commandsBlock, /settings_commands_checking/);

  // Button is disabled while the availability lookup is in-flight
  assert.match(commandsBlock, /disabled=\{commandPreferencesStore\.availabilityLoading\}/);

  // RefreshCw icon is present and spins while loading
  assert.match(commandsBlock, /<RefreshCw/);
  assert.match(commandsBlock, /commandPreferencesStore\.availabilityLoading \? 'animate-spin' : ''/);
});

test('SettingsView.svelte Commands section rows source descriptions from getWorkflowCommandDescription', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // getWorkflowMetadata is imported from workflowMetadata for reactive label/description
  assert.match(
    source,
    /import \{ getWorkflowMetadata \} from '\$lib\/workflowMetadata'/,
  );

  // The description is rendered inside the shared command-row snippet via t()
  assert.match(source, /t\(\(m as unknown as Record<string, \(\) => string>\)\[meta\.labelMessageId\]\)/);
  assert.match(source, /t\(\(m as unknown as Record<string, \(\) => string>\)\[meta\.descriptionMessageId\]\)/);

  // Both Core and Expanded groups render their rows through the shared snippet
  assert.equal(
    (source.match(/\{@render commandRow\(command\)\}/g) ?? []).length,
    2,
    'both Core and Expanded groups should render rows via the shared command-row snippet',
  );
});

test('SettingsView.svelte Commands section has no shared caption and no per-row status strings', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  const commandsStart = source.indexOf('id="settings-commands"');
  const commandsEnd = source.indexOf('<!-- validation section -->', commandsStart);
  assert.ok(commandsStart > 0, 'commands section should exist');
  assert.ok(commandsEnd > commandsStart, 'validation section comment should follow commands section');
  const commandsBlock = source.slice(commandsStart, commandsEnd);

  // The shared availability caption is not rendered
  assert.equal(source.includes('settings_commands_availability_caption'), false,
    'the shared availability caption should be removed');

  // The earlier per-group Core caption key is gone
  assert.equal(source.includes('settings_commands_core_always_available_caption'), false,
    'the per-group Core caption key should be removed');

  // No per-row status strings or markers remain in the component
  assert.equal(source.includes('settings_core_commands_always_available'), false,
    'per-row core availability string should be removed');
  assert.equal(source.includes('settings_expanded_available'), false,
    'per-row expanded available status string should be removed');
  assert.equal(source.includes('settings_expanded_unavailable'), false,
    'per-row expanded unavailable status string should be removed');
  assert.equal(source.includes('settings_expanded_waiting'), false,
    'per-row waiting status string should be removed');
  assert.equal(source.includes('settings_commands_expanded_unavailable_marker'), false,
    'per-row unavailable marker should be removed');

  // Core and Expanded rows share a single command-row snippet
  assert.match(commandsBlock, /\{#snippet commandRow\(command: WorkflowCommand\)\}/);
  assert.equal(
    (commandsBlock.match(/\{@render commandRow\(command\)\}/g) ?? []).length,
    2,
    'both Core and Expanded groups should render rows via the shared snippet',
  );
});

test('SettingsView.svelte Commands section rows show a checkbox or a circle-off icon based on workflows', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  const commandsStart = source.indexOf('id="settings-commands"');
  const commandsEnd = source.indexOf('<!-- validation section -->', commandsStart);
  assert.ok(commandsStart > 0, 'commands section should exist');
  const commandsBlock = source.slice(commandsStart, commandsEnd);

  // Check and Square are gone; CircleOff remains for unavailable rows
  assert.match(source, /import \{ [^}]*CircleOff[^}]* \} from '@lucide\/svelte'/);
  assert.equal(source.includes('import { Check'), false, 'Check should be removed from the lucide import');
  assert.equal(source.includes('import { Square'), false, 'Square should be removed from the lucide import');

  // Available rows render a normal checkbox toggling through the persistence path
  assert.match(commandsBlock, /type="checkbox"/);
  assert.match(commandsBlock, /checked=\{commandPreferencesStore\.commandVisibility\[command\]\}/);
  assert.match(commandsBlock, /setCommandVisibility\(command, \(event\.currentTarget as HTMLInputElement\)\.checked\)/);

  // The checkbox is disabled while loading
  assert.match(commandsBlock, /disabled=\{commandPreferencesStore\.availabilityLoading\}/);

  // Unavailable rows render the non-interactive circle-off icon with a localized aria
  assert.match(commandsBlock, /<CircleOff class="h-4 w-4 shrink-0 text-muted-foreground"/);
  assert.match(commandsBlock, /settings_commands_icon_unavailable_aria/);

  // The three-state icon aria keys for enabled/disabled are gone
  assert.equal(source.includes('settings_commands_icon_enabled_aria'), false,
    'the enabled icon aria key should be removed');
  assert.equal(source.includes('settings_commands_icon_disabled_aria'), false,
    'the disabled icon aria key should be removed');
});

test('SettingsView.svelte Commands section shows an always-visible openspec config profile copy block and no enablement guide', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  const commandsStart = source.indexOf('id="settings-commands"');
  const commandsEnd = source.indexOf('<!-- validation section -->', commandsStart);
  assert.ok(commandsStart > 0, 'commands section should exist');
  assert.ok(commandsEnd > commandsStart, 'validation section comment should follow commands section');
  const commandsBlock = source.slice(commandsStart, commandsEnd);

  // Copy-block caption and aria
  assert.match(commandsBlock, /settings_commands_config_profile_caption/);
  assert.match(commandsBlock, /settings_commands_config_profile_aria/);

  // Code element carries the literal command
  assert.match(
    commandsBlock,
    /<code class="min-w-0 flex-1 overflow-x-auto text-xs text-primary">openspec config profile<\/code>/,
  );

  // Copy button is wired to handleCopyCommand with the literal command
  assert.match(
    commandsBlock,
    /onclick=\{\(\) => handleCopyCommand\('openspec config profile', 'openspec config profile'\)\}/,
  );

  // The earlier warning Callout enablement guide and its keys are gone
  assert.equal(source.includes('settings_commands_expanded_enablement_heading'), false,
    'the enablement guide heading key should be removed');
  assert.equal(source.includes('settings_commands_expanded_enablement_body'), false,
    'the enablement guide body key should be removed');
  assert.equal(source.includes('settings_commands_expanded_enablement_step_config'), false,
    'the enablement guide step-config key should be removed');
  assert.equal(source.includes('settings_commands_expanded_enablement_step_update'), false,
    'the enablement guide step-update key should be removed');
  assert.equal(source.includes('settings_commands_expanded_enablement_refresh_hint'), false,
    'the enablement guide refresh-hint key should be removed');
  assert.equal(source.includes('allListedCommandsAvailable'), false,
    'the guide-only derived variable should be removed');
});

test('uiText.ts delegates getWorkflowCommandLabel to workflowMetadata and no longer carries Settings fixed labels', async () => {
  const source = await readFile(new URL('../../uiText.ts', import.meta.url), 'utf8');

  // Delegates to workflowMetadata
  assert.match(source, /import \{ getWorkflowLabel, getWorkflowDescriptionMessageId \} from '\.\/workflowMetadata'/);
  assert.match(source, /return getWorkflowLabel\(command\)/);

  // The obsolete Settings subtree is gone: every Settings-facing label lives
  // in the localized message catalogs, not in FIXED_LABELS.
  assert.equal(source.includes('settings: {'), false, 'the FIXED_LABELS settings subtree should be removed');
  assert.equal(source.includes("'Tools & Integrations'"), false, 'Settings heading labels should not remain in FIXED_LABELS');
  assert.equal(source.includes('noIntegrations'), false, 'Settings tools labels should not remain in FIXED_LABELS');

  // update label is Update (workflowCommands subtree is retained)
  assert.match(source, /update: 'Update'/);

  // No old workflowFormats
  assert.equal(source.includes('workflowFormats'), false, 'workflowFormats should be removed');
});
