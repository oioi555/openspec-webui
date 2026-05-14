import { tick } from 'svelte';
import { toast } from 'svelte-sonner';
import { t } from '$lib/i18n';
import * as m from '$lib/paraglide/messages.js';

import {
  getApiErrorMessage,
  getChanges,
  getProject,
  getSpecs,
  getStats,
  isNoActiveProjectError,
} from '$lib/api';
import type { ChangeSummary, Project, SpecSummary, Stats } from '$lib/types/api';
import { wsClient, type WSDataRefreshMessage, type WSMessage } from '$lib/websocket';

import { commandPreferencesStore } from './commandPreferences.svelte.ts';
import { layoutStore } from './layout.svelte.ts';
import { projectStore } from './projects.svelte.ts';
import { shouldRestoreProjectBinding } from './projectsCore';
import { handleProjectBoundMessage, handleProjectContextMessage } from './projectSync';
import { resetSearchProjectScopedState } from './search.svelte.ts';
import { tabStore } from './tabs.svelte.ts';
import { validationStore } from './validation.svelte.ts';
import { createArtifactValidationScheduler } from './validationAutoRunCore';

function createBox<T>(read: () => T, write: (value: T) => void) {
  return {
    get value() {
      return read();
    },
    set value(value: T) {
      write(value);
    },
  };
}

const state = $state({
  isLoading: true,
  error: null as string | null,
  project: null as Project | null,
  stats: null as Stats | null,
  specs: [] as SpecSummary[],
  activeChanges: [] as ChangeSummary[],
  archivedChanges: [] as ChangeSummary[],
  specsRefreshTrigger: 0,
  changesRefreshTrigger: 0,
  ignoreRefreshUntilBound: false,
  reconnectAnnouncedProjectId: null as string | null,
});

const artifactValidationScheduler = createArtifactValidationScheduler({
  getProjectId: () => projectStore.activeProjectId,
  isAutoRunEnabled: () => validationStore.autoRunOnArtifactChange,
  isValidationLoading: () => validationStore.loading,
  refreshValidation: () => validationStore.refresh(),
});

export const isLoading = createBox(
  () => state.isLoading,
  (value) => {
    state.isLoading = value;
  }
);

export const error = createBox(
  () => state.error,
  (value) => {
    state.error = value;
  }
);

export const project = createBox(
  () => state.project,
  (value) => {
    state.project = value;
  }
);

export const stats = createBox(
  () => state.stats,
  (value) => {
    state.stats = value;
  }
);

export const specs = createBox(
  () => state.specs,
  (value) => {
    state.specs = value;
  }
);

export const activeChanges = createBox(
  () => state.activeChanges,
  (value) => {
    state.activeChanges = value;
  }
);

export const archivedChanges = createBox(
  () => state.archivedChanges,
  (value) => {
    state.archivedChanges = value;
  }
);

export const currentRoute = createBox(
  () => tabStore.currentPath,
  (value) => {
    tabStore.handlePath(value);
  }
);

export const specsRefreshTrigger = createBox(
  () => state.specsRefreshTrigger,
  (value) => {
    state.specsRefreshTrigger = value;
  }
);

export const changesRefreshTrigger = createBox(
  () => state.changesRefreshTrigger,
  (value) => {
    state.changesRefreshTrigger = value;
  }
);

function clearLoadedWorkspaceState() {
  state.project = null;
  state.stats = null;
  state.specs = [];
  state.activeChanges = [];
  state.archivedChanges = [];
}

function maybeScheduleArtifactValidation(message: WSDataRefreshMessage) {
  artifactValidationScheduler.handleRefreshMessage(message);
}

export function clearProjectScopedSearchState() {
  resetSearchProjectScopedState();
}

function applyNoActiveProjectState() {
  clearLoadedWorkspaceState();
  state.error = null;
}

function beginIgnoringRefreshUntilBound(announcedActiveProjectId: string | null) {
  state.ignoreRefreshUntilBound = true;
  state.reconnectAnnouncedProjectId = announcedActiveProjectId;
}

function stopIgnoringRefreshUntilBound() {
  state.ignoreRefreshUntilBound = false;
  state.reconnectAnnouncedProjectId = null;
}

async function reinitializeProjectScopedState(
  messageType: 'project:bound' | 'connection:init',
  announcedActiveProjectId: string | null,
  currentActiveProjectId = projectStore.activeProjectId
) {
  await handleProjectContextMessage({
    messageType,
    announcedActiveProjectId,
    currentActiveProjectId,
    shouldIgnoreRefreshUntilBound: state.ignoreRefreshUntilBound,
    overlay: layoutStore.overlay,
    closeOverlay: () => layoutStore.closeOverlay(),
    prepareProjectScopedRefresh: clearLoadedWorkspaceState,
    clearProjectScopedSearchState,
    clearProjectScopedValidationState: () => validationStore.reset(announcedActiveProjectId),
    resetTabsToDashboard: () => {
      tabStore.closeAll();
    },
    initializeData,
    refreshCommandAvailability: () => commandPreferencesStore.refreshAvailability(),
  });

  artifactValidationScheduler.syncProject();
}

export async function initializeData() {
  state.isLoading = true;
  state.error = null;

  try {
    const projectsData = await projectStore.loadProjects();

    if (!projectsData.activeProjectId) {
      applyNoActiveProjectState();
      return;
    }

    const [projectData, statsData, specsData, changesData] = await Promise.all([
      getProject(),
      getStats(),
      getSpecs(),
      getChanges(),
    ]);

    state.project = projectData;
    state.stats = statsData;
    state.specs = specsData;
    state.activeChanges = changesData.active;
    state.archivedChanges = changesData.archived;
  } catch (cause) {
    if (isNoActiveProjectError(cause)) {
      try {
        await projectStore.loadProjects();
      } catch {
        // Ignore follow-up sync errors and keep the local empty state.
      }

      applyNoActiveProjectState();
      return;
    }

    state.error = getApiErrorMessage(cause, t(m.error_failed_to_load_data));
  } finally {
    state.isLoading = false;
  }
}

async function handleConnectionInit(announcedActiveProjectId: string | null) {
  projectStore.setAuthoritativeBoundProjectId(announcedActiveProjectId);
  const currentActiveProjectId = projectStore.activeProjectId;
  const localProjectId = projectStore.preferredProjectId;

  if (shouldRestoreProjectBinding(localProjectId, announcedActiveProjectId)) {
    beginIgnoringRefreshUntilBound(announcedActiveProjectId);

    try {
      await projectStore.bindProject(localProjectId, { force: true });
    } catch (cause) {
      stopIgnoringRefreshUntilBound();
      projectStore.setActiveProjectId(announcedActiveProjectId);
      toast.error(getApiErrorMessage(cause, t(m.error_failed_to_restore_project_binding)));
      await reinitializeProjectScopedState(
        'connection:init',
        announcedActiveProjectId,
        currentActiveProjectId
      );
    }

    return;
  }

  stopIgnoringRefreshUntilBound();

  if (localProjectId === announcedActiveProjectId) {
    await reinitializeProjectScopedState(
      'connection:init',
      announcedActiveProjectId,
      currentActiveProjectId
    );
    return;
  }

  projectStore.setActiveProjectId(announcedActiveProjectId);
  await reinitializeProjectScopedState('connection:init', announcedActiveProjectId, currentActiveProjectId);
}

async function handleProjectBound(activeProjectId: string | null) {
  await handleProjectBoundMessage({
    overlay: layoutStore.overlay,
    activeProjectId,
    wasIgnoringRefreshUntilBound: state.ignoreRefreshUntilBound,
    stopIgnoringRefreshUntilBound,
    applyProjectBound: (projectId) => {
      projectStore.handleProjectBound(projectId);
    },
    completeProjectBound: (projectId) => {
      projectStore.completeProjectBound(projectId);
    },
    closeOverlay: () => layoutStore.closeOverlay(),
    prepareProjectScopedRefresh: clearLoadedWorkspaceState,
    clearProjectScopedSearchState,
    clearProjectScopedValidationState: () => validationStore.reset(activeProjectId),
    resetTabsToDashboard: () => {
      tabStore.closeAll();
    },
    initializeData,
    refreshCommandAvailability: () => commandPreferencesStore.refreshAvailability(),
  });

  artifactValidationScheduler.syncProject();
}

export function setupWebSocket() {
  if (typeof window === 'undefined') {
    return () => {};
  }

  wsClient.connect();

  const unsubscribe = wsClient.subscribe(async (message: WSMessage) => {
    switch (message.type) {
      case 'data:refresh': {
        if (state.ignoreRefreshUntilBound) {
          return;
        }

        artifactValidationScheduler.syncProject();

        const entity = message.entity;
        const scrollY = window.scrollY;

        try {
          if (entity === 'all' || entity === 'project') {
            state.project = await getProject();
          }

          if (entity === 'all' || entity === 'specs') {
            state.specs = await getSpecs();
            state.specsRefreshTrigger += 1;
          }

          if (entity === 'all' || entity === 'changes') {
            const changesData = await getChanges();
            state.activeChanges = changesData.active;
            state.archivedChanges = changesData.archived;
            state.changesRefreshTrigger += 1;
          }

          state.stats = await getStats();

          if (entity !== 'all') {
            toast(t(m.toast_workspace_updated, { target: message.entityId || entity }));
          }

          await tick();
          window.scrollTo(0, scrollY);
          maybeScheduleArtifactValidation(message);
        } catch (cause) {
          if (isNoActiveProjectError(cause)) {
            await handleProjectBound(null);
            return;
          }

          toast.error(getApiErrorMessage(cause, t(m.error_failed_to_refresh_workspace_data)));
        }

        return;
      }
      case 'connection:init': {
        await handleConnectionInit(message.activeProjectId);
        return;
      }
      case 'project:bound': {
        await handleProjectBound(message.activeProjectId);
        return;
      }
      case 'file:changed':
        return;
      case 'error': {
        if (projectStore.hasPendingBind) {
          const announcedProjectId = state.reconnectAnnouncedProjectId;
          stopIgnoringRefreshUntilBound();
          projectStore.handleProjectBindingError(message.message);

          if (announcedProjectId !== null || projectStore.activeProjectId === null) {
            projectStore.setActiveProjectId(announcedProjectId);
          }
        }

        return;
      }
    }
  });

  return () => {
    unsubscribe();
    wsClient.disconnect();
  };
}

export function navigateTo(path: string) {
  tabStore.handlePath(path);
}
