import { tick } from 'svelte';
import { search as searchApi } from '$lib/api';
import { searchQuery } from '$lib/state/appData.svelte.ts';
import { layoutStore } from '$lib/state/layout.svelte.ts';
import { tabStore } from '$lib/state/tabs.svelte.ts';
import type { SearchResult } from '$lib/types/api';
import { createSearchController } from '$lib/components/layout/searchController';

export const SEARCH_MIN_QUERY_LENGTH = 2;

const state = $state({
  results: [] as SearchResult[],
  loading: false,
  focusRequest: 0,
});

const controller = createSearchController({
  search: async (query) => {
    state.loading = true;

    try {
      return await searchApi(query);
    } finally {
      state.loading = false;
    }
  },
  updateResults: (results) => {
    state.results = results;
  },
  minQueryLength: SEARCH_MIN_QUERY_LENGTH,
});

function focusExplorerSearch() {
  layoutStore.setActivityPreset('search');
  state.focusRequest += 1;
}

function pathForResult(result: SearchResult) {
  if (result.type === 'spec') {
    return `/specs/${encodeURIComponent(result.name)}`;
  }

  if (result.type === 'change') {
    return `/changes/${encodeURIComponent(result.name)}`;
  }

  return '/';
}

export const searchStore = {
  get query() {
    return searchQuery.value;
  },

  get results() {
    return state.results;
  },

  get loading() {
    return state.loading;
  },

  get focusRequest() {
    return state.focusRequest;
  },

  open(query?: string) {
    focusExplorerSearch();

    if (query != null) {
      searchQuery.value = query;
      void controller.searchImmediately(query);
    }

    void tick().then(() => {
      state.focusRequest += 1;
    });
  },

  setQuery(query: string) {
    searchQuery.value = query;
    controller.handleQueryChange(query);
  },

  clear() {
    searchQuery.value = '';
    state.loading = false;
    controller.clear();
  },

  pathForResult,

  openResult(result: SearchResult, options?: { confirmed?: boolean }) {
    const path = pathForResult(result);

    if (options?.confirmed) {
      tabStore.openConfirmed(path);
      return;
    }

    tabStore.openPreview(path);
  },
};
