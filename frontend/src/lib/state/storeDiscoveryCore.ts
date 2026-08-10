import type {
  StoreDiscoveryDiagnostic,
  StoreDiscoveryResult,
  StoreDiscoveryStatus,
} from '$lib/types/api';

/**
 * Pure, framework-free core for Store discovery state transitions.
 *
 * The reactive singleton in `storeDiscovery.svelte.ts` delegates to this module
 * so the transition logic can be executed directly by the node/tsx test runner
 * (a `$state` file cannot). Mutations are applied to an externally owned state
 * object; when that object is a Svelte `$state` proxy, reactivity is preserved.
 */

export interface StoreDiscoveryState {
  status: StoreDiscoveryStatus;
  stores: StoreDiscoveryResult['stores'];
  reason: StoreDiscoveryDiagnostic | null;
  checkedAt: string | null;
  loading: boolean;
  error: string | null;
}

export interface StoreDiscoveryControllerDependencies {
  /** External state object (e.g. a Svelte $state proxy) that the controller mutates. */
  state: StoreDiscoveryState;
  getStores: () => Promise<StoreDiscoveryResult>;
  getErrorMessage?: (cause: unknown) => string;
}

export interface StoreDiscoveryController {
  applyResult(result: StoreDiscoveryResult): void;
  refresh(): Promise<void>;
  reset(): void;
}

export function createDefaultStoreDiscoveryState(): StoreDiscoveryState {
  return {
    status: 'empty',
    stores: [],
    reason: null,
    checkedAt: null,
    loading: false,
    error: null,
  };
}

/** Stale-response protection: only accept results at least as fresh as the last known check. */
export function shouldApplyStoreDiscoveryResult(
  result: StoreDiscoveryResult,
  lastCheckedAt: string | null,
): boolean {
  if (!result.checkedAt || !lastCheckedAt) {
    return true;
  }

  return result.checkedAt >= lastCheckedAt;
}

/**
 * Applies a discovery result to `state`, rejecting stale responses.
 * Returns the next stale-guard baseline (the latest known `checkedAt`).
 */
export function applyStoreDiscoveryResult(
  state: StoreDiscoveryState,
  result: StoreDiscoveryResult,
  lastCheckedAt: string | null,
): string | null {
  if (!shouldApplyStoreDiscoveryResult(result, lastCheckedAt)) {
    return lastCheckedAt;
  }

  state.status = result.status;
  state.stores = result.stores;
  state.reason = result.reason;
  state.checkedAt = result.checkedAt;

  return result.checkedAt ?? lastCheckedAt;
}

export function resetStoreDiscoveryState(state: StoreDiscoveryState): void {
  state.status = 'empty';
  state.stores = [];
  state.reason = null;
  state.checkedAt = null;
  state.loading = false;
  state.error = null;
}

export function createStoreDiscoveryController(
  dependencies: StoreDiscoveryControllerDependencies,
): StoreDiscoveryController {
  let lastCheckedAt: string | null = null;

  return {
    applyResult(result: StoreDiscoveryResult) {
      lastCheckedAt = applyStoreDiscoveryResult(dependencies.state, result, lastCheckedAt);
    },

    async refresh() {
      dependencies.state.loading = true;
      dependencies.state.error = null;

      try {
        const result = await dependencies.getStores();
        lastCheckedAt = applyStoreDiscoveryResult(dependencies.state, result, lastCheckedAt);
      } catch (cause) {
        // Don't clear existing data on error — keep stale state visible
        dependencies.state.error =
          dependencies.getErrorMessage?.(cause) ?? 'Failed to load Store discovery';
      } finally {
        dependencies.state.loading = false;
      }
    },

    reset() {
      resetStoreDiscoveryState(dependencies.state);
      lastCheckedAt = null;
    },
  };
}
