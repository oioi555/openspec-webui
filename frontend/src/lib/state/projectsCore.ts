import type { ProjectListResponse } from '../types/api';

export const ACTIVE_PROJECT_SESSION_STORAGE_KEY = 'openspec-active-project-id';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ProjectSelectionResolution {
  activeProjectId: string | null;
  preferredProjectId: string | null;
}

export interface ProjectBindResolution {
  targetProjectId: string | null;
  authoritativeProjectId: string | null;
  hasPendingBind: boolean;
  force?: boolean;
}

function getSessionStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage !== undefined) {
    return storage;
  }

  if (typeof globalThis.sessionStorage === 'undefined') {
    return null;
  }

  return globalThis.sessionStorage;
}

function hasProject(snapshot: Pick<ProjectListResponse, 'projects'>, projectId: string | null): projectId is string {
  return projectId !== null && snapshot.projects.some((project) => project.id === projectId);
}

export function loadPreferredProjectId(storage?: StorageLike | null): string | null {
  const targetStorage = getSessionStorage(storage);

  if (!targetStorage) {
    return null;
  }

  try {
    const storedValue = targetStorage.getItem(ACTIVE_PROJECT_SESSION_STORAGE_KEY);
    return storedValue && storedValue.trim() ? storedValue : null;
  } catch {
    return null;
  }
}

export function persistPreferredProjectId(projectId: string | null, storage?: StorageLike | null): void {
  const targetStorage = getSessionStorage(storage);

  if (!targetStorage) {
    return;
  }

  try {
    if (projectId) {
      targetStorage.setItem(ACTIVE_PROJECT_SESSION_STORAGE_KEY, projectId);
      return;
    }

    targetStorage.removeItem(ACTIVE_PROJECT_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export function resolveProjectSelection(
  snapshot: Pick<ProjectListResponse, 'projects' | 'activeProjectId'>,
  preferredProjectId: string | null
): ProjectSelectionResolution {
  if (hasProject(snapshot, preferredProjectId)) {
    return {
      activeProjectId: preferredProjectId,
      preferredProjectId,
    };
  }

  if (hasProject(snapshot, snapshot.activeProjectId)) {
    return {
      activeProjectId: snapshot.activeProjectId,
      preferredProjectId: null,
    };
  }

  return {
    activeProjectId: null,
    preferredProjectId: null,
  };
}

export function shouldRestoreProjectBinding(
  preferredProjectId: string | null,
  announcedActiveProjectId: string | null
): preferredProjectId is string {
  return preferredProjectId !== null && preferredProjectId !== announcedActiveProjectId;
}

export function shouldSkipProjectBind({
  targetProjectId,
  authoritativeProjectId,
  hasPendingBind,
  force = false,
}: ProjectBindResolution): boolean {
  return !force && !hasPendingBind && authoritativeProjectId === targetProjectId;
}
