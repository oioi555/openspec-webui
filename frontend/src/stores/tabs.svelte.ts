export type TabType = 'dashboard' | 'spec' | 'change';

export interface Tab {
  id: string;
  type: TabType;
  name: string;
  path: string;
  pinned?: boolean;
}

type HistoryMode = 'push' | 'replace' | 'none';

const HOME_TAB: Tab = {
  id: 'dashboard:home',
  type: 'dashboard',
  name: 'Home',
  path: '/',
  pinned: true,
};

function isHomeTab(tab: Tab) {
  return tab.id === HOME_TAB.id || tab.path === HOME_TAB.path;
}

function normalizePath(path: string) {
  const trimmed = (path || '/').trim();
  const [pathname] = trimmed.split(/[?#]/, 1);
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;

  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')) {
    return withLeadingSlash.slice(0, -1);
  }

  return withLeadingSlash || '/';
}

function getCurrentBrowserPath() {
  if (typeof window === 'undefined') {
    return HOME_TAB.path;
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

  if (normalizedPath === HOME_TAB.path) {
    return { ...HOME_TAB };
  }

  if (normalizedPath === '/specs') {
    return {
      id: 'spec:list',
      type: 'spec',
      name: 'Specs',
      path: normalizedPath,
      pinned: false,
    };
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

  if (normalizedPath === '/changes') {
    return {
      id: 'change:list',
      type: 'change',
      name: 'Changes',
      path: normalizedPath,
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

  return { ...HOME_TAB };
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

function createTabsStore() {
  const initialTab = createTabForPath(getCurrentBrowserPath());
  const initialTabs = isHomeTab(initialTab)
    ? [{ ...HOME_TAB }]
    : normalizeTabOrder([{ ...HOME_TAB }, initialTab]);

  const state = $state({
    tabs: initialTabs,
    activeTabId: initialTab.id,
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

    state.tabs = [{ ...HOME_TAB }];
    state.activeTabId = HOME_TAB.id;
    syncBrowserPath(HOME_TAB.path, history);
    return state.tabs[0];
  }

  function upsertTab(tabInput: string | Tab, history: HistoryMode = 'push') {
    const requestedPath = typeof tabInput === 'string' ? normalizePath(tabInput) : normalizePath(tabInput.path);
    const normalizedTab = typeof tabInput === 'string' ? createTabForPath(requestedPath) : {
      ...tabInput,
      path: normalizePath(tabInput.path),
    };

    const existingIndex = state.tabs.findIndex((tab) => tab.path === normalizedTab.path);
    const resolvedHistory = normalizedTab.path === requestedPath ? history : history === 'push' ? 'replace' : history;

    if (existingIndex >= 0) {
      const existingTab = state.tabs[existingIndex];
      state.tabs = state.tabs.map((tab, index) => index === existingIndex ? {
        ...existingTab,
        ...normalizedTab,
        pinned: normalizedTab.pinned ?? existingTab.pinned ?? false,
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
      return state.tabs.find((tab) => tab.id === state.activeTabId) ?? state.tabs[0] ?? HOME_TAB;
    },

    get currentPath() {
      return this.activeTab.path;
    },

    open(pathOrTab: string | Tab) {
      return upsertTab(pathOrTab, 'push');
    },

    handlePath(path: string, options?: { history?: HistoryMode }) {
      return upsertTab(path, options?.history ?? 'push');
    },

    focus(tabIdOrPath: string) {
      const index = getTabIndex(tabIdOrPath);
      return index >= 0 ? activateTab(index, 'push') : null;
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
        state.tabs.map((tab, tabIndex) => tabIndex === index ? { ...tab, pinned: true } : tab)
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
  };
}

export const tabStore = createTabsStore();

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    tabStore.handlePath(window.location.pathname, { history: 'none' });
  });
}
