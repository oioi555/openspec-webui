import { getApiErrorMessage, runValidation } from '$lib/api';
import { t } from '$lib/i18n';
import * as m from '$lib/paraglide/messages.js';
import { projectStore } from '$lib/state/projects.svelte.ts';
import { tabStore } from '$lib/state/tabs.svelte.ts';
import { formatDate } from '$lib/utils';
import type { ValidationItem } from '$lib/types/api';

import { createDefaultValidationState, createValidationController, deriveValidationDashboardSummary } from './validationCore';
import { validationPreferencesStore } from './validationPreferences.svelte.ts';

export function getValidationItemPath(item: ValidationItem) {
  if ((item.type !== 'spec' && item.type !== 'change') || !item.name) {
    return null;
  }

  return item.type === 'spec'
    ? `/specs/${encodeURIComponent(item.name)}`
    : `/changes/${encodeURIComponent(item.name)}`;
}

const reactiveState = $state(createDefaultValidationState());

const controller = createValidationController({
  state: reactiveState,
  getProjectId: () => projectStore.activeProjectId,
  runValidation,
  getValidationOptions: () => ({
    strict: validationPreferencesStore.strict,
    concurrency: validationPreferencesStore.concurrency,
  }),
  getErrorMessage: (cause) => getApiErrorMessage(cause, 'Validation failed'),
});

export const validationStore = {
  get loading() {
    return controller.state.loading;
  },

  get error() {
    return controller.state.error;
  },

  get result() {
    return controller.state.result;
  },

  get latestRunAt() {
    return controller.state.latestRunAt;
  },

  get failedCount() {
    return controller.state.result?.summary.failed ?? 0;
  },

  get autoRun() {
    return validationPreferencesStore.autoRun;
  },

  get autoRunOnArtifactChange() {
    return validationPreferencesStore.autoRunOnArtifactChange;
  },

  get dashboardSummary() {
    return deriveValidationDashboardSummary(controller.state, {
      copy: {
        notRunPrimaryValue: t(m.dashboard_validation_not_run_value),
        notRunDescription: t(m.dashboard_validation_not_run_description),
        runningPrimaryValue: t(m.dashboard_validation_running_value),
        runningDescription: t(m.dashboard_validation_running_description),
        passedPrimaryValue: t(m.dashboard_validation_passed_value),
        passedDescription: (lastRun) =>
          lastRun
            ? t(m.dashboard_validation_last_run_description, { lastRun })
            : t(m.dashboard_validation_passed_description),
        failedPrimaryValue: (failedCount) => t(m.dashboard_validation_failed_value, { count: failedCount }),
        failedDescription: (_failedCount, lastRun) =>
          lastRun
            ? t(m.dashboard_validation_last_run_description, { lastRun })
            : t(m.dashboard_validation_failed_description),
        unknownPrimaryValue: t(m.dashboard_validation_unknown_value),
        unknownDescription: () => t(m.dashboard_validation_unknown_description),
      },
      formatLastRun: (runAt) => (runAt ? formatDate(runAt) : null),
    });
  },

  reset(projectId?: string | null) {
    controller.reset(projectId);
  },

  syncProject() {
    return controller.syncProject();
  },

  refresh() {
    return controller.refresh();
  },

  openItem(item: ValidationItem, options?: { confirmed?: boolean }) {
    controller.syncProject();

    const path = getValidationItemPath(item);

    if (!path) {
      return false;
    }

    if (options?.confirmed) {
      tabStore.openConfirmed(path);
    } else {
      tabStore.openPreview(path);
    }

    return true;
  },
};
