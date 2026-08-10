import type { Change, ChangeSummary, CommandAvailability, TaskProgress } from './types/api';
import {
  CORE_COMMANDS,
  type CommandFormat,
  type CoreCommand,
  type ExpandedCommand,
  type WorkflowCommand,
} from './types/commandTypes';

const SKILL_NAMES: Record<WorkflowCommand, string> = {
  propose: 'openspec-propose',
  explore: 'openspec-explore',
  apply: 'openspec-apply-change',
  archive: 'openspec-archive-change',
  verify: 'openspec-verify-change',
  sync: 'openspec-sync-specs',
  new: 'openspec-new-change',
  continue: 'openspec-continue-change',
  ff: 'openspec-ff-change',
  'bulk-archive': 'openspec-bulk-archive-change',
  update: 'openspec-update-change',
};

export interface CommandPreferencesSnapshot {
  format: CommandFormat;
  commandVisibility: Record<WorkflowCommand, boolean>;
  availability: CommandAvailability;
}

export interface ChangeCommandContext {
  isArchived: boolean;
  specDeltaCount: number;
  taskProgress: TaskProgress;
}

export function buildCommand(
  workflow: WorkflowCommand,
  format: CommandFormat,
  changeName?: string
): string {
  if (format === 'skill') {
    const skillName = SKILL_NAMES[workflow];
    return changeName ? `/${skillName} ${changeName}` : `/${skillName}`;
  }

  const prefix = format === 'claude-code' ? '/opsx:' : '/opsx-';
  return changeName ? `${prefix}${workflow} ${changeName}` : `${prefix}${workflow}`;
}

export function isCoreCommand(command: WorkflowCommand): command is CoreCommand {
  return CORE_COMMANDS.includes(command as CoreCommand);
}

export function isExpandedCommandAvailable(
  command: ExpandedCommand,
  availability: CommandAvailability
): boolean {
  return availability.status === 'ready' && availability.availableExpandedCommands.includes(command);
}

export function isExpandedCommandEnabled(
  preferences: CommandPreferencesSnapshot,
  command: ExpandedCommand
): boolean {
  return isExpandedCommandAvailable(command, preferences.availability)
    && preferences.commandVisibility[command];
}

export function isCommandEnabled(
  preferences: CommandPreferencesSnapshot,
  command: WorkflowCommand
): boolean {
  if (isCoreCommand(command)) {
    return preferences.commandVisibility[command];
  }

  return isExpandedCommandEnabled(preferences, command);
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

  if (isCommandEnabled(preferences, 'update')) {
    commands.push('update');
  }

  if (isCommandEnabled(preferences, 'new')) {
    commands.push('new');
  }

  if (activeChanges.some((change) => hasIncompleteTaskProgress(change.taskProgress))) {
    if (isCommandEnabled(preferences, 'continue')) {
      commands.push('continue');
    }

    if (isCommandEnabled(preferences, 'ff')) {
      commands.push('ff');
    }
  }

  if (activeChanges.some((change) => hasCompleteTaskProgress(change.taskProgress))
    && isCommandEnabled(preferences, 'bulk-archive')) {
    commands.push('bulk-archive');
  }

  return commands;
}

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
