import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { ChangeSummary, CommandAvailability } from './types/api';
import type { CommandFormat, WorkflowCommand } from './types/commandTypes';
import {
  buildCommand,
  getChangeCommands,
  getWorkspaceCommands,
  type ChangeCommandContext,
  type CommandPreferencesSnapshot,
} from './commandShortcuts';

function createAvailability(
  availableExpandedCommands: CommandAvailability['availableExpandedCommands']
): CommandAvailability {
  return {
    status: 'ready',
    profile: 'test',
    workflows: [],
    availableExpandedCommands,
    error: null,
  };
}

function createPreferences(options: {
  format?: CommandFormat;
  hiddenCommands?: WorkflowCommand[];
  availableExpandedCommands?: CommandAvailability['availableExpandedCommands'];
} = {}): CommandPreferencesSnapshot {
  const commandVisibility: Record<WorkflowCommand, boolean> = {
    propose: true,
    explore: true,
    apply: true,
    archive: true,
    new: true,
    continue: true,
    ff: true,
    verify: true,
    sync: true,
    'bulk-archive': true,
  } satisfies Record<WorkflowCommand, boolean>;

  for (const command of options.hiddenCommands ?? []) {
    commandVisibility[command] = false;
  }

  return {
    format: options.format ?? 'standard',
    commandVisibility,
    availability: createAvailability(
      options.availableExpandedCommands ?? ['new', 'continue', 'ff', 'verify', 'sync', 'bulk-archive']
    ),
  };
}

function createChangeSummary(done: number, total: number): ChangeSummary {
  return {
    name: `change-${done}-${total}`,
    path: `/changes/change-${done}-${total}`,
    isArchived: false,
    archivedDate: null,
    lastModified: null,
    taskProgress: {
      done,
      total,
      percentage: total === 0 ? 0 : (done / total) * 100,
    },
    specDeltaCount: 0,
    hasProposal: true,
    hasDesign: false,
    fileCount: 0,
    groupCount: 0,
    otherFileCount: 0,
  };
}

function createChangeContext(done: number, total: number): ChangeCommandContext {
  return {
    isArchived: false,
    taskProgress: {
      done,
      total,
      percentage: total === 0 ? 0 : (done / total) * 100,
    },
  };
}

test('buildCommand returns skill-style commands for representative workflows', () => {
  assert.equal(buildCommand('sync', 'skill'), '/openspec-sync-specs');
  assert.equal(buildCommand('continue', 'skill', 'change-a'), '/openspec-continue-change change-a');
  assert.equal(buildCommand('bulk-archive', 'skill'), '/openspec-bulk-archive-change');
});

test('getWorkspaceCommands returns representative workspace workflows', () => {
  const preferences = createPreferences();

  assert.deepEqual(
    getWorkspaceCommands([createChangeSummary(1, 2), createChangeSummary(2, 2)], preferences),
    ['propose', 'explore', 'new', 'continue', 'ff', 'bulk-archive'],
  );
});

test('getChangeCommands returns representative change workflows', () => {
  const incompletePreferences = createPreferences();
  const completedPreferences = createPreferences();

  assert.deepEqual(getChangeCommands(createChangeContext(1, 3), incompletePreferences), ['apply', 'continue', 'ff']);
  assert.deepEqual(getChangeCommands(createChangeContext(3, 3), completedPreferences), ['archive', 'verify', 'sync']);
});

test('getChangeCommands respects visibility toggles', () => {
  const incompletePreferences = createPreferences({
    hiddenCommands: ['continue'],
  });
  const completedPreferences = createPreferences({
    hiddenCommands: ['archive', 'sync'],
  });

  assert.deepEqual(getChangeCommands(createChangeContext(1, 3), incompletePreferences), ['apply', 'ff']);
  assert.deepEqual(getChangeCommands(createChangeContext(3, 3), completedPreferences), ['verify']);
});

test('getWorkspaceCommands respects visibility toggles', () => {
  const preferences = createPreferences({
    hiddenCommands: ['explore', 'continue'],
  });

  assert.deepEqual(
    getWorkspaceCommands([createChangeSummary(1, 2), createChangeSummary(2, 2)], preferences),
    ['propose', 'new', 'ff', 'bulk-archive'],
  );
});
