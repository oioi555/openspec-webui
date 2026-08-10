import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

// ---------------------------------------------------------------------------
// Source-assertion tests for command types: update inclusion, onboard exclusion.
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

test('update has a label in CORE_COMMAND_LABELS', async () => {
  const source = await commandTypesSource;
  assert.match(source, /update: 'Update'/, 'CORE_COMMAND_LABELS should have update entry');
});

// ---------------------------------------------------------------------------
// 2. onboard is excluded from all command arrays
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

// ---------------------------------------------------------------------------
// 3. update in workspace commands
// ---------------------------------------------------------------------------

test('update is included in SKILL_NAMES', async () => {
  const source = await commandShortcutsSource;
  assert.match(source, /update: 'openspec-update-change'/, 'SKILL_NAMES should map update to openspec-update-change');
});

test('update appears in getWorkspaceCommands alongside propose and explore', async () => {
  const source = await commandShortcutsSource;
  assert.match(
    source,
    /isCommandEnabled\(preferences, 'update'\)[\s\S]*?commands\.push\('update'\)/,
    'getWorkspaceCommands should include update when enabled',
  );
});
