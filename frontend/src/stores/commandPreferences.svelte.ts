import { getCommandAvailability, type CommandAvailability } from '../lib/api';
import { EXPANDED_COMMANDS, type AiTool, type ExpandedCommand } from '../lib/commandTypes';

const STORAGE_KEY = 'openspec-command-preferences';

type ExpandedVisibility = Record<ExpandedCommand, boolean>;

export interface CommandPreferencesState {
  initialized: boolean;
  availabilityLoading: boolean;
  aiTool: AiTool;
  expandedVisibility: ExpandedVisibility;
  availability: CommandAvailability;
}

const defaultAvailability: CommandAvailability = {
  status: 'unavailable',
  profile: null,
  workflows: [],
  availableExpandedCommands: [],
  error: null,
};

function createDefaultExpandedVisibility(): ExpandedVisibility {
  return {
    new: true,
    continue: true,
    ff: true,
    verify: true,
    sync: true,
    'bulk-archive': true,
  };
}

function isAiTool(value: unknown): value is AiTool {
  return value === 'default' || value === 'claude-code';
}

function normalizeExpandedVisibility(value: unknown): ExpandedVisibility {
  const normalized = createDefaultExpandedVisibility();

  if (!value || typeof value !== 'object') {
    return normalized;
  }

  const candidate = value as Partial<Record<ExpandedCommand, unknown>>;
  for (const command of EXPANDED_COMMANDS) {
    const commandValue = candidate[command];
    if (typeof commandValue === 'boolean') {
      normalized[command] = commandValue;
    }
  }

  return normalized;
}

function loadPreferences(): Pick<CommandPreferencesState, 'aiTool' | 'expandedVisibility'> {
  const defaults = {
    aiTool: 'default' as AiTool,
    expandedVisibility: createDefaultExpandedVisibility(),
  };

  if (typeof localStorage === 'undefined') {
    return defaults;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaults;
    }

    const parsed = JSON.parse(stored) as {
      aiTool?: unknown;
      expandedVisibility?: unknown;
    };

    return {
      aiTool: isAiTool(parsed.aiTool) ? parsed.aiTool : defaults.aiTool,
      expandedVisibility: normalizeExpandedVisibility(parsed.expandedVisibility),
    };
  } catch {
    return defaults;
  }
}

function savePreferences(state: Pick<CommandPreferencesState, 'aiTool' | 'expandedVisibility'>) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        aiTool: state.aiTool,
        expandedVisibility: { ...state.expandedVisibility },
      })
    );
  } catch {
    // Ignore storage errors.
  }
}

function createCommandPreferencesStore() {
  const state = $state<CommandPreferencesState>({
    initialized: false,
    availabilityLoading: false,
    aiTool: 'default',
    expandedVisibility: createDefaultExpandedVisibility(),
    availability: defaultAvailability,
  });

  async function refreshAvailability() {
    state.availabilityLoading = true;

    try {
      state.availability = await getCommandAvailability();
    } catch (cause) {
      state.availability = {
        status: 'unavailable',
        profile: null,
        workflows: [],
        availableExpandedCommands: [],
        error: cause instanceof Error ? cause.message : 'Failed to load command availability',
      };
    } finally {
      state.availabilityLoading = false;
    }
  }

  return {
    get initialized() {
      return state.initialized;
    },

    get availabilityLoading() {
      return state.availabilityLoading;
    },

    get aiTool() {
      return state.aiTool;
    },

    get expandedVisibility() {
      return state.expandedVisibility;
    },

    get availability() {
      return state.availability;
    },

    async initialize() {
      if (state.initialized) {
        return;
      }

      const preferences = loadPreferences();
      state.initialized = true;
      state.aiTool = preferences.aiTool;
      state.expandedVisibility = preferences.expandedVisibility;

      await refreshAvailability();
    },

    refreshAvailability,

    setAiTool(aiTool: AiTool) {
      state.aiTool = aiTool;
      savePreferences({
        aiTool: state.aiTool,
        expandedVisibility: state.expandedVisibility,
      });
    },

    setExpandedVisibility(command: ExpandedCommand, visible: boolean) {
      state.expandedVisibility = {
        ...state.expandedVisibility,
        [command]: visible,
      };

      savePreferences({
        aiTool: state.aiTool,
        expandedVisibility: state.expandedVisibility,
      });
    },
  };
}

export const commandPreferencesStore = createCommandPreferencesStore();
