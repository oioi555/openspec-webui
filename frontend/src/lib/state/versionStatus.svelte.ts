import { toast } from 'svelte-sonner';

import { getApiErrorMessage, getVersionStatus, refreshVersionStatus, type VersionStatusResponse } from '$lib/api';
import { t } from '$lib/i18n';
import * as m from '$lib/paraglide/messages.js';
import { FIXED_LABELS } from '$lib/uiText';

import {
  createVersionNotificationStoreWithAdapter,
  getToolsWithAvailableUpdates,
  loadVersionNotificationState,
} from './versionStatusCore';

export function createVersionStatusStore() {
  let initialized = $state(false);
  let loading = $state(false);
  let snapshot = $state<VersionStatusResponse | null>(null);
  let error = $state<string | null>(null);
  let retryTimeoutId = $state<ReturnType<typeof setTimeout> | null>(null);
  let notificationState = $state(loadVersionNotificationState());

  const notificationStore = createVersionNotificationStoreWithAdapter({
    get: () => notificationState,
    set: (nextState) => {
      notificationState = nextState;
    },
  });

  function clearRetryTimeout() {
    if (retryTimeoutId) {
      clearTimeout(retryTimeoutId);
      retryTimeoutId = null;
    }
  }

  function scheduleRetry() {
    if (typeof window === 'undefined' || retryTimeoutId) {
      return;
    }

    retryTimeoutId = setTimeout(() => {
      retryTimeoutId = null;
      void refresh();
    }, 1000);
  }

  function getToolLabel(toolId: 'webui' | 'openspec') {
    return toolId === 'webui'
      ? FIXED_LABELS.settings.versions.webui
      : FIXED_LABELS.settings.versions.openspecCli;
  }

  function notifyIfNeeded(nextSnapshot: VersionStatusResponse) {
    if (!notificationStore.shouldNotify(nextSnapshot)) {
      return;
    }

    const labels = getToolsWithAvailableUpdates(nextSnapshot).map((toolId) => getToolLabel(toolId));
    if (labels.length === 0) {
      return;
    }

    toast(t(m.toast_updates_available, { tools: labels.join(' / ') }));
    notificationStore.markNotified(nextSnapshot);
  }

  async function refresh() {
    if (loading) {
      return;
    }

    loading = true;

    try {
      const nextSnapshot = await getVersionStatus();
      snapshot = nextSnapshot;
      error = null;

      if (nextSnapshot.loading) {
        scheduleRetry();
        return;
      }

      clearRetryTimeout();
      notifyIfNeeded(nextSnapshot);
    } catch (cause) {
      clearRetryTimeout();
      error = getApiErrorMessage(cause, t(m.error_failed_to_load_version_status));
    } finally {
      loading = false;
    }
  }

  async function manualRefresh() {
    if (loading) {
      return;
    }

    clearRetryTimeout();
    loading = true;

    try {
      const nextSnapshot = await refreshVersionStatus();
      snapshot = nextSnapshot;
      error = null;
      notifyIfNeeded(nextSnapshot);
    } catch (cause) {
      clearRetryTimeout();
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
      notificationStore.initialize();
      void refresh();
    },

    destroy() {
      clearRetryTimeout();
    },

    refresh,
    manualRefresh,
  };
}

export const versionStatusStore = createVersionStatusStore();
