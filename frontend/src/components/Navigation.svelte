<script lang="ts">
  import { currentRoute, navigateTo, searchQuery, specs, archivedChanges } from '../stores/index.svelte.ts';
  import { search, type SearchResult } from '../lib/api';
  import Icon from './Icon.svelte';
  import SettingsModal from './SettingsModal.svelte';

  interface Props {
    projectName: string;
  }

  let { projectName }: Props = $props();

  let searchResults = $state<SearchResult[]>([]);
  let showResults = $state(false);
  let settingsOpen = $state(false);
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  function handleSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    searchQuery.value = query;

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

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
    searchQuery.value = '';
  }

  $effect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  });
</script>

<nav class="bg-surface shadow-lg border-b border-border">
  <div class="max-w-7xl mx-auto px-4">
    <div class="flex justify-between h-16">
      <div class="flex items-center space-x-8">
        <!-- Logo/Title -->
        <button
          class="text-xl font-bold text-brand hover:text-brand-hover"
          onclick={() => navigateTo('/')}
        >
          {projectName}
        </button>

        <!-- Nav Links -->
        <div class="flex space-x-4">
          <button
            class="px-3 py-2 rounded-md text-sm font-medium transition-colors {currentRoute.value.startsWith('/specs')
              ? 'bg-input-bg text-brand'
              : 'text-on-surface hover:bg-surface'}"
            onclick={() => navigateTo('/specs')}
          >
            Specs
            <span class="ml-1 px-1.5 py-0.5 text-xs bg-input-border text-on-surface rounded-full">{specs.value.length}</span>
          </button>
          <button
            class="px-3 py-2 rounded-md text-sm font-medium transition-colors {currentRoute.value.startsWith('/changes')
              ? 'bg-input-bg text-brand'
              : 'text-on-surface hover:bg-surface'}"
            onclick={() => navigateTo('/changes')}
          >
            Changes
            <span class="ml-1 px-1.5 py-0.5 text-xs bg-input-border text-on-surface rounded-full">{archivedChanges.value.length}</span>
          </button>
        </div>
      </div>

      <!-- Search + Settings -->
      <div class="flex items-center gap-3">
        <div class="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery.value}
            oninput={handleSearch}
            onfocus={() => searchQuery.value.length >= 2 && (showResults = true)}
            onblur={() => setTimeout(() => (showResults = false), 200)}
            class="w-64 px-4 py-2 bg-input-bg border border-input-border text-on-surface placeholder-on-surface-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />

          {#if showResults && searchResults.length > 0}
            <div class="absolute top-full right-0 mt-1 w-96 bg-surface border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {#each searchResults as result}
                <button
                  class="w-full px-4 py-3 text-left hover:bg-surface border-b border-border last:border-b-0"
                  onclick={() => selectResult(result)}
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="px-2 py-0.5 text-xs rounded {result.type === 'spec'
                        ? 'bg-success-bg text-success'
                        : result.type === 'change'
                          ? 'bg-info-bg text-info'
                          : 'bg-input-bg text-on-surface'}"
                    >
                      {result.type}
                    </span>
                    <span class="font-medium text-on-bg">{result.name}</span>
                  </div>
                  <p class="text-sm text-on-surface-muted mt-1 truncate">{result.excerpt}</p>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <button
          type="button"
          aria-label="Open settings"
          title="Settings"
          class="rounded-lg border border-input-border bg-input-bg p-2 text-on-surface transition-colors hover:bg-input-border hover:text-on-bg"
          onclick={() => (settingsOpen = true)}
        >
          <Icon name="gear" class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</nav>

<SettingsModal open={settingsOpen} onClose={() => (settingsOpen = false)} />
