export interface ValidationPreferences {
  strict: boolean;
  concurrency: number | null;
  autoRun: boolean;
  autoRunOnArtifactChange: boolean;
}

export interface ValidationRequestOptions {
  strict: boolean;
  concurrency: number | null;
}

const STORAGE_KEY = 'openspec-validation-preferences';

interface ValidationPreferencesAdapter {
  get(): ValidationPreferences;
  set(preferences: ValidationPreferences): void;
}

export function createDefaultValidationPreferences(): ValidationPreferences {
  return {
    strict: true,
    concurrency: null,
    autoRun: false,
    autoRunOnArtifactChange: false,
  };
}

export function normalizeValidationPreferences(value: unknown): ValidationPreferences {
  const defaults = createDefaultValidationPreferences();

  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const candidate = value as Partial<Record<keyof ValidationPreferences, unknown>>;

  return {
    strict: typeof candidate.strict === 'boolean'
      ? candidate.strict
      : defaults.strict,
    concurrency:
      typeof candidate.concurrency === 'number' && Number.isInteger(candidate.concurrency) && candidate.concurrency > 0
        ? candidate.concurrency
        : defaults.concurrency,
    autoRun: typeof candidate.autoRun === 'boolean'
      ? candidate.autoRun
      : defaults.autoRun,
    autoRunOnArtifactChange: typeof candidate.autoRunOnArtifactChange === 'boolean'
      ? candidate.autoRunOnArtifactChange
      : defaults.autoRunOnArtifactChange,
  };
}

export function toValidationRequestOptions(preferences: ValidationPreferences): ValidationRequestOptions {
  return {
    strict: preferences.strict,
    concurrency: preferences.concurrency,
  };
}

export function loadValidationPreferences(): ValidationPreferences {
  if (typeof localStorage === 'undefined') {
    return createDefaultValidationPreferences();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createDefaultValidationPreferences();
    }

    return normalizeValidationPreferences(JSON.parse(stored));
  } catch {
    return createDefaultValidationPreferences();
  }
}

function saveValidationPreferences(preferences: ValidationPreferences) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore storage errors.
  }
}

export function createValidationPreferencesStoreWithAdapter(adapter: ValidationPreferencesAdapter) {
  return {
    get strict() {
      return adapter.get().strict;
    },

    get concurrency() {
      return adapter.get().concurrency;
    },

    get autoRun() {
      return adapter.get().autoRun;
    },

    get autoRunOnArtifactChange() {
      return adapter.get().autoRunOnArtifactChange;
    },

    setStrict(strict: boolean) {
      const nextPreferences = {
        ...adapter.get(),
        strict,
      };

      saveValidationPreferences(nextPreferences);
      adapter.set(nextPreferences);
    },

    setConcurrency(concurrency: number | null) {
      const nextPreferences = {
        ...adapter.get(),
        concurrency:
          concurrency !== null && Number.isInteger(concurrency) && concurrency > 0
            ? concurrency
            : null,
      };

      saveValidationPreferences(nextPreferences);
      adapter.set(nextPreferences);
    },

    setAutoRun(autoRun: boolean) {
      const nextPreferences = {
        ...adapter.get(),
        autoRun,
      };

      saveValidationPreferences(nextPreferences);
      adapter.set(nextPreferences);
    },

    setAutoRunOnArtifactChange(autoRunOnArtifactChange: boolean) {
      const nextPreferences = {
        ...adapter.get(),
        autoRunOnArtifactChange,
      };

      saveValidationPreferences(nextPreferences);
      adapter.set(nextPreferences);
    },
  };
}

export function createValidationPreferencesStore() {
  let preferences = loadValidationPreferences();

  return createValidationPreferencesStoreWithAdapter({
    get: () => preferences,
    set: (nextPreferences) => {
      preferences = nextPreferences;
    },
  });
}
