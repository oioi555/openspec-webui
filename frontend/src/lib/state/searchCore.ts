import { createSearchController, type SearchRequestContext } from '../components/layout/searchController';
import type { SearchResult } from '../types/api';

type SearchFunction = (query: string) => Promise<SearchResult[]>;
type Scheduler = (callback: () => void, delay: number) => unknown;
type CancelScheduler = (handle: unknown) => void;

export interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
}

interface SearchStateControllerOptions {
  state: SearchState;
  search: SearchFunction;
  minQueryLength?: number;
  schedule?: Scheduler;
  cancelSchedule?: CancelScheduler;
}

export function createDefaultSearchState(): SearchState {
  return {
    query: '',
    results: [],
    loading: false,
  };
}

export function createSearchStateController({
  state,
  search,
  minQueryLength = 2,
  schedule,
  cancelSchedule,
}: SearchStateControllerOptions) {
  const controller = createSearchController({
    search: async (query, request) => {
      state.loading = true;

      try {
        return await search(query);
      } finally {
        if (request?.isCurrent()) {
          state.loading = false;
        }
      }
    },
    updateResults: (results) => {
      state.results = results;
    },
    minQueryLength,
    schedule,
    cancelSchedule,
  });

  function syncQueryState(query: string) {
    state.query = query;

    if (query.length < minQueryLength) {
      state.loading = false;
    }
  }

  function clearState() {
    state.query = '';
    state.loading = false;
    controller.clear();
  }

  return {
    handleQueryChange(query: string) {
      syncQueryState(query);
      controller.handleQueryChange(query);
    },

    async searchImmediately(query: string) {
      syncQueryState(query);
      await controller.searchImmediately(query);
    },

    clear() {
      clearState();
    },

    resetProjectScopedState() {
      clearState();
    },

    destroy() {
      controller.destroy();
    },
  };
}

export type { SearchRequestContext };
