import type { Change, ChangeSummary, CommandAvailability, TaskProgress } from './types/api';
import {
  INVOCATION_FORM_IDS,
  type InvocationFormId,
  type WorkflowCommand,
} from './types/commandTypes';
import { getWorkflowMetadata } from './workflowMetadata';

export interface CommandPreferencesSnapshot {
  commandVisibility: Record<WorkflowCommand, boolean>;
  availability: CommandAvailability;
}

export interface ChangeCommandContext {
  isArchived: boolean;
  specDeltaCount: number;
  taskProgress: TaskProgress;
}

// ---------------------------------------------------------------------------
// Official invocation forms
// ---------------------------------------------------------------------------

export interface InvocationForm {
  id: InvocationFormId;
  /**
   * Literal prefix written before the interpolated token:
   *   opsx-colon    -> '/opsx:'   (folder-namespaced opsx/<id> command files)
   *   opsx-dash     -> '/opsx-'   (opsx-<id> filename command files)
   *   opsx-at       -> '@opsx-'   (Amazon Q prompts)
   *   skill-slash   -> '/openspec-'
   *   skill-colon   -> '/skill:openspec-'
   *   skill-dollar  -> '$openspec-'
   */
  prefix: string;
  /** Whether the form interpolates the workflow id or the workflow's skill name. */
  interpolates: 'id' | 'skill';
}

export const INVOCATION_FORMS: readonly InvocationForm[] = [
  { id: 'opsx-colon', prefix: '/opsx:', interpolates: 'id' },
  { id: 'opsx-dash', prefix: '/opsx-', interpolates: 'id' },
  { id: 'opsx-at', prefix: '@opsx-', interpolates: 'id' },
  { id: 'skill-slash', prefix: '/openspec-', interpolates: 'skill' },
  { id: 'skill-colon', prefix: '/skill:openspec-', interpolates: 'skill' },
  { id: 'skill-dollar', prefix: '$openspec-', interpolates: 'skill' },
];

export function getInvocationFormById(id: InvocationFormId): InvocationForm | undefined {
  return INVOCATION_FORMS.find((form) => form.id === id);
}

export interface CommandCandidate {
  form: InvocationFormId;
  text: string;
}

/**
 * Resolve the token a skill-based form interpolates. Official generated skill
 * names are spelled `openspec-<suffix>` (e.g. `openspec-sync-specs`), while the
 * official invocation shapes are `/openspec-<skill>`, `/skill:openspec-<skill>`
 * and `$openspec-<skill>` — i.e. they embed the suffix after the leading
 * `openspec-`. Stripping that prefix reproduces the documented invocations
 * (`sync` -> `/openspec-sync-specs`, not `/openspec-openspec-sync-specs`).
 */
function resolveSkillSuffix(workflow: WorkflowCommand): string {
  return getWorkflowMetadata(workflow).skillName.replace(/^openspec-/, '');
}

function resolveFormToken(form: InvocationForm, workflow: WorkflowCommand): string {
  return form.interpolates === 'id' ? workflow : resolveSkillSuffix(workflow);
}

export function dedupeCommandCandidates(candidates: readonly CommandCandidate[]): CommandCandidate[] {
  const seen = new Set<string>();
  const result: CommandCandidate[] = [];

  for (const candidate of candidates) {
    if (seen.has(candidate.text)) {
      continue;
    }

    seen.add(candidate.text);
    result.push(candidate);
  }

  return result;
}

/**
 * Table-driven command-string generation over the six official invocation
 * forms. Workspace-scoped workflows never receive a positional argument;
 * change-scoped workflows append the known change name when one is supplied.
 * Candidates are deduplicated by their output string.
 */
export function generateCommandCandidates(
  workflow: WorkflowCommand,
  options: { changeName?: string; forms?: readonly InvocationFormId[] } = {},
): CommandCandidate[] {
  const { changeName } = options;
  const metadata = getWorkflowMetadata(workflow);
  const argument = metadata.scope === 'change' && changeName ? ` ${changeName}` : '';
  const formIds = options.forms ?? INVOCATION_FORM_IDS;
  const candidates: CommandCandidate[] = [];

  for (const id of formIds) {
    const form = getInvocationFormById(id);

    if (!form) {
      continue;
    }

    candidates.push({
      form: id,
      text: `${form.prefix}${resolveFormToken(form, workflow)}${argument}`,
    });
  }

  return dedupeCommandCandidates(candidates);
}

// ---------------------------------------------------------------------------
// Availability and change/workspace command rows
// ---------------------------------------------------------------------------

/**
 * A command may be surfaced only when its workflow id is present in the
 * CLI-reported `workflows` list (the single source of truth) and its visibility
 * preference is enabled. The core/expanded dichotomy no longer gates display.
 */
function isCommandEnabled(
  preferences: CommandPreferencesSnapshot,
  command: WorkflowCommand
): boolean {
  return preferences.commandVisibility[command]
    && preferences.availability.workflows.includes(command);
}

function hasIncompleteTaskProgress(progress: TaskProgress): boolean {
  return progress.total === 0 || progress.done < progress.total;
}

function hasCompleteTaskProgress(progress: TaskProgress): boolean {
  return progress.total > 0 && progress.done === progress.total;
}

function hasSpecDeltas(change: Change | ChangeSummary | ChangeCommandContext): boolean {
  if ('specDeltaCount' in change) {
    return change.specDeltaCount > 0;
  }

  return change.specDeltas.length > 0;
}

/**
 * Workspace-only command row: `propose`, `explore`, `new`, `bulk-archive`.
 * `update`, `continue`, `ff`, `apply`, `verify`, `sync` and `archive` never
 * render here — each targets a single existing change that the workspace
 * surface cannot name (surface criterion).
 */
export function getWorkspaceCommands(
  activeChanges: ChangeSummary[],
  preferences: CommandPreferencesSnapshot
): WorkflowCommand[] {
  const commands: WorkflowCommand[] = [];

  if (isCommandEnabled(preferences, 'propose')) {
    commands.push('propose');
  }

  if (isCommandEnabled(preferences, 'explore')) {
    commands.push('explore');
  }

  if (isCommandEnabled(preferences, 'new')) {
    commands.push('new');
  }

  if (activeChanges.some((change) => hasCompleteTaskProgress(change.taskProgress))
    && isCommandEnabled(preferences, 'bulk-archive')) {
    commands.push('bulk-archive');
  }

  return commands;
}

/**
 * Change-scoped command row. Incomplete changes order
 * `apply`, `update`, `continue`, `ff`, `sync`; completed changes order
 * `verify`, `update`, `sync`, `archive`. `update` (labeled `Update`) shows
 * in both task states; `sync` stays gated on spec-delta presence in both.
 */
export function getChangeCommands(
  change: Change | ChangeSummary | ChangeCommandContext,
  preferences: CommandPreferencesSnapshot
): WorkflowCommand[] {
  if (change.isArchived) {
    return [];
  }

  if (hasCompleteTaskProgress(change.taskProgress)) {
    const commands: WorkflowCommand[] = [];

    if (isCommandEnabled(preferences, 'verify')) {
      commands.push('verify');
    }

    if (isCommandEnabled(preferences, 'update')) {
      commands.push('update');
    }

    if (hasSpecDeltas(change) && isCommandEnabled(preferences, 'sync')) {
      commands.push('sync');
    }

    if (isCommandEnabled(preferences, 'archive')) {
      commands.push('archive');
    }

    return commands;
  }

  const commands: WorkflowCommand[] = [];

  if (isCommandEnabled(preferences, 'apply')) {
    commands.push('apply');
  }

  if (isCommandEnabled(preferences, 'update')) {
    commands.push('update');
  }

  if (isCommandEnabled(preferences, 'continue')) {
    commands.push('continue');
  }

  if (isCommandEnabled(preferences, 'ff')) {
    commands.push('ff');
  }

  if (hasSpecDeltas(change) && isCommandEnabled(preferences, 'sync')) {
    commands.push('sync');
  }

  return commands;
}
