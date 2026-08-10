import { getApiErrorMessage, getProjectVersionStatus, refreshProjectVersionStatus, type ProjectVersionStatusResponse } from '$lib/api';
import { t } from '$lib/i18n';
import * as m from '$lib/paraglide/messages.js';

import { normalizeProjectVersionStatusResponse } from './projectVersionStatusCore';

export function createProjectVersionStatusStore() {
  let initialized = $state(false);
  let loading = $state(false);
  let snapshot = $state<ProjectVersionStatusResponse | null>(null);
  let error = $state<string | null>(null);

  async function refresh() {
    if (loading) {
      return;
    }

    loading = true;

    try {
      const nextSnapshot = await getProjectVersionStatus();
      snapshot = normalizeProjectVersionStatusResponse(nextSnapshot);
      error = null;
    } catch (cause) {
      error = getApiErrorMessage(cause, t(m.error_failed_to_load_version_status));
    } finally {
      loading = false;
    }
  }

  async function manualRefresh() {
    if (loading) {
      return;
    }

    loading = true;

    try {
      const nextSnapshot = await refreshProjectVersionStatus();
      snapshot = normalizeProjectVersionStatusResponse(nextSnapshot);
      error = null;
    } catch (cause) {
      error = getApiErrorMessage(cause, t(m.error_failed_to_load_version_status));
    } finally {
      loading = false;
    }
  }

  return {
    get initialized() {
      return initialized;
    },

    get loading() {
      return loading;
    },
    get snapshot() {
      return snapshot;
    },

    get error() {
      return error;
    },

    initialize() {
      if (initialized) {
        return;
      }

      initialized = true;
      void refresh();
    },

    destroy() {
      // No timers or subscriptions to release; kept for parity with the
      // version-status store bootstrap lifecycle.
    },

    refresh,
    manualRefresh,
  };
}

export const projectVersionStatusStore = createProjectVersionStatusStore();
