<script lang="ts">
  import { tick } from 'svelte';
  import { Search } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { DialogHeader as SharedDialogHeader } from '$lib/components/shared/dialog-header';
  import * as Dialog from '$lib/components/ui/dialog';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';
  import { FIXED_LABELS, getSearchResultTypeLabel } from '$lib/uiText';
  import { search } from '$lib/api';
  import { searchQuery } from '$lib/state/appData.svelte.ts';
  import { tabStore } from '$lib/state/tabs.svelte.ts';
  import { layoutStore } from '$lib/state/layout.svelte.ts';
  import type { SearchResult } from '$lib/types/api';

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
      tabStore.open(`/specs/${encodeURIComponent(result.name)}`);
    } else if (result.type === 'change') {
      tabStore.open(`/changes/${encodeURIComponent(result.name)}`);
    } else {
      tabStore.open('/');
    }

    clearSearch();
    onClose();
  }

  function resultBadgeVariant(type: SearchResult['type']) {
    if (type === 'spec') {
      return 'success';
    }

    if (type === 'change') {
      return 'outline';
    }

    return 'secondary';
  }

  async function performSearch(query: string) {
    if (query.length >= 2) {
      searchResults = await search(query);
    }
  }

  $effect(() => {
    if (!open) {
      clearSearch();
      return;
    }

    const initialQuery = layoutStore.searchInitialQuery;
    if (initialQuery) {
      searchQuery.value = initialQuery;
      void performSearch(initialQuery);
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
  <Dialog.Content class="max-w-2xl gap-0 p-0 xl:max-w-3xl">
    <SharedDialogHeader
      icon={Search}
      title={FIXED_LABELS.search.title}
      description={t(m.search_description)}
      onClose={onClose}
      class="px-5 py-4"
    />

    <div class="border-b border-border px-5 py-4">
      <input
        bind:this={inputRef}
        type="text"
        placeholder={FIXED_LABELS.search.placeholder}
        value={searchQuery.value}
        oninput={handleSearch}
        class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </div>

    <div class="max-h-[60vh] overflow-y-auto px-2 py-2">
      {#if searchQuery.value.length < 2}
        <div class="px-3 py-8 text-center text-sm text-muted-foreground">{t(m.search_start_typing)}</div>
      {:else if searchResults.length === 0}
        <div class="px-3 py-8 text-center text-sm text-muted-foreground">{t(m.search_no_results, { query: searchQuery.value })}</div>
      {:else}
        {#each searchResults as result}
          <button
            type="button"
            class="flex w-full flex-col gap-2 rounded-lg px-3 py-3 text-left transition-colors hover:bg-secondary/70"
            onclick={() => openResult(result)}
          >
            <div class="flex items-center gap-2">
              <Badge variant={resultBadgeVariant(result.type)} class="text-[11px] font-medium">
                {getSearchResultTypeLabel(result.type)}
              </Badge>
              <span class="font-medium text-foreground">{result.name}</span>
            </div>
            <div class="truncate text-sm text-muted-foreground">{result.excerpt}</div>
          </button>
        {/each}
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
