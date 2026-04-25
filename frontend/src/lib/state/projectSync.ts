export interface ProjectSyncActions {
  overlay: string | null;
  closeOverlay: () => void;
  prepareProjectScopedRefresh?: () => void;
  clearProjectScopedSearchState: () => void;
  resetTabsToDashboard: () => void;
  initializeData: () => Promise<void>;
  refreshCommandAvailability: () => Promise<void>;
}

export interface ProjectContextMessageActions extends ProjectSyncActions {
  messageType: 'project:bound' | 'connection:init';
  currentActiveProjectId: string | null;
  announcedActiveProjectId: string | null;
  shouldIgnoreRefreshUntilBound?: boolean;
}

export interface ProjectBoundActions extends ProjectSyncActions {
  activeProjectId: string | null;
  wasIgnoringRefreshUntilBound?: boolean;
  stopIgnoringRefreshUntilBound?: () => void;
  applyProjectBound: (projectId: string | null) => void;
  completeProjectBound: (projectId: string | null) => void;
}

export async function reinitializeProjectScopedState(actions: ProjectSyncActions): Promise<void> {
  if (actions.overlay === 'project-selector') {
    actions.closeOverlay();
  }

  actions.prepareProjectScopedRefresh?.();
  actions.clearProjectScopedSearchState();
  actions.resetTabsToDashboard();
  await actions.initializeData();
  await actions.refreshCommandAvailability();
}

export async function handleProjectContextMessage(
  actions: ProjectContextMessageActions
): Promise<boolean> {
  if (actions.messageType === 'connection:init' && actions.shouldIgnoreRefreshUntilBound) {
    return false;
  }

  if (
    actions.messageType === 'connection:init' &&
    actions.currentActiveProjectId === actions.announcedActiveProjectId
  ) {
    return false;
  }

  await reinitializeProjectScopedState(actions);
  return true;
}

export async function handleProjectBoundMessage(actions: ProjectBoundActions): Promise<void> {
  actions.applyProjectBound(actions.activeProjectId);

  if (actions.wasIgnoringRefreshUntilBound) {
    actions.stopIgnoringRefreshUntilBound?.();
  }

  try {
    await reinitializeProjectScopedState(actions);
  } finally {
    actions.completeProjectBound(actions.activeProjectId);
  }
}
