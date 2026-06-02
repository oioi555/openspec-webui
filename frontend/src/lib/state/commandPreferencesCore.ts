import {
  ALL_COMMANDS,
  type CommandFormat,
  type WorkflowCommand,
} from '../types/commandTypes';

export type { CommandFormat } from '../types/commandTypes';
export type CommandVisibility = Record<WorkflowCommand, boolean>;

const LEGACY_EXPANDED_VISIBILITY_COMMANDS = ['new', 'continue', 'ff', 'verify', 'sync', 'bulk-archive'] as const;

export interface CommandPreferences {
  format: CommandFormat;
  commandVisibility: CommandVisibility;
}

export const COMMAND_PREFERENCES_STORAGE_KEY = 'openspec-command-preferences';

interface CommandPreferencesAdapter {
  get(): CommandPreferences;
  set(preferences: CommandPreferences): void;
}

interface LegacyCommandPreferences {
  aiTool?: unknown;
  expandedVisibility?: unknown;
}

export function createDefaultCommandVisibility(): CommandVisibility {
  return Object.fromEntries(ALL_COMMANDS.map((command) => [command, true])) as CommandVisibility;
}

export function createDefaultCommandPreferences(): CommandPreferences {
  return {
    format: 'standard',
    commandVisibility: createDefaultCommandVisibility(),
  };
}

export function normalizeCommandFormat(value: unknown): CommandFormat {
  if (value === 'default') {
    return 'standard';
  }

  if (value === 'standard' || value === 'claude-code' || value === 'skill') {
    return value;
  }

  return 'standard';
}

export function normalizeCommandVisibility(value: unknown): CommandVisibility {
  const normalized = createDefaultCommandVisibility();

  if (!value || typeof value !== 'object') {
    return normalized;
  }

  const candidate = value as Partial<Record<WorkflowCommand, unknown>>;
  for (const command of ALL_COMMANDS) {
    const commandValue = candidate[command];
    if (typeof commandValue === 'boolean') {
      normalized[command] = commandValue;
    }
  }

  return normalized;
}

function normalizeLegacyExpandedVisibility(value: unknown): CommandVisibility {
  const normalized = createDefaultCommandVisibility();

  if (!value || typeof value !== 'object') {
    return normalized;
  }

  const candidate = value as Partial<Record<WorkflowCommand, unknown>>;
  for (const command of LEGACY_EXPANDED_VISIBILITY_COMMANDS) {
    const commandValue = candidate[command];
    if (typeof commandValue === 'boolean') {
      normalized[command] = commandValue;
    }
  }

  return normalized;
}

export function normalizeCommandPreferences(value: unknown): CommandPreferences {
  const defaults = createDefaultCommandPreferences();

  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const candidate = value as Partial<Record<keyof CommandPreferences, unknown>> & LegacyCommandPreferences;

  return {
    format: candidate.format !== undefined
      ? normalizeCommandFormat(candidate.format)
      : normalizeCommandFormat(candidate.aiTool),
    commandVisibility: candidate.commandVisibility !== undefined
      ? normalizeCommandVisibility(candidate.commandVisibility)
      : normalizeLegacyExpandedVisibility(candidate.expandedVisibility),
  };
}

export function isCommandVisible(commandVisibility: CommandVisibility, command: WorkflowCommand): boolean {
  return commandVisibility[command];
}

export function getVisibleCommands(
  commands: readonly WorkflowCommand[],
  commandVisibility: CommandVisibility,
): WorkflowCommand[] {
  return commands.filter((command) => isCommandVisible(commandVisibility, command));
}

export function loadCommandPreferences(): CommandPreferences {
  if (typeof localStorage === 'undefined') {
    return createDefaultCommandPreferences();
  }

  try {
    const stored = localStorage.getItem(COMMAND_PREFERENCES_STORAGE_KEY);
    if (!stored) {
      return createDefaultCommandPreferences();
    }

    return normalizeCommandPreferences(JSON.parse(stored));
  } catch {
    return createDefaultCommandPreferences();
  }
}

function saveCommandPreferences(preferences: CommandPreferences) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(COMMAND_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore storage errors.
  }
}

export function createCommandPreferencesStoreWithAdapter(adapter: CommandPreferencesAdapter) {
  return {
    get format() {
      return adapter.get().format;
    },

    get commandVisibility() {
      return adapter.get().commandVisibility;
    },

    initialize() {
      adapter.set(loadCommandPreferences());
    },

    setFormat(format: CommandFormat) {
      const nextPreferences = {
        ...adapter.get(),
        format,
      };

      saveCommandPreferences(nextPreferences);
      adapter.set(nextPreferences);
    },

    setCommandVisibility(command: WorkflowCommand, visible: boolean) {
      const nextPreferences = {
        ...adapter.get(),
        commandVisibility: {
          ...adapter.get().commandVisibility,
          [command]: visible,
        },
      };

      saveCommandPreferences(nextPreferences);
      adapter.set(nextPreferences);
    },
  };
}

export function createCommandPreferencesStore() {
  let preferences = loadCommandPreferences();

  return createCommandPreferencesStoreWithAdapter({
    get: () => preferences,
    set: (nextPreferences) => {
      preferences = nextPreferences;
    },
  });
}
