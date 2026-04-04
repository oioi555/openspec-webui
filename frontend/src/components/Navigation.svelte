<script lang="ts">
  import { currentRoute, navigateTo, searchQuery, specs, activeChanges, archivedChanges } from '../stores/index';
  import { search, type SearchResult } from '../lib/api';
  import CommandSettingsModal from './CommandSettingsModal.svelte';

  export let projectName: string;

  let searchResults: SearchResult[] = [];
  let showResults = false;
  let settingsOpen = false;
  let searchTimeout: ReturnType<typeof setTimeout>;

  function handleSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    searchQuery.set(query);

    clearTimeout(searchTimeout);
    if (query.length < 2) {
      searchResults = [];
      showResults = false;
      return;
    }

    searchTimeout = setTimeout(async () => {
      searchResults = await search(query);
      showResults = true;
    }, 300);
  }

  function selectResult(result: SearchResult) {
    if (result.type === 'spec') {
      navigateTo(`/specs/${result.name.replace(' (design)', '')}`);
    } else if (result.type === 'change') {
      navigateTo(`/changes/${result.name}`);
    } else {
      navigateTo('/');
    }
    showResults = false;
    searchQuery.set('');
  }

</script>

<nav class="bg-gray-800 shadow-lg border-b border-gray-700">
  <div class="max-w-7xl mx-auto px-4">
    <div class="flex justify-between h-16">
      <div class="flex items-center space-x-8">
        <!-- Logo/Title -->
        <button
          class="text-xl font-bold text-blue-400 hover:text-blue-300"
          onclick={() => navigateTo('/')}
        >
          {projectName}
        </button>

        <!-- Nav Links -->
        <div class="flex space-x-4">
          <button
            class="px-3 py-2 rounded-md text-sm font-medium transition-colors {$currentRoute.startsWith('/specs')
              ? 'bg-gray-700 text-blue-400'
              : 'text-gray-300 hover:bg-gray-700'}"
            onclick={() => navigateTo('/specs')}
          >
            Specs
            <span class="ml-1 px-1.5 py-0.5 text-xs bg-gray-600 text-gray-300 rounded-full">{$specs.length}</span>
          </button>
          <button
            class="px-3 py-2 rounded-md text-sm font-medium transition-colors {$currentRoute.startsWith('/changes')
              ? 'bg-gray-700 text-blue-400'
              : 'text-gray-300 hover:bg-gray-700'}"
            onclick={() => navigateTo('/changes')}
          >
            Changes
            <span class="ml-1 px-1.5 py-0.5 text-xs bg-gray-600 text-gray-300 rounded-full">{$archivedChanges.length}</span>
          </button>
        </div>
      </div>

      <!-- Search + Settings -->
      <div class="flex items-center gap-3">
        <div class="relative">
          <input
            type="text"
            placeholder="Search..."
            value={$searchQuery}
            oninput={handleSearch}
            onfocus={() => $searchQuery.length >= 2 && (showResults = true)}
            onblur={() => setTimeout(() => (showResults = false), 200)}
            class="w-64 px-4 py-2 bg-gray-700 border border-gray-600 text-gray-200 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {#if showResults && searchResults.length > 0}
            <div class="absolute top-full right-0 mt-1 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {#each searchResults as result}
                <button
                  class="w-full px-4 py-3 text-left hover:bg-gray-700 border-b border-gray-700 last:border-b-0"
                  onclick={() => selectResult(result)}
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="px-2 py-0.5 text-xs rounded {result.type === 'spec'
                        ? 'bg-green-900 text-green-300'
                        : result.type === 'change'
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-gray-700 text-gray-300'}"
                    >
                      {result.type}
                    </span>
                    <span class="font-medium text-gray-100">{result.name}</span>
                  </div>
                  <p class="text-sm text-gray-400 mt-1 truncate">{result.excerpt}</p>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <button
          type="button"
          aria-label="Open command settings"
          title="Command settings"
          class="rounded-lg border border-gray-600 bg-gray-700 p-2 text-gray-300 transition-colors hover:bg-gray-600 hover:text-white"
          onclick={() => (settingsOpen = true)}
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</nav>

<CommandSettingsModal open={settingsOpen} onClose={() => (settingsOpen = false)} />
