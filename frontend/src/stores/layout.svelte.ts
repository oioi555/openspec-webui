export type ActivityPreset = 'home' | 'archive' | 'specs';
export type ExplorerSection = 'active-changes' | 'archive' | 'specs';
export type ResponsiveMode = 'narrow' | 'wide';
export type LayoutOverlay = 'search' | 'settings' | 'project-selector' | 'add-project' | null;

const STORAGE_KEY = 'openspec-layout';
const DEFAULT_EXPLORER_WIDTH = 280;
const MIN_EXPLORER_WIDTH = 180;
const MAX_EXPLORER_WIDTH = 600;
export const DESKTOP_BREAKPOINT = 960;

const PRESET_SECTION_MAP: Record<ActivityPreset, ExplorerSection> = {
  home: 'active-changes',
  archive: 'archive',
  specs: 'specs',
};

const SECTION_PRESET_MAP: Record<ExplorerSection, ActivityPreset> = {
  'active-changes': 'home',
  archive: 'archive',
  specs: 'specs',
};

type PersistedLayoutState = {
  explorerCollapsed?: unknown;
  rememberedExplorerWidth?: unknown;
  sectionCollapsed?: Partial<Record<ExplorerSection, unknown>>;
};

function clampWidth(width: number) {
  return Math.min(Math.max(width, MIN_EXPLORER_WIDTH), MAX_EXPLORER_WIDTH);
}

function getResponsiveMode(width: number): ResponsiveMode {
  if (width <= DESKTOP_BREAKPOINT) {
    return 'narrow';
  }

  return 'wide';
}

function createDefaultSectionState() {
  return {
    'active-changes': false,
    archive: true,
    specs: true,
  } as Record<ExplorerSection, boolean>;
}

function createPresetSectionState(section: ExplorerSection) {
  return {
    'active-changes': section !== 'active-changes',
    archive: section !== 'archive',
    specs: section !== 'specs',
  } as Record<ExplorerSection, boolean>;
}

function loadPersistedState() {
  const defaults = {
    explorerCollapsed: false,
    rememberedExplorerWidth: DEFAULT_EXPLORER_WIDTH,
    sectionCollapsed: createDefaultSectionState(),
  };

  if (typeof localStorage === 'undefined') {
    return defaults;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaults;
    }

    const parsed = JSON.parse(stored) as PersistedLayoutState;
    const sectionCollapsed = createDefaultSectionState();

    for (const section of Object.keys(sectionCollapsed) as ExplorerSection[]) {
      if (typeof parsed.sectionCollapsed?.[section] === 'boolean') {
        sectionCollapsed[section] = parsed.sectionCollapsed[section] as boolean;
      }
    }

    return {
      explorerCollapsed: typeof parsed.explorerCollapsed === 'boolean' ? parsed.explorerCollapsed : defaults.explorerCollapsed,
      rememberedExplorerWidth: typeof parsed.rememberedExplorerWidth === 'number'
        ? clampWidth(parsed.rememberedExplorerWidth)
        : defaults.rememberedExplorerWidth,
      sectionCollapsed,
    };
  } catch {
    return defaults;
  }
}

function savePersistedState(state: {
  explorerCollapsed: boolean;
  rememberedExplorerWidth: number;
  sectionCollapsed: Record<ExplorerSection, boolean>;
}) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        explorerCollapsed: state.explorerCollapsed,
        rememberedExplorerWidth: state.rememberedExplorerWidth,
        sectionCollapsed: state.sectionCollapsed,
      })
    );
  } catch {
    // Ignore storage errors.
  }
}

function createLayoutStore() {
  const persistedState = loadPersistedState();
  const initialResponsiveMode = typeof window === 'undefined' ? 'wide' : getResponsiveMode(window.innerWidth);

  const state = $state({
    explorerCollapsed: persistedState.explorerCollapsed,
    explorerWidth: persistedState.rememberedExplorerWidth,
    rememberedExplorerWidth: persistedState.rememberedExplorerWidth,
    activityPreset: 'home' as ActivityPreset,
    focusedSection: PRESET_SECTION_MAP.home,
    sectionCollapsed: persistedState.sectionCollapsed,
    responsiveMode: initialResponsiveMode,
    narrowDrawerOpen: false,
    overlay: null as LayoutOverlay,
    searchInitialQuery: '',
  });

  let initialized = false;

  function persist() {
    savePersistedState({
      explorerCollapsed: state.explorerCollapsed,
      rememberedExplorerWidth: state.rememberedExplorerWidth,
      sectionCollapsed: state.sectionCollapsed,
    });
  }

  function applyResponsiveMode(width = typeof window === 'undefined' ? 1280 : window.innerWidth) {
    state.responsiveMode = getResponsiveMode(width);

    if (state.responsiveMode !== 'narrow') {
      state.narrowDrawerOpen = false;
    }
  }

  function focusSection(section: ExplorerSection) {
    state.activityPreset = SECTION_PRESET_MAP[section];
    state.focusedSection = section;
    state.sectionCollapsed = {
      ...state.sectionCollapsed,
      [section]: false,
    };
    persist();
  }

  function initialize() {
    if (initialized || typeof window === 'undefined') {
      return;
    }

    initialized = true;
    applyResponsiveMode(window.innerWidth);
    window.addEventListener('resize', () => applyResponsiveMode(window.innerWidth));
  }

  return {
    get explorerCollapsed() {
      return state.explorerCollapsed;
    },

    get explorerWidth() {
      return state.explorerCollapsed ? 0 : state.explorerWidth;
    },

    get rememberedExplorerWidth() {
      return state.rememberedExplorerWidth;
    },

    get activityPreset() {
      return state.activityPreset;
    },

    get focusedSection() {
      return state.focusedSection;
    },

    get sectionCollapsed() {
      return state.sectionCollapsed;
    },

    get responsiveMode() {
      return state.responsiveMode;
    },

    get narrowDrawerOpen() {
      return state.narrowDrawerOpen;
    },

    get overlay() {
      return state.overlay;
    },

    get searchInitialQuery() {
      return state.searchInitialQuery;
    },

    initialize,

    setExplorerCollapsed(collapsed: boolean) {
      state.explorerCollapsed = collapsed;

      if (!collapsed) {
        state.explorerWidth = state.rememberedExplorerWidth;
      }

      persist();
    },

    toggleExplorerCollapsed() {
      this.setExplorerCollapsed(!state.explorerCollapsed);
    },

    setExplorerWidth(width: number) {
      const clampedWidth = clampWidth(width);
      state.explorerWidth = clampedWidth;
      state.rememberedExplorerWidth = clampedWidth;
      state.explorerCollapsed = false;
      persist();
    },

    setActivityPreset(preset: ActivityPreset, options?: { openDrawerInNarrow?: boolean }) {
      const section = PRESET_SECTION_MAP[preset];

      state.activityPreset = preset;
      state.focusedSection = section;
      state.sectionCollapsed = createPresetSectionState(section);

      if (options?.openDrawerInNarrow !== false && state.responsiveMode === 'narrow') {
        state.narrowDrawerOpen = true;
      } else {
        state.explorerCollapsed = false;
        state.explorerWidth = state.rememberedExplorerWidth;
      }

      persist();
    },

    syncActivityPreset(preset: ActivityPreset) {
      state.activityPreset = preset;
      state.focusedSection = PRESET_SECTION_MAP[preset];
    },

    focusSection,

    setSectionCollapsed(section: ExplorerSection, collapsed: boolean) {
      state.sectionCollapsed = {
        ...state.sectionCollapsed,
        [section]: collapsed,
      };
      persist();
    },

    toggleSection(section: ExplorerSection) {
      this.setSectionCollapsed(section, !state.sectionCollapsed[section]);
    },

    setNarrowDrawerOpen(open: boolean) {
      state.narrowDrawerOpen = state.responsiveMode === 'narrow' ? open : false;
    },

    toggleNarrowDrawer() {
      this.setNarrowDrawerOpen(!state.narrowDrawerOpen);
    },

    openOverlay(overlay: Exclude<LayoutOverlay, null>, options?: { initialQuery?: string }) {
      state.overlay = overlay;
      state.searchInitialQuery = options?.initialQuery ?? '';
    },

    closeOverlay() {
      state.overlay = null;
      state.searchInitialQuery = '';
    },

    toggleOverlay(overlay: Exclude<LayoutOverlay, null>) {
      state.overlay = state.overlay === overlay ? null : overlay;
    },
  };
}

export const layoutStore = createLayoutStore();
layoutStore.initialize();
