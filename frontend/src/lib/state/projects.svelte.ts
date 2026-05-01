import {
  addProject as addProjectRequest,
  getApiErrorMessage,
  getProjects,
  removeProject as removeProjectRequest,
  setActiveProjectContext,
} from '$lib/api';
import { t } from '$lib/i18n';
import * as m from '$lib/paraglide/messages.js';
import type {
  ProjectEntry,
  ProjectListResponse,
  ProjectSelectionResponse,
  RemoveProjectResponse,
} from '$lib/types/api';
import { wsClient } from '$lib/websocket';

import {
  loadPreferredProjectId,
  persistPreferredProjectId,
  resolveProjectSelection,
  shouldSkipProjectBind,
  type ProjectSelectionResolution,
} from './projectsCore';

const PROJECT_BIND_TIMEOUT_MS = 10000;

interface ProjectsState {
  projects: ProjectEntry[];
  activeProjectId: string | null;
  loading: boolean;
  error: string | null;
}

function createProjectsStore() {
  const initialPreferredProjectId = loadPreferredProjectId();
  const state = $state<ProjectsState>({
    projects: [],
    activeProjectId: initialPreferredProjectId,
    loading: false,
    error: null,
  });
  let preferredProjectId = initialPreferredProjectId;
  let authoritativeBoundProjectId: string | null = null;

  setActiveProjectContext(initialPreferredProjectId);

  let pendingBind:
    | {
        projectId: string | null;
        shouldPersistPreference: boolean;
        promise: Promise<void>;
        resolve: () => void;
        reject: (error: Error) => void;
        timeoutId: ReturnType<typeof setTimeout>;
      }
    | null = null;

  function applyProjectSelection(selection: ProjectSelectionResolution) {
    preferredProjectId = selection.preferredProjectId;
    persistPreferredProjectId(selection.preferredProjectId);

    const projectId = selection.activeProjectId;
    state.activeProjectId = projectId;
    setActiveProjectContext(projectId);
  }

  function setAuthoritativeBoundProjectId(projectId: string | null) {
    authoritativeBoundProjectId = projectId;
  }

  function clearPendingBind() {
    if (!pendingBind) {
      return;
    }

    clearTimeout(pendingBind.timeoutId);
    pendingBind = null;
  }

  function rejectPendingBind(message: string) {
    if (!pendingBind) {
      state.error = message;
      return;
    }

    const currentPendingBind = pendingBind;
    clearPendingBind();
    currentPendingBind.reject(new Error(message));
  }

  function applySnapshot(snapshot: ProjectListResponse): ProjectSelectionResolution {
    state.projects = snapshot.projects;
    const selection = resolveProjectSelection(snapshot, preferredProjectId);
    applyProjectSelection(selection);
    return selection;
  }

  async function refreshSnapshot() {
    const snapshot = await getProjects();
    const selection = applySnapshot(snapshot);
    return {
      ...snapshot,
      activeProjectId: selection.activeProjectId,
    };
  }

  async function runAction<T>(action: () => Promise<T>, fallbackMessage: string): Promise<T> {
    state.loading = true;
    state.error = null;

    try {
      return await action();
    } catch (cause) {
      state.error = getApiErrorMessage(cause, fallbackMessage);
      throw cause;
    } finally {
      state.loading = false;
    }
  }

  async function bindProjectRequest(
    projectId: string | null,
    force = false,
    shouldPersistPreference = true
  ): Promise<void> {
    if (!wsClient.isConnected) {
      throw new Error(t(m.error_websocket_not_connected));
    }

    if (
      shouldSkipProjectBind({
        targetProjectId: projectId,
        authoritativeProjectId: authoritativeBoundProjectId,
        hasPendingBind: pendingBind !== null,
        force,
      })
    ) {
      return;
    }

    if (pendingBind?.projectId === projectId) {
      await pendingBind.promise;
      return;
    }

    rejectPendingBind(t(m.error_project_switch_interrupted));

    let resolvePending = () => {};
    let rejectPending = (_error: Error) => {};

    const promise = new Promise<void>((resolve, reject) => {
      resolvePending = resolve;
      rejectPending = reject;
    });

    const timeoutId = setTimeout(() => {
      if (pendingBind?.projectId === projectId) {
        rejectPendingBind(t(m.error_project_binding_timed_out));
      }
    }, PROJECT_BIND_TIMEOUT_MS);

    pendingBind = {
      projectId,
      shouldPersistPreference,
      promise,
      resolve: () => {
        clearPendingBind();
        resolvePending();
      },
      reject: (error) => {
        clearPendingBind();
        rejectPending(error);
      },
      timeoutId,
    };

    try {
      wsClient.send({
        type: 'project:bind',
        projectId,
      });
    } catch (error) {
      rejectPendingBind(error instanceof Error ? error.message : t(m.error_failed_to_send_project_bind_message));
      throw error;
    }

    await promise;
  }

  async function bindProject(projectId: string | null, options: { force?: boolean } = {}): Promise<void> {
    return runAction(
      () => bindProjectRequest(projectId, options.force ?? false),
      t(m.error_failed_to_switch_project)
    );
  }

  return {
    get projects() {
      return state.projects;
    },

    get activeProjectId() {
      return state.activeProjectId;
    },
    get loading() {
      return state.loading;
    },

    get error() {
      return state.error;
    },

    clearError() {
      state.error = null;
    },

    get hasPendingBind() {
      return pendingBind !== null;
    },

    async loadProjects(): Promise<ProjectListResponse> {
      return runAction(() => refreshSnapshot(), t(m.error_failed_to_load_projects));
    },

    async addProject(path: string): Promise<ProjectSelectionResponse> {
      return runAction(async () => {
        const response = await addProjectRequest(path);

        await refreshSnapshot();
        await bindProjectRequest(response.project.id, false, true);
        return response;
      }, t(m.error_failed_to_add_project));
    },

    async removeProject(id: string): Promise<RemoveProjectResponse> {
      return runAction(async () => {
        const response = await removeProjectRequest(id);
        applySnapshot({
          projects: state.projects.filter((project) => project.id !== response.removedProjectId),
          activeProjectId: state.activeProjectId === response.removedProjectId
            ? response.activeProjectId
            : state.activeProjectId,
        });

        await refreshSnapshot();
        return response;
      }, t(m.error_failed_to_remove_project));
    },

    bindProject,

    handleProjectBound(projectId: string | null) {
      setAuthoritativeBoundProjectId(projectId);

      if (pendingBind?.projectId === projectId) {
        applyProjectSelection({
          activeProjectId: projectId,
          preferredProjectId: pendingBind.shouldPersistPreference ? projectId : null,
        });
      } else {
        applyProjectSelection({
          activeProjectId: projectId,
          preferredProjectId: null,
        });
      }
    },

    completeProjectBound(projectId: string | null) {
      if (pendingBind?.projectId === projectId) {
        pendingBind.resolve();
      } else if (pendingBind) {
        pendingBind.reject(new Error(t(m.error_unexpected_project_binding_update)));
      }
    },

    handleProjectBindingError(message: string) {
      rejectPendingBind(message);
    },

    setActiveProjectId(id: string | null) {
      applyProjectSelection({
        activeProjectId: id,
        preferredProjectId: null,
      });
    },

    setAuthoritativeBoundProjectId,

    get authoritativeBoundProjectId() {
      return authoritativeBoundProjectId;
    },

    get preferredProjectId() {
      return preferredProjectId;
    },
  };
}

export const projectStore = createProjectsStore();
