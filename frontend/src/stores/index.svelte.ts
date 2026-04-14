import { tick } from 'svelte';
import type { Project, Stats, SpecSummary, ChangeSummary } from '../lib/api';
import {
  getApiErrorMessage,
  getProject,
  getStats,
  getSpecs,
  getChanges,
  isNoActiveProjectError,
} from '../lib/api';
import { wsClient, type WSMessage } from '../lib/websocket';
import { commandPreferencesStore } from './commandPreferences.svelte.ts';
import { layoutStore } from './layout.svelte.ts';
import { projectStore } from './projects.svelte.ts';
import { shouldRestoreProjectBinding } from './projectsCore';
import { handleProjectContextMessage } from './projectSync';
import { tabStore } from './tabs.svelte.ts';
import { toast } from 'svelte-sonner';

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
  searchQuery: '',
  specsRefreshTrigger: 0,
  changesRefreshTrigger: 0,
  ignoreRefreshUntilBound: false,
  reconnectAnnouncedProjectId: null as string | null,
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

export const searchQuery = createBox(
  () => state.searchQuery,
  (value) => {
    state.searchQuery = value;
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

export function clearProjectScopedSearchState() {
  state.searchQuery = '';
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

async function reinitializeProjectScopedState(messageType: 'project:bound' | 'connection:init', announcedActiveProjectId: string | null) {
  await handleProjectContextMessage({
    messageType,
    announcedActiveProjectId,
    currentActiveProjectId: projectStore.activeProjectId,
    shouldIgnoreRefreshUntilBound: state.ignoreRefreshUntilBound,
    overlay: layoutStore.overlay,
    closeOverlay: () => layoutStore.closeOverlay(),
    clearProjectScopedSearchState,
    resetTabsToDashboard: () => {
      tabStore.closeAll();
    },
    initializeData,
    refreshCommandAvailability: () => commandPreferencesStore.refreshAvailability(),
  });
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

    state.error = getApiErrorMessage(cause, 'Failed to load data');
  } finally {
    state.isLoading = false;
  }
}

async function handleConnectionInit(announcedActiveProjectId: string | null) {
  const localProjectId = projectStore.preferredProjectId;

  if (shouldRestoreProjectBinding(localProjectId, announcedActiveProjectId)) {
    beginIgnoringRefreshUntilBound(announcedActiveProjectId);

    try {
      await projectStore.bindProject(localProjectId, { force: true });
    } catch (cause) {
      stopIgnoringRefreshUntilBound();
      projectStore.setActiveProjectId(announcedActiveProjectId);
      toast.error(getApiErrorMessage(cause, 'Failed to restore project binding'));
      await reinitializeProjectScopedState('connection:init', announcedActiveProjectId);
    }

    return;
  }

  stopIgnoringRefreshUntilBound();

  if (localProjectId === announcedActiveProjectId) {
    await reinitializeProjectScopedState('connection:init', announcedActiveProjectId);
    return;
  }

  projectStore.setActiveProjectId(announcedActiveProjectId);
  await reinitializeProjectScopedState('connection:init', announcedActiveProjectId);
}

async function handleProjectBound(activeProjectId: string | null) {
  const wasIgnoringRefresh = state.ignoreRefreshUntilBound;
  projectStore.handleProjectBound(activeProjectId);

  if (wasIgnoringRefresh) {
    stopIgnoringRefreshUntilBound();
  }

  await reinitializeProjectScopedState('project:bound', activeProjectId);
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
            toast(`Updated: ${message.entityId || entity}`);
          }

          await tick();
          window.scrollTo(0, scrollY);
        } catch (cause) {
          if (isNoActiveProjectError(cause)) {
            await handleProjectBound(null);
            return;
          }

          toast.error(getApiErrorMessage(cause, 'Failed to refresh workspace data'));
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
