export type CommandFormat = 'standard' | 'claude-code' | 'skill';

export const CORE_COMMANDS = ['propose', 'explore', 'apply', 'sync', 'archive', 'update'] as const;
export type CoreCommand = (typeof CORE_COMMANDS)[number];

export const EXPANDED_COMMANDS = ['new', 'continue', 'ff', 'verify', 'bulk-archive'] as const;
export type ExpandedCommand = (typeof EXPANDED_COMMANDS)[number];

export const ALL_COMMANDS = [...CORE_COMMANDS, ...EXPANDED_COMMANDS] as const;
export type WorkflowCommand = (typeof ALL_COMMANDS)[number];

export const CORE_COMMAND_LABELS: Record<CoreCommand, string> = {
  propose: 'Propose',
  explore: 'Explore',
  apply: 'Apply',
  archive: 'Archive',
  sync: 'Sync',
  update: 'Update',
};

export const EXPANDED_COMMAND_LABELS: Record<ExpandedCommand, string> = {
  new: 'New',
  continue: 'Continue',
  ff: 'Fast Forward',
  verify: 'Verify',
  'bulk-archive': 'Bulk Archive',
};
