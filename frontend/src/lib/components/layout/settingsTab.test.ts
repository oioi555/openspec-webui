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
  assert.match(workflowMetadataSource, /sync: \{ id: 'sync', label: 'Sync'/);
  assert.match(workflowMetadataSource, /update: \{ id: 'update', label: 'Revise Plan'/);
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
  assert.match(source, /aria-label=.*FIXED_LABELS\.common\.copy.*project\.path/);
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
  assert.match(source, /FIXED_LABELS\.settings\.versions\.projectsToUpdate/);

  // Empty state when no projects registered
  assert.match(source, /settings_versions_no_registered_projects/);

  // afterUpdatingOpenSpec heading still present
  assert.match(source, /FIXED_LABELS\.settings\.versions\.afterUpdatingOpenSpec/);

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
  assert.match(source, /headings\.tools/);

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
  assert.match(source, /FIXED_LABELS\.settings\.tools\.commands/);
  assert.match(source, /FIXED_LABELS\.settings\.tools\.skills/);
  assert.match(source, /FIXED_LABELS\.settings\.tools\.both/);

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
  assert.match(toolsBlock, /FIXED_LABELS\.settings\.docs\.initCommand/);
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

test('SettingsView.svelte Commands section uses availability.workflows for expanded gating', async () => {
  const source = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  // Expanded commands use availability.workflows.includes instead of isExpandedCommandAvailable
  assert.match(source, /availability\.workflows\.includes\(command\)/);
  assert.match(source, /commandPreferencesStore\.availability\.workflows\.includes/);
});

test('uiText.ts delegates getWorkflowCommandLabel to workflowMetadata and has tools labels', async () => {
  const source = await readFile(new URL('../../uiText.ts', import.meta.url), 'utf8');

  // Delegates to workflowMetadata
  assert.match(source, /import \{ getWorkflowLabel \} from '\.\/workflowMetadata'/);
  assert.match(source, /return getWorkflowLabel\(command\)/);

  // tools section/heading labels
  assert.match(source, /tools: 'Tools'/);
  assert.match(source, /tools: 'Tools & Integrations'/);

  // tools object with delivery labels
  assert.match(source, /tools: \{/);
  assert.match(source, /delivery: 'Delivery'/);
  assert.match(source, /noIntegrations:/);

  // update label is Revise Plan
  assert.match(source, /update: 'Revise Plan'/);

  // No old workflowFormats
  assert.equal(source.includes('workflowFormats'), false, 'workflowFormats should be removed');
});
