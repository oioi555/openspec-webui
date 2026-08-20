import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const dialogUrl = new URL('./ToolCompatibilityDialog.svelte', import.meta.url);
const settingsUrl = new URL('./SettingsView.svelte', import.meta.url);
const dialogContentUrl = new URL('../ui/dialog/dialog-content.svelte', import.meta.url);

test('tool reference is an independent accessible two-view dialog', async () => {
  const source = await readFile(dialogUrl, 'utf8');

  assert.match(source, /<Dialog\.Root open=\{open\}/);
  assert.match(source, /onOpenChange=.*onClose/);
  assert.match(source, /aria-label=\{t\(m\.tool_reference_title\)\}/);
  assert.match(source, /aria-label=\{t\(m\.tool_reference_close\)\}/);
  assert.match(source, /<Dialog\.Overlay class="left-12"/);
  assert.match(source, /containerClass="left-12"/);
  assert.match(source, /<Tabs\.Trigger value="official"/);
  assert.match(source, /<Tabs\.Trigger value="shared"/);
  assert.match(source, /type="search"/);
  assert.match(source, /tool_reference_search_clear/);
});

test('shared dialog foundation traps focus, restores the opener, and handles Escape', async () => {
  const source = await readFile(dialogContentUrl, 'utf8');

  assert.match(source, /FOCUSABLE_SELECTOR/);
  assert.match(source, /event\.key !== 'Tab'/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /returnFocus\?\.focus\(\)/);
  assert.match(source, /aria-modal="true"/);
});

test('reference presentation is simplified to sharedSource and responsive rows', async () => {
  const source = await readFile(dialogUrl, 'utf8');

  assert.match(source, /md:grid-cols-/);
  assert.match(source, /max-w-6xl/);
  assert.match(source, /break-all/);
  assert.match(source, /tool_reference_shared_disclaimer/);
  assert.match(source, />\/openspec-\*</);
  assert.match(source, />\$openspec-\*</);
  assert.doesNotMatch(source, /reportedProjectClients|tool_reference_native_consumers/);
  assert.match(source, /tool_reference_not_defined/);
  assert.match(source, /tool_reference_external_client/);
  assert.doesNotMatch(source, /is installed|are installed/);
  // new minimal keys
  assert.match(source, /tool_reference_shared_source/);
  assert.match(source, /tool_reference_shared_updated/);
  assert.match(source, /tool_reference_open_spec_link/);
  assert.match(source, /tool_reference_note/);
  assert.match(source, /reference\.sharedSource\.url/);
  assert.match(source, /reference\.sharedSource\.updatedAt/);
  assert.match(source, /record\.note/);
  // old verbose access-mode detail must be gone
  assert.doesNotMatch(source, /accessModeLabel|accessModeDetail|scopeLabel|evidenceLabel/);
  assert.doesNotMatch(source, /tool_reference_access_mode/);
  assert.doesNotMatch(source, /tool_reference_evidence/);
});

test('Settings opens the static reference without refreshing repository detection', async () => {
  const source = await readFile(settingsUrl, 'utf8');
  const openHandler = source.match(/function openToolReference\(\) \{[\s\S]*?\n  \}/)?.[0] ?? '';

  assert.match(source, /settings_tools_reference_button/);
  assert.match(source, /<ToolCompatibilityDialog/);
  assert.match(source, /getToolCompatibilityReference/);
  assert.match(openHandler, /toolReferenceOpen = true/);
  assert.doesNotMatch(openHandler, /refreshAvailability/);
  assert.doesNotMatch(openHandler, /openspec init/);
});

test('dialog interactions stay isolated from project and command side effects', async () => {
  const source = await readFile(dialogUrl, 'utf8');

  assert.doesNotMatch(source, /refreshAvailability|commandStore|openspec init|writeFile|fetch\(/);
  assert.match(source, /query = event\.currentTarget\.value/);
  assert.match(source, /view = value as ReferenceView/);
  assert.match(source, /!nextOpen && onClose\(\)/);
});
