import { isOpenFilesWith, type OpenFilesWith } from '../markdownLinks';

export interface UiPreferences {
  previewTabsEnabled: boolean;
  searchHighlightsEnabled: boolean;
  openFilesWith: OpenFilesWith;
  customEditorTemplate: string;
}

const STORAGE_KEY = 'openspec-ui-preferences';

interface UiPreferencesAdapter {
  get(): UiPreferences;
  set(preferences: UiPreferences): void;
}

export function createDefaultUiPreferences(): UiPreferences {
  return {
    previewTabsEnabled: true,
    searchHighlightsEnabled: true,
    openFilesWith: 'copy',
    customEditorTemplate: '',
  };
}

function normalizeUiPreferences(value: unknown): UiPreferences {
  const defaults = createDefaultUiPreferences();

  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const candidate = value as Partial<Record<keyof UiPreferences, unknown>>;

  return {
    previewTabsEnabled: typeof candidate.previewTabsEnabled === 'boolean'
      ? candidate.previewTabsEnabled
      : defaults.previewTabsEnabled,
    searchHighlightsEnabled: typeof candidate.searchHighlightsEnabled === 'boolean'
      ? candidate.searchHighlightsEnabled
      : defaults.searchHighlightsEnabled,
    openFilesWith: isOpenFilesWith(candidate.openFilesWith)
      ? candidate.openFilesWith
      : defaults.openFilesWith,
    customEditorTemplate: typeof candidate.customEditorTemplate === 'string'
      ? candidate.customEditorTemplate
      : defaults.customEditorTemplate,
  };
}

export function loadUiPreferences(): UiPreferences {
  if (typeof localStorage === 'undefined') {
    return createDefaultUiPreferences();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createDefaultUiPreferences();
    }

    return normalizeUiPreferences(JSON.parse(stored));
  } catch {
    return createDefaultUiPreferences();
  }
}

function saveUiPreferences(preferences: UiPreferences) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore storage errors.
  }
}

export function createUiPreferencesStoreWithAdapter(adapter: UiPreferencesAdapter) {
  return {
    get previewTabsEnabled() {
      return adapter.get().previewTabsEnabled;
    },

    get searchHighlightsEnabled() {
      return adapter.get().searchHighlightsEnabled;
    },

    get openFilesWith() {
      return adapter.get().openFilesWith;
    },

    get customEditorTemplate() {
      return adapter.get().customEditorTemplate;
    },

    initialize() {
      adapter.set(loadUiPreferences());
    },

    setPreviewTabsEnabled(previewTabsEnabled: boolean) {
      const nextPreferences = {
        ...adapter.get(),
        previewTabsEnabled,
      };

      saveUiPreferences(nextPreferences);
      adapter.set(nextPreferences);
    },

    setSearchHighlightsEnabled(searchHighlightsEnabled: boolean) {
      const nextPreferences = {
        ...adapter.get(),
        searchHighlightsEnabled,
      };

      saveUiPreferences(nextPreferences);
      adapter.set(nextPreferences);
    },

    setOpenFilesWith(openFilesWith: OpenFilesWith) {
      const nextPreferences = {
        ...adapter.get(),
        openFilesWith,
      };

      saveUiPreferences(nextPreferences);
      adapter.set(nextPreferences);
    },

    setCustomEditorTemplate(customEditorTemplate: string) {
      const nextPreferences = {
        ...adapter.get(),
        customEditorTemplate,
      };

      saveUiPreferences(nextPreferences);
      adapter.set(nextPreferences);
    },
  };
}

export function createUiPreferencesStore() {
  let preferences = loadUiPreferences();

  return createUiPreferencesStoreWithAdapter({
    get: () => preferences,
    set: (nextPreferences) => {
      preferences = nextPreferences;
    },
  });
}
