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
  /** User-facing label; `update` is "Revise Plan", distinct from the CLI `openspec update`. */
  label: string;
  scope: WorkflowScope;
  /** Official OpenSpec generated skill name (e.g. `openspec-sync-specs`). */
  skillName: string;
}

export const WORKSPACE_WORKFLOWS = ['propose', 'explore', 'new', 'bulk-archive'] as const satisfies readonly WorkflowCommand[];
export const CHANGE_WORKFLOWS = ['apply', 'continue', 'ff', 'update', 'verify', 'sync', 'archive'] as const satisfies readonly WorkflowCommand[];

const WORKFLOW_METADATA_BY_ID: Record<WorkflowCommand, WorkflowMetadata> = {
  propose: { id: 'propose', label: 'Propose', scope: 'workspace', skillName: 'openspec-propose' },
  explore: { id: 'explore', label: 'Explore', scope: 'workspace', skillName: 'openspec-explore' },
  apply: { id: 'apply', label: 'Apply', scope: 'change', skillName: 'openspec-apply-change' },
  archive: { id: 'archive', label: 'Archive', scope: 'change', skillName: 'openspec-archive-change' },
  sync: { id: 'sync', label: 'Sync', scope: 'change', skillName: 'openspec-sync-specs' },
  update: { id: 'update', label: 'Revise Plan', scope: 'change', skillName: 'openspec-update-change' },
  new: { id: 'new', label: 'New', scope: 'workspace', skillName: 'openspec-new-change' },
  continue: { id: 'continue', label: 'Continue', scope: 'change', skillName: 'openspec-continue-change' },
  ff: { id: 'ff', label: 'Fast Forward', scope: 'change', skillName: 'openspec-ff-change' },
  verify: { id: 'verify', label: 'Verify', scope: 'change', skillName: 'openspec-verify-change' },
  'bulk-archive': { id: 'bulk-archive', label: 'Bulk Archive', scope: 'workspace', skillName: 'openspec-bulk-archive-change' },
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

export function getWorkflowLabel(workflow: WorkflowCommand): string {
  return WORKFLOW_METADATA_BY_ID[workflow].label;
}

export function getWorkflowScope(workflow: WorkflowCommand): WorkflowScope {
  return WORKFLOW_METADATA_BY_ID[workflow].scope;
}

export function getWorkflowSkillName(workflow: WorkflowCommand): string {
  return WORKFLOW_METADATA_BY_ID[workflow].skillName;
}
