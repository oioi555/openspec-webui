<script lang="ts">
  import { Clipboard, FileText, Highlighter, LoaderCircle, Search, X } from '@lucide/svelte';
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

  function previewTextForResult(result: SearchResult) {
    if (result.matchSource === 'name') {
      return t(m.search_match_name, { value: result.excerpt });
    }

    if (result.matchSource === 'path') {
      return t(m.search_match_path, { value: result.excerpt });
    }

    return result.excerpt;
  }

  function toggleViewerHighlights() {
    uiPreferencesStore.setSearchHighlightsEnabled(!uiPreferencesStore.searchHighlightsEnabled);
  }
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <div class="shrink-0 border-b border-border bg-card px-3 py-3">
    <div class="mb-3 flex min-w-0 items-center gap-2">
      <Search class="h-4 w-4 shrink-0 text-muted-foreground" />
      <div class="min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {t(m.search_panel_title)}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        class={`size-7 rounded-md border ${uiPreferencesStore.searchHighlightsEnabled
          ? 'border-warning-border bg-warning-bg text-warning hover:bg-warning-bg/80 hover:text-warning'
          : 'border-border/50 text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
        aria-label={t(m.search_highlight_matches)}
        aria-pressed={uiPreferencesStore.searchHighlightsEnabled}
        title={t(m.search_highlight_matches)}
        onclick={toggleViewerHighlights}
      >
        <Highlighter class="h-3.5 w-3.5" />
      </Button>
    </div>

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
        {#if searchStore.loading}
          {FIXED_LABELS.common.loading}
        {:else if searchStore.results.length > 0}
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
          {@const previewText = previewTextForResult(result)}
          <ExplorerListItemButton
            items={menuItemsForResult(result)}
            kind={entityKind}
            name={result.name}
            active={tabStore.activeTab?.path === resultPath}
            // class={entityKind === "archived-change" ? "bg-muted/20" : ""}
            onclick={(event) => handleResultClick(event, result)}
          >
            <div class="line-clamp-2 text-xs leading-relaxed text-muted-foreground" title={previewText}>
              {previewText}
            </div>
          </ExplorerListItemButton>
        {/each}
      </div>
    {:else}
      <div class="p-3">
        <div class="rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-center">
          <div class="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {#if searchStore.loading}
              <LoaderCircle class="h-5 w-5 animate-spin" />
            {:else}
              <Search class="h-5 w-5" />
            {/if}
          </div>

          {#if searchStore.loading}
            <div class="text-sm font-medium text-foreground">{FIXED_LABELS.common.loading}</div>
            <div class="mt-2 text-xs leading-relaxed text-muted-foreground">{t(m.search_description)}</div>
          {:else if searchStore.query.length < 2}
            <div class="text-sm font-medium text-foreground">{t(m.search_panel_heading)}</div>
            <div class="mt-2 text-xs leading-relaxed text-muted-foreground">{t(m.search_description)}</div>
            <div class="mt-1 text-xs text-muted-foreground">{t(m.search_start_typing)}</div>
          {:else}
            <div class="text-sm font-medium text-foreground">{t(m.search_no_results, { query: searchStore.query })}</div>
            <div class="mt-2 text-xs leading-relaxed text-muted-foreground">{t(m.search_description)}</div>
          {/if}
        </div>
      </div>
    {/if}
  </ScrollArea.Root>
</div>
