import type { Change, ChangeSummary, CommandAvailability, TaskProgress } from './api';
import type { AiTool, ExpandedCommand, WorkflowCommand } from './commandTypes';

export interface CommandPreferencesSnapshot {
  aiTool: AiTool;
  expandedVisibility: Record<ExpandedCommand, boolean>;
  availability: CommandAvailability;
}

export interface ChangeCommandContext {
  isArchived: boolean;
  taskProgress: TaskProgress;
}

export function buildCommand(
  workflow: WorkflowCommand,
  aiTool: AiTool,
  changeName?: string
): string {
  const prefix = aiTool === 'claude-code' ? '/opsx:' : '/opsx-';
  return changeName ? `${prefix}${workflow} ${changeName}` : `${prefix}${workflow}`;
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
    && preferences.expandedVisibility[command];
}

function hasIncompleteTaskProgress(progress: TaskProgress): boolean {
  return progress.total === 0 || progress.done < progress.total;
}

function hasCompleteTaskProgress(progress: TaskProgress): boolean {
  return progress.total > 0 && progress.done === progress.total;
}

export function getWorkspaceCommands(
  activeChanges: ChangeSummary[],
  preferences: CommandPreferencesSnapshot
): WorkflowCommand[] {
  const commands: WorkflowCommand[] = ['propose', 'explore'];

  if (isExpandedCommandEnabled(preferences, 'new')) {
    commands.push('new');
  }

  if (activeChanges.some((change) => hasIncompleteTaskProgress(change.taskProgress))) {
    if (isExpandedCommandEnabled(preferences, 'continue')) {
      commands.push('continue');
    }

    if (isExpandedCommandEnabled(preferences, 'ff')) {
      commands.push('ff');
    }
  }

  if (activeChanges.some((change) => hasCompleteTaskProgress(change.taskProgress))
    && isExpandedCommandEnabled(preferences, 'bulk-archive')) {
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
    const commands: WorkflowCommand[] = ['archive'];

    if (isExpandedCommandEnabled(preferences, 'verify')) {
      commands.push('verify');
    }

    if (isExpandedCommandEnabled(preferences, 'sync')) {
      commands.push('sync');
    }

    return commands;
  }

  const commands: WorkflowCommand[] = ['apply'];

  if (isExpandedCommandEnabled(preferences, 'continue')) {
    commands.push('continue');
  }

  if (isExpandedCommandEnabled(preferences, 'ff')) {
    commands.push('ff');
  }

  return commands;
}
