import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('layout state includes validate preset and section wiring', async () => {
  const source = await readFile(new URL('../../state/layout.svelte.ts', import.meta.url), 'utf8');

  assert.match(source, /ActivityPreset = 'home' \| 'archive' \| 'specs' \| 'search' \| 'validate'/);
  assert.match(source, /ExplorerSection = 'active-changes' \| 'archive' \| 'specs' \| 'search' \| 'validate'/);
  assert.match(source, /validate: 'validate'/);
});

test('ActivityBar includes a validate control with icon, tooltip, badge, and handler', async () => {
  const source = await readFile(new URL('./ActivityBar.svelte', import.meta.url), 'utf8');

  assert.match(source, /FlaskConical/);
  assert.match(source, /onclick=\{openValidate\}/);
  assert.match(source, /t\(m\.validation_activity_label\)/);
  assert.match(source, /validationStore\.failedCount > 0/);
  assert.match(source, /absolute bottom-1 right-1/);
});

test('ExplorerPane renders ValidationExplorerSection when validate preset is active', async () => {
  const source = await readFile(new URL('./ExplorerPane.svelte', import.meta.url), 'utf8');

  assert.match(source, /ValidationExplorerSection/);
  assert.match(source, /layoutStore\.activityPreset === 'validate'/);
});

test('Dashboard renders a validation summary card in the five-card top grid and opens the validate preset', async () => {
  const source = await readFile(new URL('../../views/Dashboard.svelte', import.meta.url), 'utf8');

  assert.match(source, /xl:grid-cols-5/);
  assert.match(source, /FIXED_LABELS\.validation\.title/);
  assert.match(source, /validationStore\.dashboardSummary\.primaryValue/);
  assert.match(source, /validationStore\.dashboardSummary\.description/);
  assert.match(source, /onclick=\{openValidationPanel\}/);
  assert.match(source, /layoutStore\.setActivityPreset\('validate'\)/);
  assert.match(source, /IconBox icon=\{FlaskConical\} variant=\{validationStore\.dashboardSummary\.iconVariant\}/);
});

test('Dashboard validation card uses validation store summary and does not run validation or open viewer tabs', async () => {
  const source = await readFile(new URL('../../views/Dashboard.svelte', import.meta.url), 'utf8');

  assert.equal(source.includes('validationStore.refresh('), false);
  assert.equal(source.includes("tabStore.open('/validate'"), false);
  assert.equal(source.includes('tabStore.open(`/validate'), false);
  assert.match(source, /function openValidationPanel\(\) \{[\s\S]*setActivityPreset\('validate'\);[\s\S]*\}/);
});

test('validation store exposes localized dashboard summary copy', async () => {
  const source = await readFile(new URL('../../state/validation.svelte.ts', import.meta.url), 'utf8');
  const messages = await readFile(new URL('../../../../messages/en.json', import.meta.url), 'utf8');

  assert.match(source, /deriveValidationDashboardSummary/);
  assert.match(source, /dashboard_validation_not_run_value/);
  assert.match(source, /dashboard_validation_running_description/);
  assert.match(source, /dashboard_validation_last_run_description/);
  assert.match(messages, /"dashboard_validation_not_run_value"/);
  assert.match(messages, /"dashboard_validation_failed_value"/);
});

test('validation panel wiring keeps navigation in existing tabs and shows non-navigable items safely', async () => {
  const source = await readFile(new URL('../shared/explorer-section/validation-explorer-section.svelte', import.meta.url), 'utf8');
  const storeSource = await readFile(new URL('../../state/validation.svelte.ts', import.meta.url), 'utf8');

  assert.match(source, /ExplorerListItemButton/);
  assert.match(source, /validationStore\.openItem/);
  assert.match(source, /copyToClipboard\(item\.name, t\(m\.copy_label_validation_item_name\)\)/);
  assert.match(source, /searchStore\.open\(item\.name\)/);
  assert.match(source, /t\(m\.validation_non_navigable\)/);
  assert.match(source, /t\(m\.validation_run\)/);
  assert.match(source, /attentionItems\(\)/);
  assert.match(source, /validationStore\.result\?\.items\.filter\(\(item\) => item\.status !== 'passed'\)/);
  assert.match(source, /tabStore\.openSettings\(\{ initialSection: 'validation' \}\)/);
  assert.match(source, /getValidationItemPath/);
  assert.match(source, /active=\{itemPath !== null && tabStore\.activeTab\?\.path === itemPath\}/);
  assert.match(storeSource, /tabStore\.openConfirmed/);
  assert.match(storeSource, /tabStore\.openPreview/);
  assert.match(storeSource, /export function getValidationItemPath/);
  assert.match(storeSource, /const path = getValidationItemPath\(item\);/);
});

test('shared badge and validation semantics support informational info tone', async () => {
  const badgeSource = await readFile(new URL('../ui/badge/badge.svelte', import.meta.url), 'utf8');
  const semanticsSource = await readFile(new URL('../../visualSemantics.ts', import.meta.url), 'utf8');

  assert.match(badgeSource, /type Variant = 'default' \| 'secondary' \| 'outline' \| 'success' \| 'warning' \| 'info' \| 'destructive'/);
  assert.match(badgeSource, /info: 'border-transparent bg-info-bg text-info'/);
  assert.match(semanticsSource, /validationSeverityVisuals:[\s\S]*info: \{[\s\S]*badgeVariant: 'info'/);
  assert.match(semanticsSource, /validationStatusVisuals:[\s\S]*info: \{[\s\S]*badgeVariant: 'info'/);
});

test('shared task-progress icon variant helper maps zero/incomplete/complete to muted/warning/success', async () => {
  const semanticsSource = await readFile(new URL('../../visualSemantics.ts', import.meta.url), 'utf8');

  assert.match(semanticsSource, /export function getTaskProgressIconVariant\(done: number, total: number\): IconBoxVariant/);
  assert.match(semanticsSource, /if \(total === 0\) return 'muted'/);
  assert.match(semanticsSource, /if \(done < total\) return 'warning'/);
  assert.match(semanticsSource, /return 'success'/);
});

test('Dashboard Tasks card uses the shared task-progress icon variant helper', async () => {
  const source = await readFile(new URL('../../views/Dashboard.svelte', import.meta.url), 'utf8');

  assert.match(source, /import \{ getTaskProgressIconVariant \} from '\$lib\/visualSemantics'/);
  assert.match(source, /getTaskProgressIconVariant\(overallTaskProgress\.done, overallTaskProgress\.total\)/);
  assert.equal(source.includes('IconBox icon={CircleCheckBig} variant="warning"'), false);
});

test('validation panel text is localized through Paraglide messages', async () => {
  const source = await readFile(new URL('../shared/explorer-section/validation-explorer-section.svelte', import.meta.url), 'utf8');
  const messages = await readFile(new URL('../../../../messages/ja.json', import.meta.url), 'utf8');

  assert.match(source, /t\(m\.validation_panel_title\)/);
  assert.match(source, /t\(m\.validation_panel_description\)/);
  assert.match(source, /t\(m\.settings_validation_description\)/);
  assert.match(source, /t\(m\.validation_no_matching_filters\)/);
  assert.match(messages, /"validation_panel_title"/);
  assert.match(messages, /"validation_no_matching_filters"/);
  assert.match(messages, /"copy_label_validation_item_name"/);
});

test('validation panel header is compact, links to settings, and renders status count filters', async () => {
  const source = await readFile(new URL('../shared/explorer-section/validation-explorer-section.svelte', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /<p class="mb-3 text-xs leading-relaxed text-muted-foreground">\{t\(m\.validation_panel_description\)\}<\/p>/);
  assert.doesNotMatch(source, /StatusIndicator state=\{validationStore\.result\.status\}/);
  assert.equal(source.includes("$lib/components/ui/tooltip"), false);
  assert.match(source, /const FILTER_STATUSES: AttentionStatus\[\] = \['failed', 'warning', 'info'\]/);
  assert.match(source, /validationStore\.result\?\.summary\.statusCounts\[status\]/);
  assert.match(source, /getValidationStatusVisual\(status\)/);
  assert.match(source, /let excludedStatuses = \$state<Set<AttentionStatus>>\(new Set\(\)\)/);
  assert.match(source, /aria-checked=\{!isStatusExcluded\(status\)\}/);
  assert.match(source, /disabled=\{!validationStore\.result\}/);
  assert.match(source, /onclick=\{\(\) => toggleStatus\(status\)\}/);
  assert.match(source, /filteredAttentionItems\(\)/);
  assert.match(source, /title=\{t\(m\.validation_panel_description\)\}/);
  assert.match(source, /class=\{`flex min-w-0 items-center gap-2 \$\{validationStore\.result \? 'mb-3' : ''\}`\}/);
  assert.match(source, /flex flex-wrap items-start justify-between gap-x-3 gap-y-1\.5/);
  assert.match(source, /content-center text-right text-\[11px\] leading-5 text-muted-foreground/);
  assert.match(source, /\{#if validationStore\.result\}\s*<button[\s\S]*onclick=\{\(\) => validationStore\.refresh\(\)\}[\s\S]*<\/button>\s*\{\/if\}\s*<button[\s\S]*openValidationSettings/);
  assert.match(source, /\{#if !validationStore\.result\}/);
  assert.match(source, /border-dashed border-border bg-secondary\/30 p-4 text-center/);
  assert.match(source, /\{t\(m\.validation_panel_description\)\}/);
  assert.match(source, /<FlaskConical class="h-3\.5 w-3\.5" \/>/);
});

test('validation preferences live in Settings rather than the Validation panel header', async () => {
  const panelSource = await readFile(new URL('../shared/explorer-section/validation-explorer-section.svelte', import.meta.url), 'utf8');
  const settingsSource = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  assert.equal(panelSource.includes('validationPreferencesStore'), false);
  assert.match(panelSource, /\$effect\(\(\) => \{/);
  assert.match(panelSource, /validationStore\.autoRun/);
  assert.match(panelSource, /autoRunStartedForProject === projectId/);
  assert.match(panelSource, /void validationStore\.refresh\(\)/);
  assert.match(panelSource, /\{t\(m\.validation_last_run\)\}: \{formatDate\(validationStore\.latestRunAt\)\}/);
  assert.doesNotMatch(panelSource, /validation_summary_counts/);
  assert.match(settingsSource, /settings-validation/);
  assert.match(settingsSource, /validationPreferencesStore\.setStrict/);
  assert.match(settingsSource, /validationPreferencesStore\.setAutoRun/);
  assert.match(settingsSource, /validationPreferencesStore\.setConcurrency/);
  assert.match(settingsSource, /settings_validation_command_preview/);
});

test('validation store getters do not mutate state during render', async () => {
  const source = await readFile(new URL('../../state/validation.svelte.ts', import.meta.url), 'utf8');
  const gettersBlock = source.slice(source.indexOf('export const validationStore = {'), source.indexOf('  reset(projectId?: string | null)'));

  assert.doesNotMatch(gettersBlock, /controller\.syncProject\(\)/);
});

test('validation core exposes item lookup and target summaries for viewer-local status', async () => {
  const source = await readFile(new URL('../../state/validationCore.ts', import.meta.url), 'utf8');

  assert.match(source, /export function findValidationItemByTypeAndName/);
  assert.match(source, /export function deriveValidationTargetSummary/);
  assert.match(source, /export function deriveValidationItemStatus/);
  assert.match(source, /return 'info'/);
  assert.match(source, /state: 'stale'/);
  assert.match(source, /state: state\.error \? 'unknown' : 'not-run'/);
});

test('shared viewer validation status renders labels, last-run metadata, details toggle, and accessibility labels', async () => {
  const source = await readFile(new URL('../shared/ValidationViewerStatus.svelte', import.meta.url), 'utf8');

  assert.match(source, /deriveValidationTargetSummary/);
  assert.match(source, /FIXED_LABELS\.validation\.lastRun/);
  assert.match(source, /FIXED_LABELS\.validation\.viewer\.details/);
  assert.match(source, /FIXED_LABELS\.validation\.viewer\.hideDetails/);
  assert.match(source, /getValidationStatusVisual\(summary\.state\)\.label/);
  assert.match(source, /StatusIndicator state=\{summary\.state\} format="icon-box"/);
  assert.match(source, /role="status"/);
  assert.match(source, /aria-label=\{statusAriaLabel\}/);
  assert.match(source, /aria-label=\{hasDetails \? detailsAriaLabel : statusAriaLabel\}/);
  assert.match(source, /<Collapsible\.Trigger/);
  assert.match(source, /disabled=\{!hasDetails\}/);
  assert.match(source, /summary\.issues as issue/);
});

test('SpecViewer places validation status between metadata and markdown content for the current spec', async () => {
  const source = await readFile(new URL('../../views/SpecViewer.svelte', import.meta.url), 'utf8');

  assert.match(source, /import ValidationViewerStatus from '\$lib\/components\/shared\/ValidationViewerStatus\.svelte';/);
  assert.match(source, /import \{ tick \} from 'svelte';/);
  assert.match(source, /import type \{ SearchNavigationState \} from '\$lib\/state\/search\.svelte\.ts';/);
  assert.match(source, /import \{ tabStore \} from '\$lib\/state\/tabs\.svelte\.ts';/);
  assert.match(source, /import \{ searchStore, SEARCH_MIN_QUERY_LENGTH \} from '\$lib\/state\/search\.svelte\.ts';/);
  assert.match(source, /import \{ uiPreferencesStore \} from '\$lib\/state\/uiPreferences\.svelte\.ts';/);
  assert.match(source, /uiPreferencesStore\.searchHighlightsEnabled && searchStore\.query\.length >= SEARCH_MIN_QUERY_LENGTH/);
  assert.match(source, /searchNavigation\?: SearchNavigationState/);
  assert.match(source, /contentRef\?\.querySelector<HTMLElement>\('mark\.search-highlight'\)/);
  assert.match(source, /firstHighlight\?\.scrollIntoView\(\{ behavior: 'auto', block: 'center' \}\)/);
  assert.match(source, /<\/div>\s*\n\s*<ValidationViewerStatus itemType="spec" itemName=\{specName\} \/>\s*\n\s*\{#if loading\}/);
  assert.match(source, /<MarkdownRenderer content=\{spec\.specContent\} highlightQuery=\{highlightQuery\} \/>/);
});

test('ChangeViewer places validation status between metadata and tabs for the current change', async () => {
  const source = await readFile(new URL('../../views/ChangeViewer.svelte', import.meta.url), 'utf8');
  const underlineTabsSource = await readFile(new URL('../shared/underline-tabs/underline-tabs.svelte', import.meta.url), 'utf8');

  assert.match(source, /import ValidationViewerStatus from '\$lib\/components\/shared\/ValidationViewerStatus\.svelte';/);
  assert.match(source, /import \{ tick, untrack \} from 'svelte';/);
  assert.match(source, /import type \{ SearchNavigationState \} from '\$lib\/state\/search\.svelte\.ts';/);
  assert.match(source, /import \{ searchStore, SEARCH_MIN_QUERY_LENGTH \} from '\$lib\/state\/search\.svelte\.ts';/);
  assert.match(source, /import \{ uiPreferencesStore \} from '\$lib\/state\/uiPreferences\.svelte\.ts';/);
  assert.match(source, /uiPreferencesStore\.searchHighlightsEnabled && searchStore\.query\.length >= SEARCH_MIN_QUERY_LENGTH/);
  assert.match(source, /let activeSearchQuery = \$derived/);
  assert.match(source, /let fileGroupHitCounts = \$derived/);
  assert.match(source, /let specDeltaHitCounts = \$derived/);
  assert.match(source, /const groupIndex = change!\.fileGroups\.indexOf\(group\);/);
  assert.match(source, /hitIndicator: \(fileGroupHitCounts\.get\(groupIndex\) \?\? 0\) > 0/);
  assert.match(source, /matchLocation\?\.specDeltaCapability/);
  assert.match(source, /deltaOpenStates = nextDeltaOpenStates/);
  assert.match(source, /contentRef\?\.querySelector<HTMLElement>\('mark\.search-highlight'\)/);
  assert.match(source, /Badge variant="warning" class="min-w-5 justify-center px-1\.5 py-0 text-\[10px\] leading-5"/);
  assert.match(source, /uiPreferencesStore\.searchHighlightsEnabled && searchStore\.query\.length >= SEARCH_MIN_QUERY_LENGTH/);
  // The archived-check conditional wraps the ValidationViewerStatus, keeping
  // it placed between the header metadata and the tabs.
  assert.match(source, /\{#if !change\.isArchived\}\s*\n\s*<ValidationViewerStatus itemType="change" itemName=\{changeName\} \/>/);
  assert.match(source, /<UnderlineTabs tabs=\{primaryTabs\} activeId=\{activePrimaryTabId\} onSelect=\{handlePrimaryTabSelect\} \/>/);
  assert.match(source, /FIXED_LABELS\.viewer\.specDeltas/);
  assert.match(source, /<MarkdownRenderer content=\{delta\.content\} highlightDiff=\{true\} highlightQuery=\{highlightQuery\} \/>/);
  assert.match(source, /<MarkdownRenderer content=\{activeFile\.content\} highlightQuery=\{highlightQuery\} \/>/);
  assert.match(underlineTabsSource, /import \{ Highlighter \} from '@lucide\/svelte';/);
  assert.match(underlineTabsSource, /hitIndicator\?: boolean/);
  assert.match(underlineTabsSource, /<Highlighter class="h-3 w-3" \/>/);
});

test('Explorer row plumbing supports optional trailing validation icons without changing archive rows', async () => {
  const listItemButtonSource = await readFile(new URL('../shared/explorer-section/explorer-list-item-button.svelte', import.meta.url), 'utf8');
  const explorerItemSource = await readFile(new URL('../shared/explorer-section/explorer-section-item.svelte', import.meta.url), 'utf8');
  const activeChangesSource = await readFile(new URL('../shared/explorer-section/active-changes-explorer-section.svelte', import.meta.url), 'utf8');
  const archiveSource = await readFile(new URL('../shared/explorer-section/archive-explorer-section.svelte', import.meta.url), 'utf8');
  const specsSource = await readFile(new URL('../shared/explorer-section/specs-explorer-section.svelte', import.meta.url), 'utf8');

  assert.match(listItemButtonSource, /import \{ StatusIndicator \} from "\$lib\/components\/shared\/status-indicator";/);
  assert.match(listItemButtonSource, /validationStatus\?: ValidationStatusKind \| null;/);
  assert.match(listItemButtonSource, /\{#if validationStatus\}/);
  assert.match(listItemButtonSource, /<StatusIndicator state=\{validationStatus\} format="minimal" showLabel=\{false\}/);

  assert.match(explorerItemSource, /validationStatus\?: ValidationStatusKind \| null;/);
  assert.match(explorerItemSource, /validationStatus = null/);
  assert.match(explorerItemSource, /\{validationStatus\}/);

  assert.match(activeChangesSource, /import \{ validationStore \} from '\$lib\/state\/validation\.svelte\.ts';/);
  assert.match(activeChangesSource, /deriveValidationListIconState/);
  assert.match(activeChangesSource, /deriveValidationTargetSummary\(validationStore, \{ type: 'change', name \}\)\.state/);
  assert.match(activeChangesSource, /validationStatus=\{validationStatusForChange\(change\.name\)\}/);

  assert.equal(archiveSource.includes('validationStatus='), false);

  assert.match(specsSource, /import \{ validationStore \} from '\$lib\/state\/validation\.svelte\.ts';/);
  assert.match(specsSource, /deriveValidationTargetSummary\(validationStore, \{ type: 'spec', name \}\)\.state/);
  assert.match(specsSource, /validationStatus=\{validationStatusForSpec\(spec\.name\)\}/);
});

test('StatusIndicator minimal format is icon-only and colored for compact explorer rows', async () => {
  const source = await readFile(new URL('../shared/status-indicator/status-indicator.svelte', import.meta.url), 'utf8');
  const minimalBlock = source.match(/\{:else if format === 'minimal'\}([\s\S]*?)\{:else\}/)?.[1] ?? '';

  assert.match(source, /const minimalIconClass = \$derived\.by\(\(\) => \{/);
  assert.match(source, /case 'success':[\s\S]*return 'text-success'/);
  assert.match(source, /case 'info':[\s\S]*return 'text-info'/);
  assert.match(source, /case 'warning':[\s\S]*return 'text-warning'/);
  assert.match(source, /case 'danger':[\s\S]*return 'text-danger'/);
  assert.match(source, /\{:else if format === 'minimal'\}/);
  assert.match(source, /class=\{cn\('inline-flex shrink-0 items-center', className\)\}/);
  assert.match(source, /aria-label=\{displayLabel\}/);
  assert.match(source, /<meta\.icon class=\{cn\(size === 'md' \? 'h-4 w-4' : 'h-3\.5 w-3\.5', 'shrink-0', minimalIconClass\)\} \/>/);
  assert.match(source, /<span class="sr-only">\{displayLabel\}<\/span>/);
  assert.equal(minimalBlock.includes('showLabel'), false);
});

test('Dashboard active-change rows show validationStatus icon when deriver yields a non-null state', async () => {
  const source = await readFile(new URL('../../views/Dashboard.svelte', import.meta.url), 'utf8');

  // The each-block for sortedActiveChanges derives validationStatus and renders
  // a StatusIndicator with format="minimal" when validationStatus is truthy.
  assert.match(source, /import \{ deriveValidationListIconState, deriveValidationTargetSummary \} from/);
  assert.match(source, /function validationStatusForActiveChange\(name: string\)/);
  assert.match(source, /deriveValidationListIconState\([\s\S]*deriveValidationTargetSummary\(validationStore, \{ type: 'change', name \}\)/);
  assert.match(source, /\{#if validationStatus\}\s*\n\s*<StatusIndicator state=\{validationStatus\} format="minimal"/);
});

test('ChangeViewer suppresses ValidationViewerStatus for archived changes', async () => {
  const source = await readFile(new URL('../../views/ChangeViewer.svelte', import.meta.url), 'utf8');

  // The archived check must wrap the ValidationViewerStatus in an {#if !change.isArchived}
  // so that archived changes do not show inline validation status or re-run controls.
  assert.match(source, /\{#if !change\.isArchived\}\s*\n\s*<ValidationViewerStatus itemType="change" itemName=\{changeName\} \/>/);
});

test('ValidationViewerStatus re-run button is disabled while validation is loading and shows a spinner', async () => {
  const source = await readFile(new URL('../shared/ValidationViewerStatus.svelte', import.meta.url), 'utf8');

  // The re-run button must have disabled={validationStore.loading}
  assert.match(source, /disabled=\{validationStore\.loading\}/);
  // When loading, a spinning icon is shown instead of the RotateCcw icon
  assert.match(source, /\{#if validationStore\.loading\}\s*\n\s*<LoaderCircle class="h-3\.5 w-3\.5 animate-spin" \/>/);
  assert.match(source, /\{:else\}\s*\n\s*<RotateCcw class="h-3\.5 w-3\.5" \/>/);
  // The re-run button should call validationStore.refresh() on click
  assert.match(source, /onclick=\{\(\) => validationStore\.refresh\(\)\}/);
  // The aria-label should reflect loading state
  assert.match(source, /FIXED_LABELS\.validation\.viewer\.rerunning/);
  assert.match(source, /FIXED_LABELS\.validation\.viewer\.rerun/);
});
