<script lang="ts">
  import { tick } from 'svelte';
  import { Search, X } from '@lucide/svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { search, type SearchResult } from '../../lib/api';
  import { searchQuery } from '../../stores/index.svelte.ts';
  import { tabStore } from '../../stores/tabs.svelte.ts';

  interface Props {
    open?: boolean;
    onClose?: () => void;
  }

  let { open = false, onClose = () => {} }: Props = $props();

  let searchResults = $state<SearchResult[]>([]);
  let searchTimeout = $state<ReturnType<typeof setTimeout> | null>(null);
  let inputRef = $state<HTMLInputElement | null>(null);

  function clearSearch() {
    searchQuery.value = '';
    searchResults = [];
  }

  async function handleSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    searchQuery.value = query;

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length < 2) {
      searchResults = [];
      return;
    }

    searchTimeout = setTimeout(async () => {
      searchResults = await search(query);
    }, 300);
  }

  function openResult(result: SearchResult) {
    if (result.type === 'spec') {
      tabStore.open(`/specs/${encodeURIComponent(result.name.replace(' (design)', ''))}`);
    } else if (result.type === 'change') {
      tabStore.open(`/changes/${encodeURIComponent(result.name)}`);
    } else {
      tabStore.open('/');
    }

    clearSearch();
    onClose();
  }

  $effect(() => {
    if (!open) {
      clearSearch();
      return;
    }

    void tick().then(() => inputRef?.focus());
  });

  $effect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  });
</script>

<Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
  <Dialog.Overlay />
  <Dialog.Content class="max-w-2xl gap-0 p-0">
    <div class="flex items-center justify-between border-b border-border px-5 py-4">
      <div class="flex items-center gap-3">
        <Search class="h-5 w-5 text-primary" />
        <div>
          <Dialog.Title class="text-lg font-semibold text-foreground">Search</Dialog.Title>
          <Dialog.Description class="text-sm text-muted-foreground">Type at least 2 characters to search specs, changes, and project docs.</Dialog.Description>
        </div>
      </div>

      <button
        type="button"
        class="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Close search"
        onclick={onClose}
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <div class="border-b border-border px-5 py-4">
      <input
        bind:this={inputRef}
        type="text"
        placeholder="Search workspace..."
        value={searchQuery.value}
        oninput={handleSearch}
        class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </div>

    <div class="max-h-96 overflow-y-auto px-2 py-2">
      {#if searchQuery.value.length < 2}
        <div class="px-3 py-8 text-center text-sm text-muted-foreground">Start typing to search the workspace.</div>
      {:else if searchResults.length === 0}
        <div class="px-3 py-8 text-center text-sm text-muted-foreground">No results found for “{searchQuery.value}”.</div>
      {:else}
        {#each searchResults as result}
          <button
            type="button"
            class="flex w-full flex-col gap-2 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent"
            onclick={() => openResult(result)}
          >
            <div class="flex items-center gap-2">
              <span class={`rounded-full px-2 py-0.5 text-[11px] font-medium ${result.type === 'spec'
                ? 'bg-success-bg text-success'
                : result.type === 'change'
                  ? 'bg-info-bg text-info'
                  : 'bg-secondary text-secondary-foreground'}`}>
                {result.type}
              </span>
              <span class="font-medium text-foreground">{result.name}</span>
            </div>
            <div class="truncate text-sm text-muted-foreground">{result.excerpt}</div>
          </button>
        {/each}
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
