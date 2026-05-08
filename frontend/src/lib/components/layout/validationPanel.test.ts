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

  assert.match(source, /ItemContextMenu/);
  assert.match(source, /validationStore\.openItem/);
  assert.match(source, /copyToClipboard\(item\.name, t\(m\.copy_label_validation_item_name\)\)/);
  assert.match(source, /searchStore\.open\(item\.name\)/);
  assert.match(source, /t\(m\.validation_non_navigable\)/);
  assert.match(source, /t\(m\.validation_run\)/);
  assert.match(storeSource, /tabStore\.openConfirmed/);
  assert.match(storeSource, /tabStore\.openPreview/);
  assert.match(storeSource, /item\.type !== 'spec' && item\.type !== 'change'/);
});

test('validation panel text is localized through Paraglide messages', async () => {
  const source = await readFile(new URL('../shared/explorer-section/validation-explorer-section.svelte', import.meta.url), 'utf8');
  const messages = await readFile(new URL('../../../../messages/ja.json', import.meta.url), 'utf8');

  assert.match(source, /t\(m\.validation_panel_title\)/);
  assert.match(source, /t\(m\.validation_passed_count/);
  assert.match(source, /t\(m\.validation_failed_count/);
  assert.match(source, /t\(m\.validation_total_count/);
  assert.match(messages, /"validation_panel_title"/);
  assert.match(messages, /"copy_label_validation_item_name"/);
});

test('validation preferences live in Settings rather than the Validation panel header', async () => {
  const panelSource = await readFile(new URL('../shared/explorer-section/validation-explorer-section.svelte', import.meta.url), 'utf8');
  const settingsSource = await readFile(new URL('./SettingsView.svelte', import.meta.url), 'utf8');

  assert.equal(panelSource.includes('validationPreferencesStore'), false);
  assert.equal(panelSource.includes('settings-validation'), false);
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
  assert.match(source, /hasWarningsOnly \? 'warning' : 'passed'/);
  assert.match(source, /state: 'stale'/);
  assert.match(source, /state: state\.error \? 'unknown' : 'not-run'/);
});

test('shared viewer validation status renders labels, last-run metadata, details toggle, and accessibility labels', async () => {
  const source = await readFile(new URL('../shared/ValidationViewerStatus.svelte', import.meta.url), 'utf8');

  assert.match(source, /deriveValidationTargetSummary/);
  assert.match(source, /FIXED_LABELS\.validation\.lastRun/);
  assert.match(source, /FIXED_LABELS\.validation\.viewer\.details/);
  assert.match(source, /FIXED_LABELS\.validation\.viewer\.hideDetails/);
  assert.match(source, /FIXED_LABELS\.validation\.viewer\.labels\.warning/);
  assert.match(source, /case 'stale':\s*\n\s*case 'not-run':\s*\n\s*return 'secondary'/);
  assert.match(source, /case 'stale':\s*\n\s*case 'not-run':\s*\n\s*return 'muted'/);
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
  assert.match(source, /<\/div>\s*\n\s*<ValidationViewerStatus itemType="spec" itemName=\{specName\} \/>\s*\n\s*\{#if loading\}/);
  assert.match(source, /<MarkdownRenderer content=\{spec\.specContent\} \/>/);
});

test('ChangeViewer places validation status between metadata and tabs for the current change', async () => {
  const source = await readFile(new URL('../../views/ChangeViewer.svelte', import.meta.url), 'utf8');

  assert.match(source, /import ValidationViewerStatus from '\$lib\/components\/shared\/ValidationViewerStatus\.svelte';/);
  assert.match(source, /<\/div>\s*\n\s*<ValidationViewerStatus itemType="change" itemName=\{changeName\} \/>\s*\n\s*\{#if loading\}/);
  assert.match(source, /<UnderlineTabs tabs=\{primaryTabs\} activeId=\{activePrimaryTabId\} onSelect=\{handlePrimaryTabSelect\} \/>/);
  assert.match(source, /FIXED_LABELS\.viewer\.specDeltas/);
});
