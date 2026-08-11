import * as m from './paraglide/messages.js';
import { ALL_COMMANDS, type WorkflowCommand } from './types/commandTypes';

/**
 * Centralized OpenSpec workflow metadata.
 *
 * Single source of truth for every workflow surfaced in command generation,
 * copy-time candidate menus, and the Settings Tools documentation. Replaces the
 * former split across `SKILL_NAMES` (commandShortcuts.ts), `CORE_COMMAND_LABELS`
 * / `EXPANDED_COMMAND_LABELS` (commandTypes.ts), and the uiText label lookup.
 *
 * Scope classification follows the surface criterion: whether the WebUI can
 * identify the command's target from the copy surface. Workspace-only commands
 * are reachable without naming a change; change-only commands target a single
 * existing change that a Change surface names.
 *
 * Skill names are the official OpenSpec "Generated Skill Names"
 * (docs/supported-tools.md) — e.g. `sync` -> `openspec-sync-specs`,
 * `apply` -> `openspec-apply-change`, `update` -> `openspec-update-change`.
 * The mapping is irregular and defined upstream, so it is pinned here, not
 * derived. The blocked setup workflow is excluded by policy and has no
 * entry in this module.
 */
export type WorkflowScope = 'workspace' | 'change';

export interface WorkflowMetadata {
  id: WorkflowCommand;
  /**
   * Paraglide message id for the user-facing workflow label
   * (e.g. `workflow_label_propose`).
   */
  labelMessageId: keyof typeof m;
  scope: WorkflowScope;
  /** Official OpenSpec generated skill name (e.g. `openspec-sync-specs`). */
  skillName: string;
  /**
   * Paraglide message id for the one-line command description shown in the
   * Settings Commands section (e.g. `settings_command_desc_propose`).
   *
   * Typed against the generated paraglide message-id union so a stale or
   * misspelled key fails the typecheck; the `settings_command_desc_*` keys
   * live in `frontend/messages/*.json` and are regenerated into
   * `frontend/src/lib/paraglide/` by `compileI18n()`.
   */
  descriptionMessageId?: keyof typeof m;
}

export const WORKSPACE_WORKFLOWS = ['propose', 'explore', 'new', 'bulk-archive'] as const satisfies readonly WorkflowCommand[];
export const CHANGE_WORKFLOWS = ['apply', 'continue', 'ff', 'update', 'verify', 'sync', 'archive'] as const satisfies readonly WorkflowCommand[];

const WORKFLOW_METADATA_BY_ID: Record<WorkflowCommand, WorkflowMetadata> = {
  propose: { id: 'propose', labelMessageId: 'workflow_label_propose', scope: 'workspace', skillName: 'openspec-propose', descriptionMessageId: 'settings_command_desc_propose' },
  explore: { id: 'explore', labelMessageId: 'workflow_label_explore', scope: 'workspace', skillName: 'openspec-explore', descriptionMessageId: 'settings_command_desc_explore' },
  apply: { id: 'apply', labelMessageId: 'workflow_label_apply', scope: 'change', skillName: 'openspec-apply-change', descriptionMessageId: 'settings_command_desc_apply' },
  archive: { id: 'archive', labelMessageId: 'workflow_label_archive', scope: 'change', skillName: 'openspec-archive-change', descriptionMessageId: 'settings_command_desc_archive' },
  sync: { id: 'sync', labelMessageId: 'workflow_label_sync', scope: 'change', skillName: 'openspec-sync-specs', descriptionMessageId: 'settings_command_desc_sync' },
  update: { id: 'update', labelMessageId: 'workflow_label_update', scope: 'change', skillName: 'openspec-update-change', descriptionMessageId: 'settings_command_desc_update' },
  new: { id: 'new', labelMessageId: 'workflow_label_new', scope: 'workspace', skillName: 'openspec-new-change', descriptionMessageId: 'settings_command_desc_new' },
  continue: { id: 'continue', labelMessageId: 'workflow_label_continue', scope: 'change', skillName: 'openspec-continue-change', descriptionMessageId: 'settings_command_desc_continue' },
  ff: { id: 'ff', labelMessageId: 'workflow_label_ff', scope: 'change', skillName: 'openspec-ff-change', descriptionMessageId: 'settings_command_desc_ff' },
  verify: { id: 'verify', labelMessageId: 'workflow_label_verify', scope: 'change', skillName: 'openspec-verify-change', descriptionMessageId: 'settings_command_desc_verify' },
  'bulk-archive': { id: 'bulk-archive', labelMessageId: 'workflow_label_bulk_archive', scope: 'workspace', skillName: 'openspec-bulk-archive-change', descriptionMessageId: 'settings_command_desc_bulk_archive' },
};

/** Every surfaced workflow, keyed by workflow id. There is intentionally no entry for the blocked setup workflow. */
export const WORKFLOW_METADATA: Record<WorkflowCommand, WorkflowMetadata> = WORKFLOW_METADATA_BY_ID;

/** All surfaced workflows as an ordered array (core profile first, then expanded). */
export const WORKFLOW_METADATA_LIST: readonly WorkflowMetadata[] = ALL_COMMANDS.map(
  (command) => WORKFLOW_METADATA_BY_ID[command],
);

export function getWorkflowMetadata(workflow: WorkflowCommand): WorkflowMetadata {
  return WORKFLOW_METADATA_BY_ID[workflow];
}

/**
 * Resolved label for the workflow in the current locale.
 * Uses the paraglide message function for the label message id.
 */
export function getWorkflowLabel(workflow: WorkflowCommand): string {
  const messageFn = (m as unknown as Record<string, () => string>)[WORKFLOW_METADATA_BY_ID[workflow].labelMessageId];
  return messageFn ? messageFn() : workflow;
}

export function getWorkflowScope(workflow: WorkflowCommand): WorkflowScope {
  return WORKFLOW_METADATA_BY_ID[workflow].scope;
}

export function getWorkflowSkillName(workflow: WorkflowCommand): string {
  return WORKFLOW_METADATA_BY_ID[workflow].skillName;
}

/**
 * Paraglide message id for the workflow's one-line description, or undefined
 * when the metadata carries no description.
 */
export function getWorkflowDescriptionMessageId(workflow: WorkflowCommand): keyof typeof m | undefined {
  return WORKFLOW_METADATA_BY_ID[workflow].descriptionMessageId;
}
