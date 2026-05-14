import type { WSDataRefreshMessage } from '$lib/websocket';

const DEFAULT_DEBOUNCE_MS = 600;

type RelevantRefreshMessage = Pick<WSDataRefreshMessage, 'entity' | 'cause'>;
type TimerHandle = ReturnType<typeof setTimeout>;

export interface ArtifactValidationSchedulerDependencies {
  getProjectId: () => string | null;
  isAutoRunEnabled: () => boolean;
  isValidationLoading: () => boolean;
  refreshValidation: () => void | Promise<unknown>;
  debounceMs?: number;
  setTimeoutFn?: (callback: () => void, delay: number) => TimerHandle;
  clearTimeoutFn?: (handle: TimerHandle) => void;
}

function normalizePath(path: string | undefined): string | null {
  if (!path) {
    return null;
  }

  return path.replaceAll('\\', '/');
}

export function isRelevantArtifactRefresh(message: RelevantRefreshMessage): boolean {
  const cause = message.cause;
  const normalizedPath = normalizePath(cause?.path);

  if (!cause || !normalizedPath) {
    return false;
  }

  if (cause.type !== 'add' && cause.type !== 'change' && cause.type !== 'unlink') {
    return false;
  }

  if (!normalizedPath.toLowerCase().endsWith('.md')) {
    return false;
  }

  if (message.entity === 'specs') {
    return normalizedPath.includes('/specs/');
  }

  if (message.entity !== 'changes') {
    return false;
  }

  return normalizedPath.includes('/changes/') && !normalizedPath.includes('/changes/archive/');
}

export function createArtifactValidationScheduler(dependencies: ArtifactValidationSchedulerDependencies) {
  const debounceMs = dependencies.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const setTimeoutFn = dependencies.setTimeoutFn ?? ((callback: () => void, delay: number) => setTimeout(callback, delay));
  const clearTimeoutFn = dependencies.clearTimeoutFn ?? ((handle: TimerHandle) => clearTimeout(handle));

  let pendingTimer: TimerHandle | null = null;
  let pendingProjectId: string | null = null;
  let lastKnownProjectId = dependencies.getProjectId();

  function cancel() {
    if (pendingTimer) {
      clearTimeoutFn(pendingTimer);
      pendingTimer = null;
    }

    pendingProjectId = null;
  }

  function syncProject() {
    const nextProjectId = dependencies.getProjectId();
    if (nextProjectId === lastKnownProjectId) {
      return false;
    }

    lastKnownProjectId = nextProjectId;
    cancel();
    return true;
  }

  function flush() {
    pendingTimer = null;

    const currentProjectId = dependencies.getProjectId();
    if (!currentProjectId || currentProjectId !== pendingProjectId || !dependencies.isAutoRunEnabled()) {
      pendingProjectId = null;
      return;
    }

    if (dependencies.isValidationLoading()) {
      pendingTimer = setTimeoutFn(flush, debounceMs);
      return;
    }

    pendingProjectId = null;
    void dependencies.refreshValidation();
  }

  function schedule() {
    const currentProjectId = dependencies.getProjectId();
    if (!currentProjectId || !dependencies.isAutoRunEnabled()) {
      return false;
    }

    pendingProjectId = currentProjectId;

    if (pendingTimer) {
      clearTimeoutFn(pendingTimer);
    }

    pendingTimer = setTimeoutFn(flush, debounceMs);
    return true;
  }

  return {
    cancel,
    syncProject,
    handleRefreshMessage(message: RelevantRefreshMessage) {
      syncProject();

      if (!isRelevantArtifactRefresh(message)) {
        return false;
      }

      return schedule();
    },
  };
}
