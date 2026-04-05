export interface Suggestion {
  id: string;
  blockId: string;
  originalText: string;
  suggestedChange: string;
}

export interface SuggestionState {
  isActive: boolean;
  currentChange: string;
  suggestions: Suggestion[];
  selectedBlockId: string | null;
  popoverPosition: { x: number; y: number } | null;
}

const STORAGE_KEY_PREFIX = 'openspec-suggestions-';

function loadSuggestions(changeName: string): Suggestion[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + changeName);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSuggestions(changeName: string, suggestions: Suggestion[]) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    if (suggestions.length === 0) {
      localStorage.removeItem(STORAGE_KEY_PREFIX + changeName);
    } else {
      localStorage.setItem(STORAGE_KEY_PREFIX + changeName, JSON.stringify(suggestions));
    }
  } catch {
    // Ignore storage errors.
  }
}

function createSuggestionStore() {
  const state = $state<SuggestionState>({
    isActive: false,
    currentChange: '',
    suggestions: [],
    selectedBlockId: null,
    popoverPosition: null,
  });

  const suggestionMap = $derived.by(() => {
    const map = new Map<string, Suggestion>();
    for (const suggestion of state.suggestions) {
      map.set(suggestion.blockId, suggestion);
    }
    return map;
  });

  function persistSuggestions(suggestions: Suggestion[]) {
    if (state.currentChange) {
      saveSuggestions(state.currentChange, suggestions);
    }
  }

  return {
    get isActive() {
      return state.isActive;
    },

    get currentChange() {
      return state.currentChange;
    },

    get suggestions() {
      return state.suggestions;
    },

    get selectedBlockId() {
      return state.selectedBlockId;
    },

    get popoverPosition() {
      return state.popoverPosition;
    },

    get blockSuggestionMap() {
      return suggestionMap;
    },

    enterSuggestionMode(changeName: string) {
      state.isActive = true;
      state.currentChange = changeName;
      state.suggestions = loadSuggestions(changeName);
      state.selectedBlockId = null;
      state.popoverPosition = null;
    },

    exitSuggestionMode() {
      persistSuggestions(state.suggestions);

      state.isActive = false;
      state.currentChange = '';
      state.suggestions = [];
      state.selectedBlockId = null;
      state.popoverPosition = null;
    },

    selectBlock(blockId: string, position: { x: number; y: number }) {
      state.selectedBlockId = blockId;
      state.popoverPosition = position;
    },

    clearSelection() {
      state.selectedBlockId = null;
      state.popoverPosition = null;
    },

    addSuggestion(blockId: string, originalText: string, suggestedChange: string) {
      const nextSuggestions = [
        ...state.suggestions,
        {
          id: crypto.randomUUID(),
          blockId,
          originalText,
          suggestedChange,
        },
      ];

      persistSuggestions(nextSuggestions);
      state.suggestions = nextSuggestions;
      state.selectedBlockId = null;
      state.popoverPosition = null;
    },

    updateSuggestion(id: string, suggestedChange: string) {
      const nextSuggestions = state.suggestions.map((suggestion) =>
        suggestion.id === id ? { ...suggestion, suggestedChange } : suggestion
      );

      persistSuggestions(nextSuggestions);
      state.suggestions = nextSuggestions;
    },

    removeSuggestion(id: string) {
      const nextSuggestions = state.suggestions.filter((suggestion) => suggestion.id !== id);
      persistSuggestions(nextSuggestions);
      state.suggestions = nextSuggestions;
    },

    clearAllSuggestions() {
      persistSuggestions([]);
      state.suggestions = [];
    },

    reconcileSuggestions(newContent: string): number {
      let resolvedCount = 0;

      const remaining = state.suggestions.filter((suggestion) => {
        const stillExists = newContent.includes(suggestion.originalText);
        if (!stillExists) {
          resolvedCount += 1;
        }
        return stillExists;
      });

      if (resolvedCount > 0) {
        persistSuggestions(remaining);
      }

      state.suggestions = remaining;
      return resolvedCount;
    },

    getSuggestionForBlock(blockId: string): Suggestion | undefined {
      return suggestionMap.get(blockId);
    },

    hasBlockSuggestion(blockId: string): boolean {
      return suggestionMap.has(blockId);
    },
  };
}

export const suggestionStore = createSuggestionStore();

export const blockSuggestionMap = {
  get value() {
    return suggestionStore.blockSuggestionMap;
  },
};
