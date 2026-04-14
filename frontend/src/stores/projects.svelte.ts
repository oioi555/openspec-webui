import {
  addProject as addProjectRequest,
  getApiErrorMessage,
  getProjects,
  removeProject as removeProjectRequest,
  setActiveProjectContext,
  type ProjectEntry,
  type ProjectListResponse,
  type ProjectSelectionResponse,
  type RemoveProjectResponse,
} from '../lib/api';
import {
  loadPreferredProjectId,
  persistPreferredProjectId,
  resolveProjectSelection,
  type ProjectSelectionResolution,
} from './projectsCore';
import { wsClient } from '../lib/websocket';

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
      throw new Error('WebSocket is not connected');
    }

    if (!force && !pendingBind && state.activeProjectId === projectId) {
      return;
    }

    if (pendingBind?.projectId === projectId) {
      await pendingBind.promise;
      return;
    }

    rejectPendingBind('Project switch interrupted');

    let resolvePending = () => {};
    let rejectPending = (_error: Error) => {};

    const promise = new Promise<void>((resolve, reject) => {
      resolvePending = resolve;
      rejectPending = reject;
    });

    const timeoutId = setTimeout(() => {
      if (pendingBind?.projectId === projectId) {
        rejectPendingBind('Timed out waiting for project binding');
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
      rejectPendingBind(error instanceof Error ? error.message : 'Failed to send project bind message');
      throw error;
    }

    await promise;
  }

  async function bindProject(projectId: string | null, options: { force?: boolean } = {}): Promise<void> {
    return runAction(
      () => bindProjectRequest(projectId, options.force ?? false),
      'Failed to switch project'
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

    get hasPendingBind() {
      return pendingBind !== null;
    },

    async loadProjects(): Promise<ProjectListResponse> {
      return runAction(() => refreshSnapshot(), 'Failed to load projects');
    },

    async addProject(path: string): Promise<ProjectSelectionResponse> {
      return runAction(async () => {
        const response = await addProjectRequest(path);

        await refreshSnapshot();
        await bindProjectRequest(response.project.id, false, true);
        return response;
      }, 'Failed to add project');
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
      }, 'Failed to remove project');
    },

    bindProject,

    handleProjectBound(projectId: string | null) {
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

      if (pendingBind?.projectId === projectId) {
        pendingBind.resolve();
      } else if (pendingBind) {
        pendingBind.reject(new Error('Received unexpected project binding update'));
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

    get preferredProjectId() {
      return preferredProjectId;
    },
  };
}

export const projectStore = createProjectsStore();
