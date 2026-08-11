import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

// ---------------------------------------------------------------------------
// Source-assertion tests for command types: update/core grouping, six official
// invocation forms, onboard exclusion, and format-preference retirement.
// ---------------------------------------------------------------------------

const commandTypesSource = readFile(
  new URL('./types/commandTypes.ts', import.meta.url),
  'utf8',
);

const commandShortcutsSource = readFile(
  new URL('./commandShortcuts.ts', import.meta.url),
  'utf8',
);

const commandPreferencesCoreSource = readFile(
  new URL('./state/commandPreferencesCore.ts', import.meta.url),
  'utf8',
);

const workflowMetadataSource = readFile(
  new URL('./workflowMetadata.ts', import.meta.url),
  'utf8',
);

// ---------------------------------------------------------------------------
// 1. update is a core command
// ---------------------------------------------------------------------------

test('update is included in CORE_COMMANDS', async () => {
  const source = await commandTypesSource;
  assert.match(source, /'update'/, 'CORE_COMMANDS should include update');
  assert.match(
    source,
    /CORE_COMMANDS = \[.*'update'.*\]/,
    'update should be in the CORE_COMMANDS array',
  );
});

// ---------------------------------------------------------------------------
// 2. onboard is excluded from all command arrays and metadata
// ---------------------------------------------------------------------------

test('onboard is not in CORE_COMMANDS or EXPANDED_COMMANDS', async () => {
  const source = await commandTypesSource;
  assert.doesNotMatch(source, /'onboard'/, 'onboard should not appear in any command array');
});

test('onboard is not referenced in commandShortcuts', async () => {
  const source = await commandShortcutsSource;
  assert.doesNotMatch(source, /onboard/, 'onboard should not appear in commandShortcuts');
});

test('onboard is not referenced in commandPreferencesCore', async () => {
  const source = await commandPreferencesCoreSource;
  assert.doesNotMatch(source, /onboard/, 'onboard should not appear in commandPreferencesCore');
});

test('onboard is not referenced in workflowMetadata', async () => {
  const source = await workflowMetadataSource;
  assert.doesNotMatch(source, /onboard/, 'onboard should not appear in workflowMetadata');
});

// ---------------------------------------------------------------------------
// 3. Six official invocation forms are declared
// ---------------------------------------------------------------------------

test('INVOCATION_FORM_IDS declares exactly the six official forms', async () => {
  const source = await commandTypesSource;
  assert.match(source, /INVOCATION_FORM_IDS/);
  assert.match(source, /'opsx-colon'/);
  assert.match(source, /'opsx-dash'/);
  assert.match(source, /'opsx-at'/);
  assert.match(source, /'skill-slash'/);
  assert.match(source, /'skill-colon'/);
  assert.match(source, /'skill-dollar'/);
});

test('INVOCATION_FORMS defines the six official prefixes', async () => {
  const source = await commandShortcutsSource;
  assert.match(source, /prefix: '\/opsx:'/);
  assert.match(source, /prefix: '\/opsx-'/);
  assert.match(source, /prefix: '@opsx-'/);
  assert.match(source, /prefix: '\/openspec-'/);
  assert.match(source, /prefix: '\/skill:openspec-'/);
  assert.match(source, /prefix: '\$openspec-'/);
});

// ---------------------------------------------------------------------------
// 4. CommandFormat and the persisted format preference are retired
// ---------------------------------------------------------------------------

test('CommandFormat is no longer exported from commandTypes', async () => {
  const source = await commandTypesSource;
  assert.doesNotMatch(source, /CommandFormat/, 'CommandFormat type should be removed');
});

test('commandPreferencesCore no longer normalizes or stores a format', async () => {
  const source = await commandPreferencesCoreSource;
  assert.doesNotMatch(source, /normalizeCommandFormat/);
  assert.doesNotMatch(source, /setFormat/);
  assert.doesNotMatch(source, /format:/);
});

test('commandShortcuts no longer builds commands from a format preference', async () => {
  const source = await commandShortcutsSource;
  assert.doesNotMatch(source, /buildCommand\(/);
  assert.doesNotMatch(source, /CommandFormat/);
  assert.doesNotMatch(source, /SKILL_NAMES/);
});

// ---------------------------------------------------------------------------
// 5. Labels live in the centralized workflow metadata
// ---------------------------------------------------------------------------

test('workflowMetadata centralizes labels including Update for update', async () => {
  const source = await workflowMetadataSource;
  assert.match(source, /update: \{ id: 'update', labelMessageId: 'workflow_label_update'/);
  assert.match(source, /sync: \{ id: 'sync', labelMessageId: 'workflow_label_sync'/);
  assert.doesNotMatch(source, /multi-change/);
});

test('workflowMetadata pins the official skill names', async () => {
  const source = await workflowMetadataSource;
  assert.match(source, /skillName: 'openspec-sync-specs'/);
  assert.match(source, /skillName: 'openspec-apply-change'/);
  assert.match(source, /skillName: 'openspec-update-change'/);
});
