import { getApiErrorMessage, getStores } from '$lib/api';

import {
  createDefaultStoreDiscoveryState,
  createStoreDiscoveryController,
  type StoreDiscoveryState,
} from './storeDiscoveryCore';

function createStoreDiscoveryStore() {
  const state = $state<StoreDiscoveryState>(createDefaultStoreDiscoveryState());

  // All transition logic lives in the pure core (storeDiscoveryCore.ts) so it
  // can be executed directly by the node/tsx test runner. The $state proxy is
  // passed as the mutable target, keeping reactivity intact.
  const controller = createStoreDiscoveryController({
    state,
    getStores,
    getErrorMessage: (cause) => getApiErrorMessage(cause, 'Failed to load Store discovery'),
  });

  return {
    get status() {
      return state.status;
    },
    get stores() {
      return state.stores;
    },
    get reason() {
      return state.reason;
    },
    get checkedAt() {
      return state.checkedAt;
    },
    get loading() {
      return state.loading;
    },
    get error() {
      return state.error;
    },

    refresh: () => controller.refresh(),
    reset: () => controller.reset(),
  };
}

// Module-level singleton: machine-global by design, shared across the whole UI,
// and not keyed or reset by active project changes (only an explicit reset()).
export const storeDiscoveryStore = createStoreDiscoveryStore();
