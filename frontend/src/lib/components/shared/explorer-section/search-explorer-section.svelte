<script lang="ts">
  import { Clipboard, FileText, Search, X } from '@lucide/svelte';
  import { tick } from 'svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';
  import { activeChanges, archivedChanges } from '$lib/state/appData.svelte.ts';
  import { searchStore } from '$lib/state/search.svelte.ts';
  import { tabStore } from '$lib/state/tabs.svelte.ts';
  import { uiPreferencesStore } from '$lib/state/uiPreferences.svelte.ts';
  import type { SearchResult } from '$lib/types/api';
  import { FIXED_LABELS } from '$lib/uiText';
  import type { MenuItem } from '$lib/components/shared/item-context-menu';
  import { copyToClipboard } from '$lib/utils';
  import type { EntityKind } from '$lib/visualSemantics';
  import ExplorerListItemButton from './explorer-list-item-button.svelte';

  interface Props {
    onItemSelected?: () => void;
  }

  let { onItemSelected = () => {} }: Props = $props();

  let inputRef = $state<HTMLInputElement | null>(null);
  let lastFocusRequest = $state(0);

  function handleInput(event: Event) {
    searchStore.setQuery((event.target as HTMLInputElement).value);
  }

  function handleResultClick(event: MouseEvent, result: SearchResult) {
    searchStore.openResult(result, { confirmed: !uiPreferencesStore.previewTabsEnabled || event.ctrlKey });
    onItemSelected();
  }


  function copyLabelForResult(type: SearchResult['type']) {
    if (type === 'spec') {
      return t(m.copy_label_spec_name);
    }

    if (type === 'change') {
      return t(m.copy_label_change_name);
    }

    return t(m.copy_label_tab_name);
  }

  function menuItemsForResult(result: SearchResult): MenuItem[] {
    return [
      {
        label: t(m.context_menu_open_in_new_tab),
        icon: FileText,
        onSelect: () => searchStore.openResult(result, { confirmed: true }),
      },
      {
        label: t(m.context_menu_copy_name),
        icon: Clipboard,
        onSelect: () => copyToClipboard(result.name, copyLabelForResult(result.type)),
      },
    ];
  }

  function entityKindForResult(result: SearchResult): EntityKind {
    if (result.type === 'spec') {
      return 'spec';
    }

    if (result.type === 'project') {
      return 'project';
    }

    if (archivedChanges.value.some((change) => change.name === result.name)) {
      return 'archived-change';
    }

    if (activeChanges.value.some((change) => change.name === result.name)) {
      return 'active-change';
    }

    return 'active-change';
  }

  $effect(() => {
    const focusRequest = searchStore.focusRequest;
    if (focusRequest === lastFocusRequest) {
      return;
    }

    lastFocusRequest = focusRequest;
    void tick().then(() => inputRef?.focus());
  });
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <div class="shrink-0 border-b border-border bg-card px-3 py-3">
    <div class="mb-3 flex min-w-0 items-center gap-2">
      <Search class="h-4 w-4 shrink-0 text-muted-foreground" />
      <div class="min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {t(m.search_panel_title)}
      </div>
      {#if searchStore.results.length > 0}
        <Badge
          variant="secondary"
          class="shrink-0 text-[11px] font-medium"
        >
          {searchStore.results.length}
        </Badge>
      {/if}
    </div>

    <p class="mb-3 text-xs leading-relaxed text-muted-foreground">{t(m.search_description)}</p>

      <div class="relative">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          bind:this={inputRef}
          type="text"
          aria-label={t(m.search_placeholder)}
          placeholder={t(m.search_placeholder)}
          value={searchStore.query}
          oninput={handleInput}
          class="w-full rounded-md border border-input bg-background py-2 pl-9 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        {#if searchStore.query || searchStore.results.length > 0}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={t(m.search_clear)}
            onclick={() => searchStore.clear()}
          >
            <X class="h-3.5 w-3.5" />
          </Button>
        {/if}
      </div>

      <div class="mt-2 text-xs text-muted-foreground">
        {#if searchStore.query.length < 2}
          {t(m.search_start_typing)}
        {:else if searchStore.loading}
          {FIXED_LABELS.common.loading}
        {:else if searchStore.results.length === 0}
          {t(m.search_no_results, { query: searchStore.query })}
        {:else}
        {t(m.search_result_count, { count: searchStore.results.length })}
        {/if}
      </div>
  </div>

  <ScrollArea.Root class="min-h-0 flex-1" viewportClass="h-full">
    {#if searchStore.results.length > 0}
      <div>
        {#each searchStore.results as result}
          {@const resultPath = searchStore.pathForResult(result)}
          {@const entityKind = entityKindForResult(result)}
          <ExplorerListItemButton
            items={menuItemsForResult(result)}
            kind={entityKind}
            name={result.name}
            active={tabStore.activeTab?.path === resultPath}
            // class={entityKind === "archived-change" ? "bg-muted/20" : ""}
            onclick={(event) => handleResultClick(event, result)}
          >
            <div class="line-clamp-2 text-xs leading-relaxed text-muted-foreground" title={result.excerpt} >
              {result.excerpt}
            </div>
          </ExplorerListItemButton>
        {/each}
      </div>
    {/if}
  </ScrollArea.Root>
</div>
