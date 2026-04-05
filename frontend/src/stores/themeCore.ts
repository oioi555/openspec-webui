export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'openspec-theme';

interface ThemeAdapter {
  get(): Theme;
  set(theme: Theme): void;
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') {
    return;
  }

  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
    return;
  }

  document.documentElement.setAttribute('data-theme', theme);
}

export function loadTheme(): Theme {
  if (typeof localStorage === 'undefined') {
    return 'dark';
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Ignore storage errors.
  }

  return 'dark';
}

function saveTheme(theme: Theme) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors.
  }
}

export function createThemeStoreWithAdapter(adapter: ThemeAdapter) {
  let mediaQuery: MediaQueryList | null = null;
  let mediaHandler: ((event: MediaQueryListEvent) => void) | null = null;

  function detachMediaListener() {
    if (mediaQuery && mediaHandler) {
      mediaQuery.removeEventListener('change', mediaHandler);
    }

    mediaQuery = null;
    mediaHandler = null;
  }

  return {
    get value() {
      return adapter.get();
    },

    initialize() {
      const theme = loadTheme();
      adapter.set(theme);
      applyTheme(theme);

      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return;
      }

      detachMediaListener();

      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaHandler = () => {
        if (adapter.get() === 'system') {
          applyTheme('system');
        }
      };

      mediaQuery.addEventListener('change', mediaHandler);
    },

    setTheme(theme: Theme) {
      saveTheme(theme);
      adapter.set(theme);
      applyTheme(theme);
    },

    destroy() {
      detachMediaListener();
    },
  };
}

export function createThemeStore() {
  let value = loadTheme();

  return createThemeStoreWithAdapter({
    get: () => value,
    set: (theme: Theme) => {
      value = theme;
    },
  });
}
