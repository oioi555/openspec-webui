import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ALL_COMMANDS, type WorkflowCommand } from './types/commandTypes';
import {
  CHANGE_WORKFLOWS,
  getWorkflowCommandDescription,
  getWorkflowLabel,
  getWorkflowMetadata,
  getWorkflowScope,
  getWorkflowSkillName,
  WORKFLOW_METADATA,
  WORKFLOW_METADATA_LIST,
  WORKSPACE_WORKFLOWS,
  type WorkflowMetadata,
} from './workflowMetadata';

const OFFICIAL_SKILL_NAMES: Record<WorkflowCommand, string> = {
  propose: 'openspec-propose',
  explore: 'openspec-explore',
  apply: 'openspec-apply-change',
  archive: 'openspec-archive-change',
  sync: 'openspec-sync-specs',
  update: 'openspec-update-change',
  new: 'openspec-new-change',
  continue: 'openspec-continue-change',
  ff: 'openspec-ff-change',
  verify: 'openspec-verify-change',
  'bulk-archive': 'openspec-bulk-archive-change',
};

const EXPECTED_DESCRIPTION_MESSAGE_IDS: Record<WorkflowCommand, string> = {
  propose: 'settings_command_desc_propose',
  explore: 'settings_command_desc_explore',
  apply: 'settings_command_desc_apply',
  archive: 'settings_command_desc_archive',
  sync: 'settings_command_desc_sync',
  update: 'settings_command_desc_update',
  new: 'settings_command_desc_new',
  continue: 'settings_command_desc_continue',
  ff: 'settings_command_desc_ff',
  verify: 'settings_command_desc_verify',
  'bulk-archive': 'settings_command_desc_bulk_archive',
};

/** message ids use the command id with `-` translated to `_` (e.g. `bulk-archive` -> `settings_command_desc_bulk_archive`). */
function expectedDescriptionMessageId(workflow: WorkflowCommand): string {
  return `settings_command_desc_${workflow.replaceAll('-', '_')}`;
}

test('workflow metadata is complete for every surfaced workflow', () => {
  assert.deepEqual(Object.keys(WORKFLOW_METADATA).sort(), [...ALL_COMMANDS].sort());
  assert.equal(WORKFLOW_METADATA_LIST.length, ALL_COMMANDS.length);

  for (const workflow of ALL_COMMANDS) {
    const metadata: WorkflowMetadata = WORKFLOW_METADATA[workflow];
    assert.equal(metadata.id, workflow);
    assert.equal(typeof metadata.label, 'string');
    assert.ok(metadata.label.length > 0, `${workflow} should have a non-empty label`);
    assert.ok(metadata.scope === 'workspace' || metadata.scope === 'change');
    assert.match(metadata.skillName, /^openspec-/);
  }
});

test('workspace scope set is exactly propose, explore, new, bulk-archive', () => {
  const workspaceWorkflows = ALL_COMMANDS.filter((workflow) => getWorkflowScope(workflow) === 'workspace');

  assert.deepEqual([...workspaceWorkflows].sort(), [...WORKSPACE_WORKFLOWS].sort());
  assert.deepEqual([...WORKSPACE_WORKFLOWS], ['propose', 'explore', 'new', 'bulk-archive']);
});

test('change scope set is exactly apply, continue, ff, update, verify, sync, archive', () => {
  const changeWorkflows = ALL_COMMANDS.filter((workflow) => getWorkflowScope(workflow) === 'change');

  assert.deepEqual([...changeWorkflows].sort(), [...CHANGE_WORKFLOWS].sort());
  assert.deepEqual([...CHANGE_WORKFLOWS], ['apply', 'continue', 'ff', 'update', 'verify', 'sync', 'archive']);
});

test('update is change-scoped with the official skill name and Update label', () => {
  const metadata = getWorkflowMetadata('update');

  assert.equal(metadata.scope, 'change');
  assert.equal(metadata.skillName, 'openspec-update-change');
  assert.equal(metadata.label, 'Update');
  assert.equal(getWorkflowLabel('update'), 'Update');
  assert.equal(getWorkflowSkillName('update'), 'openspec-update-change');
});

test('skill names match the official generated skill name list', () => {
  for (const workflow of ALL_COMMANDS) {
    assert.equal(getWorkflowSkillName(workflow), OFFICIAL_SKILL_NAMES[workflow]);
  }
});

test('sync resolves to openspec-sync-specs', () => {
  assert.equal(getWorkflowSkillName('sync'), 'openspec-sync-specs');
  assert.notEqual(getWorkflowSkillName('sync'), 'openspec-sync');
});

test('bulk-archive stays workspace scope with no multi-change scope', () => {
  const metadata = getWorkflowMetadata('bulk-archive');

  assert.equal(metadata.scope, 'workspace');
  assert.equal(getWorkflowScope('bulk-archive'), 'workspace');
});

test('onboard is absent from workflow metadata', () => {
  const metadataKeys = Object.keys(WORKFLOW_METADATA) as string[];
  const listIds = WORKFLOW_METADATA_LIST.map((metadata) => metadata.id);

  assert.equal(metadataKeys.includes('onboard'), false);
  assert.equal(listIds.includes('onboard' as WorkflowCommand), false);
  assert.equal((WORKFLOW_METADATA as Partial<Record<string, WorkflowMetadata>>).onboard, undefined);
});

test('every workflow carries a non-empty descriptionMessageId in the settings_command_desc_ namespace', () => {
  for (const workflow of ALL_COMMANDS) {
    const metadata: WorkflowMetadata = WORKFLOW_METADATA[workflow];
    const messageId = metadata.descriptionMessageId;

    assert.ok(messageId, `${workflow} should have a non-empty descriptionMessageId`);
    assert.match(messageId!, /^settings_command_desc_/, `${workflow} message id should use the settings_command_desc_ namespace`);
    assert.equal(messageId, expectedDescriptionMessageId(workflow));
    assert.equal(messageId, EXPECTED_DESCRIPTION_MESSAGE_IDS[workflow]);
  }
});

test('getWorkflowCommandDescription returns the pinned description message id for every workflow', () => {
  for (const workflow of ALL_COMMANDS) {
    assert.equal(getWorkflowCommandDescription(workflow), EXPECTED_DESCRIPTION_MESSAGE_IDS[workflow]);
    assert.equal(getWorkflowCommandDescription(workflow), expectedDescriptionMessageId(workflow));
  }
});
