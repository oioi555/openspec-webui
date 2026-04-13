export interface ProjectSyncActions {
  overlay: string | null;
  closeOverlay: () => void;
  clearProjectScopedSearchState: () => void;
  resetTabsToDashboard: () => void;
  initializeData: () => Promise<void>;
  refreshCommandAvailability: () => Promise<void>;
}

export interface ProjectContextMessageActions extends ProjectSyncActions {
  messageType: 'project:switched' | 'connection:init';
  currentActiveProjectId: string | null;
  announcedActiveProjectId: string | null;
}

export async function reinitializeProjectScopedState(actions: ProjectSyncActions): Promise<void> {
  if (actions.overlay === 'project-selector') {
    actions.closeOverlay();
  }

  actions.clearProjectScopedSearchState();
  actions.resetTabsToDashboard();
  await actions.initializeData();
  await actions.refreshCommandAvailability();
}

export async function handleProjectContextMessage(
  actions: ProjectContextMessageActions
): Promise<boolean> {
  if (
    actions.messageType === 'connection:init' &&
    actions.currentActiveProjectId === actions.announcedActiveProjectId
  ) {
    return false;
  }

  await reinitializeProjectScopedState(actions);
  return true;
}
