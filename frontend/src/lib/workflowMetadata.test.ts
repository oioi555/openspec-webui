import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';

import { ALL_COMMANDS, type WorkflowCommand } from './types/commandTypes';
import {
  CHANGE_WORKFLOWS,
  getWorkflowDescriptionMessageId,
  getWorkflowLabel,
  getWorkflowMetadata,
  getWorkflowScope,
  getWorkflowSkillName,
  WORKFLOW_METADATA,
  WORKFLOW_METADATA_LIST,
  WORKSPACE_WORKFLOWS,
  type WorkflowMetadata,
} from './workflowMetadata';
import { getWorkflowCommandDescription } from './uiText';
import { getLocale, overwriteGetLocale } from './paraglide/runtime.js';

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

const EXPECTED_LABEL_MESSAGE_IDS: Record<WorkflowCommand, string> = {
  propose: 'workflow_label_propose',
  explore: 'workflow_label_explore',
  apply: 'workflow_label_apply',
  archive: 'workflow_label_archive',
  sync: 'workflow_label_sync',
  update: 'workflow_label_update',
  new: 'workflow_label_new',
  continue: 'workflow_label_continue',
  ff: 'workflow_label_ff',
  verify: 'workflow_label_verify',
  'bulk-archive': 'workflow_label_bulk_archive',
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
    assert.equal(typeof metadata.labelMessageId, 'string');
    assert.ok(metadata.labelMessageId.length > 0, `${workflow} should have a non-empty labelMessageId`);
    assert.match(metadata.labelMessageId, /^workflow_label_/, `${workflow} labelMessageId should use the workflow_label_ namespace`);
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
  assert.equal(metadata.labelMessageId, 'workflow_label_update');
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

test('getWorkflowDescriptionMessageId returns the pinned description message id for every workflow', () => {
  for (const workflow of ALL_COMMANDS) {
    assert.equal(getWorkflowDescriptionMessageId(workflow), EXPECTED_DESCRIPTION_MESSAGE_IDS[workflow]);
    assert.equal(getWorkflowDescriptionMessageId(workflow), expectedDescriptionMessageId(workflow));
  }
});

test('every workflow carries a labelMessageId matching expected workflow_label_ keys', () => {
  for (const workflow of ALL_COMMANDS) {
    const metadata = getWorkflowMetadata(workflow);
    assert.equal(metadata.labelMessageId, EXPECTED_LABEL_MESSAGE_IDS[workflow]);
  }
});

test('getWorkflowLabel resolves to non-empty string for every workflow', () => {
  for (const workflow of ALL_COMMANDS) {
    const label = getWorkflowLabel(workflow);
    assert.ok(typeof label === 'string' && label.length > 0, `${workflow}: label should be non-empty`);
  }
});

// ---------------------------------------------------------------------------
// Locale-aware label/description resolution (2.4)
// ---------------------------------------------------------------------------

/**
 * Paraglide runtime locales are driveable in node tests via the exported
 * `getLocale` override; the original resolver is captured here and restored in
 * `afterEach` so the override never leaks into other test files in this
 * process.
 */
const ORIGINAL_GET_LOCALE = getLocale;

async function readSourceCatalog(locale: string): Promise<Record<string, string>> {
  const content = await readFile(new URL(`../../messages/${locale}.json`, import.meta.url), 'utf8');
  return JSON.parse(content) as Record<string, string>;
}

async function readSupportedLocales(): Promise<string[]> {
  const content = await readFile(
    new URL('../../project.inlang/settings.json', import.meta.url),
    'utf8',
  );
  return (JSON.parse(content) as { locales: string[] }).locales;
}

afterEach(() => {
  overwriteGetLocale(ORIGINAL_GET_LOCALE);
});

test('every workflow label and description message exists and is non-empty in every source catalog', async () => {
  const locales = await readSupportedLocales();

  for (const locale of locales) {
    const catalog = await readSourceCatalog(locale);

    for (const workflow of ALL_COMMANDS) {
      const metadata = getWorkflowMetadata(workflow);
      const labelValue = catalog[metadata.labelMessageId];
      assert.equal(typeof labelValue, 'string', `${locale}: missing label ${metadata.labelMessageId} for ${workflow}`);
      assert.notEqual(labelValue!.trim(), '', `${locale}: empty label ${metadata.labelMessageId} for ${workflow}`);

      const descriptionMessageId = getWorkflowDescriptionMessageId(workflow);
      assert.ok(descriptionMessageId, `${workflow} must have a descriptionMessageId`);
      const descriptionValue = catalog[descriptionMessageId!];
      assert.equal(typeof descriptionValue, 'string', `${locale}: missing description ${descriptionMessageId} for ${workflow}`);
      assert.notEqual(descriptionValue!.trim(), '', `${locale}: empty description ${descriptionMessageId} for ${workflow}`);
    }
  }
});

test('resolved workflow labels follow the active locale across en -> ja -> de', () => {
  const workflows: WorkflowCommand[] = ['propose', 'sync', 'update'];

  overwriteGetLocale(() => 'en');
  const enLabels = workflows.map((workflow) => getWorkflowLabel(workflow));

  overwriteGetLocale(() => 'ja');
  const jaLabels = workflows.map((workflow) => getWorkflowLabel(workflow));

  overwriteGetLocale(() => 'de');
  const deLabels = workflows.map((workflow) => getWorkflowLabel(workflow));

  for (let index = 0; index < workflows.length; index += 1) {
    const workflow = workflows[index]!;
    assert.ok(enLabels[index]!.length > 0, `${workflow}: en label should be non-empty`);
    assert.ok(jaLabels[index]!.length > 0, `${workflow}: ja label should be non-empty`);
    assert.ok(deLabels[index]!.length > 0, `${workflow}: de label should be non-empty`);
    assert.notEqual(jaLabels[index], enLabels[index], `${workflow}: ja label must differ from en`);
    assert.notEqual(deLabels[index], enLabels[index], `${workflow}: de label must differ from en`);
  }
});

test('resolved workflow descriptions follow the active locale through the canonical accessor', () => {
  const workflows: WorkflowCommand[] = ['propose', 'sync', 'update'];

  // `getWorkflowCommandDescription` is the canonical resolved-text accessor:
  // it resolves the metadata `descriptionMessageId` through the active locale.
  overwriteGetLocale(() => 'en');
  const enDescriptions = workflows.map((workflow) => getWorkflowCommandDescription(workflow));

  overwriteGetLocale(() => 'ja');
  const jaDescriptions = workflows.map((workflow) => getWorkflowCommandDescription(workflow));

  overwriteGetLocale(() => 'de');
  const deDescriptions = workflows.map((workflow) => getWorkflowCommandDescription(workflow));

  for (let index = 0; index < workflows.length; index += 1) {
    const workflow = workflows[index]!;
    assert.ok(enDescriptions[index]!.length > 0, `${workflow}: en description should be non-empty`);
    assert.ok(jaDescriptions[index]!.length > 0, `${workflow}: ja description should be non-empty`);
    assert.ok(deDescriptions[index]!.length > 0, `${workflow}: de description should be non-empty`);
    assert.notEqual(jaDescriptions[index], enDescriptions[index], `${workflow}: ja description must differ from en`);
    assert.notEqual(deDescriptions[index], enDescriptions[index], `${workflow}: de description must differ from en`);
  }
});
