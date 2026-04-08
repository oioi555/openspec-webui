import { tick } from 'svelte';
import type { Project, Stats, SpecSummary, ChangeSummary } from '../lib/api';
import { getProject, getStats, getSpecs, getChanges } from '../lib/api';
import { wsClient, type WSMessage } from '../lib/websocket';
import { tabStore } from './tabs.svelte.ts';

type ToastType = 'info' | 'success' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

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
  toasts: [] as ToastItem[],
  specsRefreshTrigger: 0,
  changesRefreshTrigger: 0,
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

export const toasts = createBox(
  () => state.toasts,
  (value) => {
    state.toasts = value;
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

let toastId = 0;

export function addToast(message: string, type: ToastType = 'info') {
  const id = ++toastId;
  state.toasts = [...state.toasts, { id, message, type }];

  setTimeout(() => {
    state.toasts = state.toasts.filter((toast) => toast.id !== id);
  }, 3000);
}

export async function initializeData() {
  state.isLoading = true;
  state.error = null;

  try {
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
    state.error = cause instanceof Error ? cause.message : 'Failed to load data';
  } finally {
    state.isLoading = false;
  }
}

export function setupWebSocket() {
  if (typeof window === 'undefined') {
    return () => {};
  }

  wsClient.connect();

  const unsubscribe = wsClient.subscribe(async (message: WSMessage) => {
    if (message.type !== 'data:refresh') {
      return;
    }

    const entity = message.entity;
    const scrollY = window.scrollY;

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
      addToast(`Updated: ${message.entityId || entity}`, 'info');
    }

    await tick();
    window.scrollTo(0, scrollY);
  });

  return () => {
    unsubscribe();
    wsClient.disconnect();
  };
}

export function navigateTo(path: string) {
  tabStore.handlePath(path);
}
