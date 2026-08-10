import { getCommandAvailability } from '$lib/api';
import { t } from '$lib/i18n';
import * as m from '$lib/paraglide/messages.js';
import type { CommandAvailability } from '$lib/types/api';
import type { WorkflowCommand } from '$lib/types/commandTypes';

import {
  createCommandPreferencesStoreWithAdapter,
  loadCommandPreferences,
  type CommandPreferences,
  type CommandVisibility,
} from './commandPreferencesCore';

export type { CommandPreferences, CommandVisibility } from './commandPreferencesCore';

export interface CommandPreferencesState {
  initialized: boolean;
  availabilityLoading: boolean;
  commandVisibility: CommandVisibility;
  availability: CommandAvailability;
}

const defaultAvailability: CommandAvailability = {
  status: 'unavailable',
  profile: null,
  workflows: [],
  delivery: null,
  integrations: [],
  forms: [],
  toolOptions: [],
  error: null,
};

function createCommandPreferencesStore() {
  let initialized = $state(false);
  let availabilityLoading = $state(false);
  let availability = $state<CommandAvailability>(defaultAvailability);
  let preferences = $state<CommandPreferences>(loadCommandPreferences());

  const preferencesStore = createCommandPreferencesStoreWithAdapter({
    get: () => preferences,
    set: (nextPreferences) => {
      preferences = nextPreferences;
    },
  });

  async function refreshAvailability() {
    availabilityLoading = true;

    try {
      availability = await getCommandAvailability();
    } catch (cause) {
      availability = {
        status: 'unavailable',
        profile: null,
        workflows: [],
        delivery: null,
        integrations: [],
        forms: [],
        toolOptions: [],
        error: cause instanceof Error ? cause.message : t(m.error_failed_to_load_command_availability),
      };
    } finally {
      availabilityLoading = false;
    }
  }

  return {
    get initialized() {
      return initialized;
    },

    get availabilityLoading() {
      return availabilityLoading;
    },

    get commandVisibility() {
      return preferencesStore.commandVisibility;
    },

    get availability() {
      return availability;
    },

    async initialize() {
      if (initialized) {
        return;
      }

      initialized = true;
      preferencesStore.initialize();

      await refreshAvailability();
    },

    refreshAvailability,

    setCommandVisibility(command: WorkflowCommand, visible: boolean) {
      preferencesStore.setCommandVisibility(command, visible);
    },
  };
}

export const commandPreferencesStore = createCommandPreferencesStore();
