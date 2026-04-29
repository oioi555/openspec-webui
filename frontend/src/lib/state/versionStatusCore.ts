import type { VersionStatusResponse } from '$lib/types/api';

export type VersionedToolId = 'webui' | 'openspec';

export interface VersionNotificationState {
  lastNotifiedSnapshotId: string | null;
}

interface VersionNotificationAdapter {
  get(): VersionNotificationState;
  set(nextState: VersionNotificationState): void;
}

const VERSION_NOTIFICATION_STORAGE_KEY = 'openspec-version-status-notification';

export const RELEASE_PAGE_URLS: Record<VersionedToolId, string> = {
  webui: 'https://github.com/oioi555/openspec-webui/releases',
  openspec: 'https://github.com/Fission-AI/OpenSpec/releases',
};

export const UPDATE_COMMANDS = {
  webui: 'npm install -g openspec-webui@latest',
  openspec: 'npm install -g @fission-ai/openspec@latest',
  project: 'openspec update',
} as const;

export function createDefaultVersionNotificationState(): VersionNotificationState {
  return {
    lastNotifiedSnapshotId: null,
  };
}

function normalizeVersionNotificationState(value: unknown): VersionNotificationState {
  const defaults = createDefaultVersionNotificationState();

  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const candidate = value as Partial<Record<keyof VersionNotificationState, unknown>>;
  return {
    lastNotifiedSnapshotId: typeof candidate.lastNotifiedSnapshotId === 'string'
      ? candidate.lastNotifiedSnapshotId
      : defaults.lastNotifiedSnapshotId,
  };
}

export function buildLatestVersionSnapshotId(snapshot: VersionStatusResponse | null): string | null {
  if (!snapshot) {
    return null;
  }

  return JSON.stringify({
    webui: snapshot.tools.webui.latestVersion ?? null,
    openspec: snapshot.tools.openspec.latestVersion ?? null,
  });
}

export function getToolsWithAvailableUpdates(snapshot: VersionStatusResponse | null): VersionedToolId[] {
  if (!snapshot) {
    return [];
  }

  return (['webui', 'openspec'] as const).filter((toolId) => snapshot.tools[toolId].updateAvailable);
}

export function loadVersionNotificationState(): VersionNotificationState {
  if (typeof localStorage === 'undefined') {
    return createDefaultVersionNotificationState();
  }

  try {
    const stored = localStorage.getItem(VERSION_NOTIFICATION_STORAGE_KEY);
    if (!stored) {
      return createDefaultVersionNotificationState();
    }

    return normalizeVersionNotificationState(JSON.parse(stored));
  } catch {
    return createDefaultVersionNotificationState();
  }
}

function saveVersionNotificationState(state: VersionNotificationState) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(VERSION_NOTIFICATION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors.
  }
}

export function shouldNotifyForVersionSnapshot(
  snapshot: VersionStatusResponse | null,
  lastNotifiedSnapshotId: string | null
): boolean {
  const snapshotId = buildLatestVersionSnapshotId(snapshot);
  if (!snapshotId || snapshotId === lastNotifiedSnapshotId) {
    return false;
  }

  return getToolsWithAvailableUpdates(snapshot).length > 0;
}

export function createVersionNotificationStoreWithAdapter(adapter: VersionNotificationAdapter) {
  return {
    get lastNotifiedSnapshotId() {
      return adapter.get().lastNotifiedSnapshotId;
    },

    initialize() {
      adapter.set(loadVersionNotificationState());
    },

    shouldNotify(snapshot: VersionStatusResponse | null) {
      return shouldNotifyForVersionSnapshot(snapshot, adapter.get().lastNotifiedSnapshotId);
    },

    markNotified(snapshot: VersionStatusResponse | null) {
      const snapshotId = buildLatestVersionSnapshotId(snapshot);
      if (!snapshotId) {
        return;
      }

      const nextState = {
        ...adapter.get(),
        lastNotifiedSnapshotId: snapshotId,
      };

      saveVersionNotificationState(nextState);
      adapter.set(nextState);
    },
  };
}
