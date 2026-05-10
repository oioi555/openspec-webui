export type TabType = 'dashboard' | 'spec' | 'change' | 'settings';

import { FIXED_LABELS } from '$lib/uiText';

export interface Tab {
  id: string;
  type: TabType;
  name: string;
  path: string;
  pinned?: boolean;
  preview?: boolean;
}

type HistoryMode = 'push' | 'replace' | 'none';

function createHomeTab(): Tab {
  return {
    id: 'dashboard:home',
    type: 'dashboard',
    name: FIXED_LABELS.common.dashboard,
    path: '/',
    pinned: true,
  };
}

function createSettingsTab(): Tab {
  return {
    id: 'settings:home',
    type: 'settings',
    name: FIXED_LABELS.common.settings,
    path: '/settings',
    pinned: false,
    preview: false,
  };
}

function isHomeTab(tab: Tab) {
  const homeTab = createHomeTab();
  return tab.id === homeTab.id || tab.path === homeTab.path;
}

function normalizePath(path: string, options?: { preserveSettings?: boolean }) {
  const trimmed = (path || '/').trim();
  const [pathname] = trimmed.split(/[?#]/, 1);
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const normalizedSectionPath = withLeadingSlash === '/specs'
    || withLeadingSlash === '/changes'
    || (!options?.preserveSettings && withLeadingSlash === '/settings')
    ? createHomeTab().path
    : withLeadingSlash;

  if (normalizedSectionPath.length > 1 && normalizedSectionPath.endsWith('/')) {
    return normalizedSectionPath.slice(0, -1);
  }

  return normalizedSectionPath || '/';
}

function getCurrentBrowserPath() {
  if (typeof window === 'undefined') {
    return createHomeTab().path;
  }

  return normalizePath(window.location.pathname);
}

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function createTabForPath(path: string): Tab {
  const normalizedPath = normalizePath(path);
  const homeTab = createHomeTab();

  if (normalizedPath === homeTab.path) {
    return homeTab;
  }

  if (normalizedPath.startsWith('/specs/')) {
    const name = decodeSegment(normalizedPath.slice('/specs/'.length));
    return {
      id: `spec:${name}`,
      type: 'spec',
      name,
      path: `/specs/${encodeURIComponent(name)}`,
      pinned: false,
    };
  }

  if (normalizedPath.startsWith('/changes/')) {
    const name = decodeSegment(normalizedPath.slice('/changes/'.length));
    return {
      id: `change:${name}`,
      type: 'change',
      name,
      path: `/changes/${encodeURIComponent(name)}`,
      pinned: false,
    };
  }

  return homeTab;
}

function normalizeTabOrder(tabs: Tab[]) {
  const pinnedTabs = tabs.filter((tab) => tab.pinned);
  const regularTabs = tabs.filter((tab) => !tab.pinned);
  return [...pinnedTabs, ...regularTabs];
}

function clampIndex(index: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), max);
}

function getLookupKeys(tabIdOrPath: string) {
  if (!tabIdOrPath.startsWith('/')) {
    return [tabIdOrPath];
  }

  const normalizedPath = normalizePath(tabIdOrPath);
  const canonicalPath = createTabForPath(normalizedPath).path;
  return normalizedPath === canonicalPath ? [canonicalPath] : [normalizedPath, canonicalPath];
}

export type SettingsSection = 'general' | 'workflow' | 'commands' | 'validation' | 'versions';

interface OpenSettingsOptions {
  initialSection?: SettingsSection;
}

interface SettingsViewerState {
  initialSection?: SettingsSection;
  requestKey?: number;
}

export function createTabsStore() {
  const initialTab = createTabForPath(getCurrentBrowserPath());
  const initialTabs = isHomeTab(initialTab)
    ? [createHomeTab()]
    : normalizeTabOrder([createHomeTab(), initialTab]);

  const state = $state({
    tabs: initialTabs,
    activeTabId: initialTab.id,
    viewerStates: {} as Record<string, unknown>,
  });

  function syncBrowserPath(path: string, history: HistoryMode) {
    if (typeof window === 'undefined' || history === 'none') {
      return;
    }

    if (window.location.pathname === path) {
      return;
    }

    const method = history === 'replace' ? 'replaceState' : 'pushState';
    window.history[method]({}, '', path);
  }

  function getTabIndex(tabIdOrPath: string) {
    const lookupKeys = getLookupKeys(tabIdOrPath);
    return state.tabs.findIndex((tab) => lookupKeys.includes(tab.id) || lookupKeys.includes(tab.path));
  }

  function activateTab(index: number, history: HistoryMode = 'push') {
    const tab = state.tabs[index];
    if (!tab) {
      return null;
    }

    state.activeTabId = tab.id;
    syncBrowserPath(tab.path, history);
    return tab;
  }

  function getTab(tabIdOrPath: string) {
    const lookupKeys = getLookupKeys(tabIdOrPath);
    return state.tabs.find((tab) => lookupKeys.includes(tab.id) || lookupKeys.includes(tab.path)) ?? null;
  }

  function ensureFallbackTab(history: HistoryMode = 'push') {
    if (state.tabs.length > 0) {
      return null;
    }

    const homeTab = createHomeTab();
    state.tabs = [homeTab];
    state.activeTabId = homeTab.id;
    syncBrowserPath(homeTab.path, history);
    return state.tabs[0];
  }

  function upsertTab(tabInput: string | Tab, history: HistoryMode = 'push') {
    const requestedPath = typeof tabInput === 'string'
      ? normalizePath(tabInput)
      : normalizePath(tabInput.path, { preserveSettings: tabInput.type === 'settings' });
    const normalizedTab = typeof tabInput === 'string' ? createTabForPath(requestedPath) : {
      ...tabInput,
      path: normalizePath(tabInput.path, { preserveSettings: tabInput.type === 'settings' }),
    };

    const existingIndex = state.tabs.findIndex((tab) => tab.path === normalizedTab.path);
    const resolvedHistory = normalizedTab.path === requestedPath ? history : history === 'push' ? 'replace' : history;

    if (existingIndex >= 0) {
      const existingTab = state.tabs[existingIndex];
      state.tabs = state.tabs.map((tab, index) => index === existingIndex ? {
        ...existingTab,
        ...normalizedTab,
        pinned: normalizedTab.pinned ?? existingTab.pinned ?? false,
        preview: normalizedTab.preview ?? false,
      } : tab);
      activateTab(existingIndex, resolvedHistory);
      return state.tabs[existingIndex];
    }

    state.tabs = normalizeTabOrder([...state.tabs, normalizedTab]);
    const nextIndex = state.tabs.findIndex((tab) => tab.path === normalizedTab.path);
    activateTab(nextIndex, resolvedHistory);
    return state.tabs[nextIndex];
  }

  return {
    get tabs() {
      return state.tabs;
    },

    get activeTabId() {
      return state.activeTabId;
    },

    get activeTab() {
      return state.tabs.find((tab) => tab.id === state.activeTabId) ?? state.tabs[0] ?? createHomeTab();
    },

    get currentPath() {
      return this.activeTab.path;
    },

    open(pathOrTab: string | Tab) {
      return upsertTab(pathOrTab, 'push');
    },

    openConfirmed(pathOrTab: string | Tab) {
      return upsertTab(pathOrTab, 'push');
    },

    openSettings(options?: OpenSettingsOptions) {
      const settingsTab = createSettingsTab();
      if (options?.initialSection) {
        state.viewerStates[settingsTab.id] = {
          ...(state.viewerStates[settingsTab.id] as SettingsViewerState | undefined),
          initialSection: options.initialSection,
          requestKey: Date.now(),
        };
      }

      const existing = getTab(settingsTab.id);
      if (existing) {
        return this.focus(settingsTab.id);
      }

      return upsertTab(settingsTab, 'push');
    },

    openPreview(pathOrTab: string | Tab) {
      const requestedPath = typeof pathOrTab === 'string'
        ? normalizePath(pathOrTab)
        : normalizePath(pathOrTab.path, { preserveSettings: pathOrTab.type === 'settings' });
      const normalizedTab = typeof pathOrTab === 'string'
        ? createTabForPath(requestedPath)
        : {
            ...pathOrTab,
            path: normalizePath(pathOrTab.path, { preserveSettings: pathOrTab.type === 'settings' }),
          };
      const previewTab: Tab = {
        ...normalizedTab,
        pinned: false,
        preview: true,
      };
      const resolvedHistory = previewTab.path === requestedPath ? 'replace' : 'replace';

      const confirmedIndex = state.tabs.findIndex((tab) => tab.path === previewTab.path && tab.preview !== true);
      if (confirmedIndex >= 0) {
        activateTab(confirmedIndex, resolvedHistory);
        return state.tabs[confirmedIndex];
      }

      const existingPreviewIndex = state.tabs.findIndex((tab) => tab.path === previewTab.path && tab.preview === true && !tab.pinned);
      if (existingPreviewIndex >= 0) {
        activateTab(existingPreviewIndex, resolvedHistory);
        return state.tabs[existingPreviewIndex];
      }

      const reusablePreviewIndex = state.tabs.findIndex((tab) => tab.preview === true && !tab.pinned);
      if (reusablePreviewIndex >= 0) {
        const existingPreviewTab = state.tabs[reusablePreviewIndex];
        state.tabs = state.tabs.map((tab, index) => index === reusablePreviewIndex
          ? {
              ...existingPreviewTab,
              ...previewTab,
              pinned: false,
              preview: true,
            }
          : tab);
        activateTab(reusablePreviewIndex, resolvedHistory);
        return state.tabs[reusablePreviewIndex];
      }

      state.tabs = normalizeTabOrder([...state.tabs, previewTab]);
      const nextIndex = state.tabs.findIndex((tab) => tab.path === previewTab.path && tab.preview === true);
      activateTab(nextIndex, resolvedHistory);
      return state.tabs[nextIndex];
    },

    handlePath(path: string, options?: { history?: HistoryMode }) {
      return upsertTab(path, options?.history ?? 'push');
    },

    focus(tabIdOrPath: string) {
      const index = getTabIndex(tabIdOrPath);
      return index >= 0 ? activateTab(index, 'push') : null;
    },

    confirmTab(tabIdOrPath: string) {
      const index = getTabIndex(tabIdOrPath);
      if (index < 0) {
        return null;
      }

      const currentTab = state.tabs[index];
      if (!currentTab?.preview) {
        return currentTab ?? null;
      }

      state.tabs = state.tabs.map((tab, tabIndex) => tabIndex === index
        ? {
            ...tab,
            preview: false,
          }
        : tab);

      return getTab(tabIdOrPath);
    },

    confirmAllPreviewTabs() {
      state.tabs = state.tabs.map((tab) => tab.preview
        ? {
            ...tab,
            preview: false,
          }
        : tab);

      return state.tabs;
    },

    close(tabIdOrPath: string) {
      const index = getTabIndex(tabIdOrPath);
      if (index < 0) {
        return null;
      }

      const closingTab = state.tabs[index];
      if (closingTab.pinned) {
        return closingTab;
      }

      const wasActive = closingTab.id === state.activeTabId;
      const nextTabs = state.tabs.filter((_, tabIndex) => tabIndex !== index);

      state.tabs = nextTabs;
      delete state.viewerStates[closingTab.id];

      if (!wasActive) {
        return getTab(state.activeTabId);
      }

      if (state.tabs.length === 0) {
        return ensureFallbackTab('push');
      }

      const nextIndex = clampIndex(index, state.tabs.length - 1);
      return activateTab(nextIndex, 'push');
    },

    closeOthers(tabIdOrPath: string) {
      const targetIndex = getTabIndex(tabIdOrPath);
      if (targetIndex < 0) {
        return null;
      }

      const targetTab = state.tabs[targetIndex];
      state.tabs = normalizeTabOrder(
        state.tabs.filter((tab) => tab.pinned || tab.id === targetTab.id)
      );
      return activateTab(
        state.tabs.findIndex((tab) => tab.id === targetTab.id),
        'push'
      );
    },

    closeAll() {
      state.tabs = normalizeTabOrder(
        state.tabs.filter((tab) => tab.pinned)
      );
      if (state.tabs.length === 0) {
        return ensureFallbackTab('push');
      }
      return activateTab(0, 'push');
    },

    reorder(fromIndex: number, toIndex: number) {
      if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= state.tabs.length) {
        return;
      }

      const targetIndex = clampIndex(toIndex, state.tabs.length - 1);
      const nextTabs = [...state.tabs];
      const [movedTab] = nextTabs.splice(fromIndex, 1);
      nextTabs.splice(targetIndex, 0, movedTab);
      state.tabs = normalizeTabOrder(nextTabs);
    },

    pin(tabIdOrPath: string) {
      const index = getTabIndex(tabIdOrPath);
      if (index < 0) {
        return null;
      }

      state.tabs = normalizeTabOrder(
        state.tabs.map((tab, tabIndex) => tabIndex === index ? { ...tab, pinned: true, preview: false } : tab)
      );

      return getTab(tabIdOrPath);
    },

    unpin(tabIdOrPath: string) {
      const index = getTabIndex(tabIdOrPath);
      if (index < 0) {
        return null;
      }

      const currentTab = state.tabs[index];
      if (!currentTab || isHomeTab(currentTab)) {
        return currentTab ?? null;
      }

      state.tabs = normalizeTabOrder(
        state.tabs.map((tab, tabIndex) => tabIndex === index ? { ...tab, pinned: false } : tab)
      );

      return getTab(tabIdOrPath);
    },

    getViewerState<T = unknown>(tabId: string): T | undefined {
      return state.viewerStates[tabId] as T | undefined;
    },

    setViewerState(tabId: string, data: unknown) {
      state.viewerStates[tabId] = data;
    },

    clearViewerState(tabId: string) {
      delete state.viewerStates[tabId];
    },
  };
}

export const tabStore = createTabsStore();

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    tabStore.handlePath(window.location.pathname, { history: 'none' });
  });
}
