import {
  activateProject as activateProjectRequest,
  addProject as addProjectRequest,
  getApiErrorMessage,
  getProjects,
  removeProject as removeProjectRequest,
  type ProjectEntry,
  type ProjectListResponse,
  type ProjectSelectionResponse,
  type RemoveProjectResponse,
} from '../lib/api';

interface ProjectsState {
  projects: ProjectEntry[];
  activeProjectId: string | null;
  loading: boolean;
  error: string | null;
}

function createProjectsStore() {
  const state = $state<ProjectsState>({
    projects: [],
    activeProjectId: null,
    loading: false,
    error: null,
  });

  function applySnapshot(snapshot: ProjectListResponse) {
    state.projects = snapshot.projects;
    state.activeProjectId = snapshot.activeProjectId;
  }

  async function refreshSnapshot() {
    const snapshot = await getProjects();
    applySnapshot(snapshot);
    return snapshot;
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

    async loadProjects(): Promise<ProjectListResponse> {
      return runAction(() => refreshSnapshot(), 'Failed to load projects');
    },

    async addProject(path: string): Promise<ProjectSelectionResponse> {
      return runAction(async () => {
        const response = await addProjectRequest(path);
        await refreshSnapshot();
        return response;
      }, 'Failed to add project');
    },

    async removeProject(id: string): Promise<RemoveProjectResponse> {
      return runAction(async () => {
        const response = await removeProjectRequest(id);
        await refreshSnapshot();
        return response;
      }, 'Failed to remove project');
    },

    async switchProject(id: string): Promise<ProjectSelectionResponse> {
      return runAction(async () => {
        const response = await activateProjectRequest(id);
        await refreshSnapshot();
        return response;
      }, 'Failed to switch project');
    },
  };
}

export const projectStore = createProjectsStore();
