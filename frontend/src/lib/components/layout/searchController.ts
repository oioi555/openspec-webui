import type { SearchResult } from '../../types/api';

type SearchFunction = (query: string) => Promise<SearchResult[]>;
type UpdateResults = (results: SearchResult[]) => void;
type Scheduler = (callback: () => void, delay: number) => unknown;
type CancelScheduler = (handle: unknown) => void;

interface SearchControllerOptions {
  search: SearchFunction;
  updateResults: UpdateResults;
  debounceMs?: number;
  minQueryLength?: number;
  schedule?: Scheduler;
  cancelSchedule?: CancelScheduler;
}

export function createSearchController({
  search,
  updateResults,
  debounceMs = 300,
  minQueryLength = 2,
  schedule = (callback, delay) => setTimeout(callback, delay),
  cancelSchedule = (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
}: SearchControllerOptions) {
  let currentQuery = '';
  let currentToken = 0;
  let pendingHandle: unknown = null;

  function clearPendingTimer() {
    if (pendingHandle === null) {
      return;
    }

    cancelSchedule(pendingHandle);
    pendingHandle = null;
  }

  function invalidate(query = '') {
    currentToken += 1;
    currentQuery = query;
    clearPendingTimer();
  }

  async function runSearch(query: string, token: number) {
    if (token !== currentToken || query !== currentQuery) {
      return;
    }

    const results = await search(query);

    if (token !== currentToken || query !== currentQuery) {
      return;
    }

    updateResults(results);
  }

  function handleQueryChange(query: string) {
    invalidate(query);

    if (query.length < minQueryLength) {
      updateResults([]);
      return;
    }

    const token = currentToken;
    pendingHandle = schedule(() => {
      pendingHandle = null;
      void runSearch(query, token);
    }, debounceMs);
  }

  async function searchImmediately(query: string) {
    invalidate(query);

    if (query.length < minQueryLength) {
      updateResults([]);
      return;
    }

    await runSearch(query, currentToken);
  }

  function clear() {
    invalidate('');
    updateResults([]);
  }

  function destroy() {
    invalidate('');
  }

  return {
    handleQueryChange,
    searchImmediately,
    clear,
    destroy,
  };
}
