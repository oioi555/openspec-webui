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
    update: true,
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
      options.availableExpandedCommands ?? ['new', 'continue', 'ff', 'verify', 'bulk-archive']
    ),
  };
}

function createChangeSummary(done: number, total: number, specDeltaCount = 0): ChangeSummary {
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
    specDeltaCount,
    hasProposal: true,
    hasDesign: false,
    fileCount: 0,
    groupCount: 0,
    otherFileCount: 0,
  };
}

function createChangeContext(done: number, total: number, specDeltaCount = 0): ChangeCommandContext {
  return {
    isArchived: false,
    specDeltaCount,
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
    ['propose', 'explore', 'update', 'new', 'continue', 'ff', 'bulk-archive'],
  );
});

test('getChangeCommands returns representative change workflows', () => {
  const incompletePreferences = createPreferences();
  const completedPreferences = createPreferences();

  assert.deepEqual(getChangeCommands(createChangeContext(1, 3), incompletePreferences), ['apply', 'continue', 'ff']);
  assert.deepEqual(getChangeCommands(createChangeContext(1, 3, 2), incompletePreferences), ['apply', 'continue', 'ff', 'sync']);
  assert.deepEqual(getChangeCommands(createChangeContext(3, 3), completedPreferences), ['verify', 'archive']);
  assert.deepEqual(getChangeCommands(createChangeContext(3, 3, 2), completedPreferences), ['verify', 'sync', 'archive']);
});

test('getChangeCommands respects visibility toggles', () => {
  const incompletePreferences = createPreferences({
    hiddenCommands: ['continue'],
  });
  const completedPreferences = createPreferences({
    hiddenCommands: ['archive', 'sync'],
  });

  assert.deepEqual(getChangeCommands(createChangeContext(1, 3, 2), incompletePreferences), ['apply', 'ff', 'sync']);
  assert.deepEqual(getChangeCommands(createChangeContext(3, 3, 2), completedPreferences), ['verify']);
});

test('getWorkspaceCommands respects visibility toggles', () => {
  const preferences = createPreferences({
    hiddenCommands: ['explore', 'continue'],
  });

  assert.deepEqual(
    getWorkspaceCommands([createChangeSummary(1, 2), createChangeSummary(2, 2)], preferences),
    ['propose', 'update', 'new', 'ff', 'bulk-archive'],
  );
});
