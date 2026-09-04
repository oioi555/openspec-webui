import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { ChangeSummary, CommandAvailability } from './types/api';
import type { WorkflowCommand } from './types/commandTypes';
import {
  dedupeCommandCandidates,
  generateCommandCandidates,
  getChangeCommands,
  getWorkspaceCommands,
  INVOCATION_FORMS,
  type ChangeCommandContext,
  type CommandPreferencesSnapshot,
} from './commandShortcuts';

function createAvailability(workflows: string[]): CommandAvailability {
  return {
    status: 'ready',
    profile: 'test',
    workflows,
    delivery: 'both',
    integrations: [],
    forms: [],
    toolOptions: [],
    error: null,
  };
}

const ALL_WORKFLOWS: WorkflowCommand[] = [
  'propose', 'explore', 'apply', 'archive', 'update', 'new', 'continue', 'ff', 'verify', 'sync', 'bulk-archive',
];

function createPreferences(options: {
  hiddenCommands?: WorkflowCommand[];
  workflows?: string[];
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
    commandVisibility,
    availability: createAvailability(options.workflows ?? ALL_WORKFLOWS),
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

// ---------------------------------------------------------------------------
// Seven official invocation forms
// ---------------------------------------------------------------------------

test('INVOCATION_FORMS declares the official forms with their prefixes', () => {
  assert.deepEqual(
    INVOCATION_FORMS.map((form) => [form.id, form.prefix, form.interpolates]),
    [
      ['opsx-colon', '/opsx:', 'id'],
      ['opsx-dash', '/opsx-', 'id'],
      ['opsx-at', '@opsx-', 'id'],
      ['skill-slash', '/openspec-', 'skill'],
      ['skill-colon', '/skill:openspec-', 'skill'],
      ['skill-dollar', '$openspec-', 'skill'],
      ['skill-prompt', 'use the openspec-', 'skill'],
    ],
  );
});

test('generateCommandCandidates renders all official forms for a workspace workflow', () => {
  const candidates = generateCommandCandidates('propose');

  assert.deepEqual(
    candidates.map((candidate) => candidate.text),
    [
      '/opsx:propose',
      '/opsx-propose',
      '@opsx-propose',
      '/openspec-propose',
      '/skill:openspec-propose',
      '$openspec-propose',
      'use the openspec-propose skill',
    ],
  );
  assert.deepEqual(candidates.map((candidate) => candidate.form), [
    'opsx-colon',
    'opsx-dash',
    'opsx-at',
    'skill-slash',
    'skill-colon',
    'skill-dollar',
    'skill-prompt',
  ]);
});

test('skill-based forms interpolate the skill-name suffix for sync', () => {
  const candidates = generateCommandCandidates('sync');

  assert.deepEqual(
    candidates.map((candidate) => candidate.text),
    [
      '/opsx:sync',
      '/opsx-sync',
      '@opsx-sync',
      '/openspec-sync-specs',
      '/skill:openspec-sync-specs',
      '$openspec-sync-specs',
      'use the openspec-sync-specs skill',
    ],
  );
});

test('skill-based forms interpolate the skill-name suffix for apply', () => {
  const candidates = generateCommandCandidates('apply');

  assert.deepEqual(
    candidates.filter((candidate) => candidate.form.startsWith('skill')).map((candidate) => candidate.text),
    [
      '/openspec-apply-change',
      '/skill:openspec-apply-change',
      '$openspec-apply-change',
      'use the openspec-apply-change skill',
    ],
  );
});

test('change-scoped candidates append the change name', () => {
  const candidates = generateCommandCandidates('apply', { changeName: 'my-change' });

  assert.ok(candidates.every((candidate) => candidate.text.endsWith(' my-change')));
  assert.equal(candidates[0].text, '/opsx:apply my-change');
  assert.equal(candidates[3].text, '/openspec-apply-change my-change');
  assert.equal(candidates[6].text, 'use the openspec-apply-change skill for my-change');
});

test('SourceCraft skill prompts use their natural-language suffix and connector', () => {
  assert.deepEqual(
    generateCommandCandidates('apply', { forms: ['skill-prompt'], changeName: 'add-login' }),
    [{
      form: 'skill-prompt',
      text: 'use the openspec-apply-change skill for add-login',
    }],
  );
  assert.deepEqual(
    generateCommandCandidates('propose', { forms: ['skill-prompt'], changeName: 'ignored' }),
    [{ form: 'skill-prompt', text: 'use the openspec-propose skill' }],
  );
});

test('workspace-scoped candidates never carry a change-name argument', () => {
  const candidates = generateCommandCandidates('propose', { changeName: 'my-change' });

  assert.ok(candidates.every((candidate) => !candidate.text.includes('my-change')));
  assert.equal(candidates[0].text, '/opsx:propose');
});

test('generateCommandCandidates honors a restricted form set and dedupes by output string', () => {
  const candidates = generateCommandCandidates('sync', {
    forms: ['opsx-colon', 'opsx-colon', 'opsx-dash'],
  });

  assert.deepEqual(
    candidates.map((candidate) => candidate.text),
    ['/opsx:sync', '/opsx-sync'],
  );
});

test('dedupeCommandCandidates collapses identical strings into one entry', () => {
  const deduped = dedupeCommandCandidates([
    { form: 'opsx-dash', text: '/opsx-propose' },
    { form: 'opsx-dash', text: '/opsx-propose' },
    { form: 'skill-slash', text: '/openspec-propose' },
  ]);

  assert.deepEqual(
    deduped.map((candidate) => candidate.text),
    ['/opsx-propose', '/openspec-propose'],
  );
});

// ---------------------------------------------------------------------------
// Workspace command row
// ---------------------------------------------------------------------------

test('getWorkspaceCommands returns only workspace-only workflows', () => {
  const preferences = createPreferences();

  assert.deepEqual(
    getWorkspaceCommands([createChangeSummary(1, 2), createChangeSummary(2, 2)], preferences),
    ['propose', 'explore', 'new', 'bulk-archive'],
  );
});

test('getWorkspaceCommands never renders update/continue/ff/apply/verify/sync/archive', () => {
  // All workflows are available and visible, and both incomplete and complete
  // changes exist — yet the workspace row stays workspace-only.
  const preferences = createPreferences();

  const commands = getWorkspaceCommands(
    [createChangeSummary(1, 2), createChangeSummary(2, 2)],
    preferences,
  );

  assert.deepEqual(commands, ['propose', 'explore', 'new', 'bulk-archive']);
  assert.equal(commands.includes('update'), false);
  assert.equal(commands.includes('continue'), false);
  assert.equal(commands.includes('ff'), false);
  assert.equal(commands.includes('apply'), false);
  assert.equal(commands.includes('verify'), false);
  assert.equal(commands.includes('sync'), false);
  assert.equal(commands.includes('archive'), false);
});

test('getWorkspaceCommands gates on the CLI workflows list', () => {
  const preferences = createPreferences({
    workflows: ['propose', 'explore', 'new'],
  });

  assert.deepEqual(
    getWorkspaceCommands([createChangeSummary(1, 2)], preferences),
    ['propose', 'explore', 'new'],
  );
});

test('getWorkspaceCommands hides bulk-archive unless a completed active change exists', () => {
  const preferences = createPreferences();

  assert.deepEqual(
    getWorkspaceCommands([createChangeSummary(1, 2)], preferences),
    ['propose', 'explore', 'new'],
  );
  assert.deepEqual(
    getWorkspaceCommands([createChangeSummary(2, 2)], preferences),
    ['propose', 'explore', 'new', 'bulk-archive'],
  );
});

test('getWorkspaceCommands respects visibility toggles', () => {
  const preferences = createPreferences({ hiddenCommands: ['explore', 'new'] });

  assert.deepEqual(
    getWorkspaceCommands([createChangeSummary(2, 2)], preferences),
    ['propose', 'bulk-archive'],
  );
});

// ---------------------------------------------------------------------------
// Change-scoped command row
// ---------------------------------------------------------------------------

test('getChangeCommands orders incomplete changes apply, update, continue, ff, sync', () => {
  const preferences = createPreferences();

  assert.deepEqual(getChangeCommands(createChangeContext(1, 3), preferences), ['apply', 'update', 'continue', 'ff']);
  assert.deepEqual(getChangeCommands(createChangeContext(1, 3, 2), preferences), ['apply', 'update', 'continue', 'ff', 'sync']);
});

test('getChangeCommands orders completed changes verify, update, sync, archive', () => {
  const preferences = createPreferences();

  assert.deepEqual(getChangeCommands(createChangeContext(3, 3), preferences), ['verify', 'update', 'archive']);
  assert.deepEqual(getChangeCommands(createChangeContext(3, 3, 2), preferences), ['verify', 'update', 'sync', 'archive']);
});

test('update appears in both task states', () => {
  const preferences = createPreferences();

  assert.deepEqual(getChangeCommands(createChangeContext(1, 3), preferences).filter((c) => c === 'update'), ['update']);
  assert.deepEqual(getChangeCommands(createChangeContext(3, 3), preferences).filter((c) => c === 'update'), ['update']);
});

test('sync stays gated on spec-delta presence in both task states', () => {
  const preferences = createPreferences();

  assert.equal(getChangeCommands(createChangeContext(1, 3), preferences).includes('sync'), false);
  assert.equal(getChangeCommands(createChangeContext(3, 3), preferences).includes('sync'), false);
});

test('getChangeCommands gates on the CLI workflows list', () => {
  // `update` and `ff` absent from the CLI workflows list never render.
  const preferences = createPreferences({ workflows: ['apply', 'continue', 'sync'] });

  assert.deepEqual(getChangeCommands(createChangeContext(1, 3, 2), preferences), ['apply', 'continue', 'sync']);

  const completePreferences = createPreferences({ workflows: ['verify', 'archive'] });
  assert.deepEqual(getChangeCommands(createChangeContext(3, 3, 2), completePreferences), ['verify', 'archive']);
});

test('getChangeCommands respects visibility toggles', () => {
  const incompletePreferences = createPreferences({
    hiddenCommands: ['continue', 'update'],
  });
  const completedPreferences = createPreferences({
    hiddenCommands: ['archive', 'sync'],
  });

  assert.deepEqual(getChangeCommands(createChangeContext(1, 3, 2), incompletePreferences), ['apply', 'ff', 'sync']);
  assert.deepEqual(getChangeCommands(createChangeContext(3, 3, 2), completedPreferences), ['verify', 'update']);
});

test('getChangeCommands returns no commands for archived changes', () => {
  const preferences = createPreferences();

  assert.deepEqual(getChangeCommands({ ...createChangeContext(1, 3, 2), isArchived: true }, preferences), []);
});
