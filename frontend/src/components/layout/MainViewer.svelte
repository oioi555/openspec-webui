<script lang="ts">
  import { Archive, ChevronRight, FileText } from '@lucide/svelte';
  import * as Sheet from '$lib/components/ui/sheet';
  import type { Change } from '../../lib/api';
  import { activeChanges, archivedChanges, error, initializeData, isLoading, specs } from '../../stores/index.svelte.ts';
  import { layoutStore } from '../../stores/layout.svelte.ts';
  import { suggestionStore } from '../../stores/suggestions.svelte.ts';
  import { tabStore } from '../../stores/tabs.svelte.ts';
  import Dashboard from '../Dashboard.svelte';
  import ChangeViewer from '../ChangeViewer.svelte';
  import SpecViewer from '../SpecViewer.svelte';
  import SuggestionPanel from '../SuggestionPanel.svelte';
  import TabBar from './TabBar.svelte';

  function decodeName(value: string) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  let activeTab = $derived(tabStore.activeTab);
  let activePath = $derived(activeTab.path);
  let specName = $derived(activePath.startsWith('/specs/') ? decodeName(activePath.slice('/specs/'.length)) : null);
  let changeName = $derived(activePath.startsWith('/changes/') ? decodeName(activePath.slice('/changes/'.length)) : null);
  let showSuggestions = $derived(suggestionStore.isActive && changeName !== null);
  let loadedChange = $state<Change | null>(null);

  $effect(() => {
    changeName;
    loadedChange = null;
  });
</script>

<div class="flex h-full min-h-0 min-w-0 flex-col bg-background">
  <TabBar />

  <div class="flex min-h-0 min-w-0 flex-1">
    <div class="min-h-0 min-w-0 flex-1 overflow-auto">
      <div class="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      {#if isLoading.value}
        <div class="flex h-64 items-center justify-center text-muted-foreground">Loading...</div>
      {:else if error.value}
        <div class="rounded-lg border border-danger-border bg-danger-bg p-4">
          <h2 class="font-semibold text-danger">Error</h2>
          <p class="text-danger">{error.value}</p>
          <button
            class="mt-3 rounded-md bg-danger-solid px-4 py-2 text-white transition-colors hover:bg-danger-solid-hover"
            onclick={() => initializeData()}
          >
            Retry
          </button>
        </div>
      {:else if activePath === '/'}
        <Dashboard />
      {:else if activePath === '/specs'}
        <div class="space-y-6">
          <div>
            <h1 class="text-2xl font-bold text-foreground">Specifications</h1>
            <p class="mt-1 text-muted-foreground">Open a spec from the Explorer or choose one below.</p>
          </div>

          <div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            {#if specs.value.length === 0}
              <div class="px-6 py-8 text-center text-muted-foreground">No specifications found</div>
            {:else}
              <div class="divide-y divide-border">
                {#each specs.value as spec}
                  <button
                    type="button"
                    class="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-secondary/60"
                    onclick={() => tabStore.open(`/specs/${encodeURIComponent(spec.name)}`)}
                  >
                    <div class="flex items-center gap-3">
                      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success-bg text-success">
                        <FileText class="h-5 w-5" />
                      </div>
                      <div>
                        <div class="font-medium text-foreground">{spec.name}</div>
                        <div class="text-sm text-muted-foreground">{spec.hasDesign ? 'spec + design' : 'spec only'}</div>
                      </div>
                    </div>

                    <ChevronRight class="h-4 w-4 text-muted-foreground" />
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {:else if specName}
        <SpecViewer specName={specName} />
      {:else if activePath === '/changes'}
        <div class="space-y-6">
          <div>
            <h1 class="text-2xl font-bold text-foreground">Changes</h1>
            <p class="mt-1 text-muted-foreground">Open active work from Home or archived work from the Explorer.</p>
          </div>

          {#if activeChanges.value.length > 0}
            <div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div class="border-b border-border px-6 py-4">
                <h2 class="text-lg font-semibold text-foreground">Active Changes</h2>
              </div>
              <div class="divide-y divide-border">
                {#each activeChanges.value as change}
                  <button
                    type="button"
                    class="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-secondary/60"
                    onclick={() => tabStore.open(`/changes/${encodeURIComponent(change.name)}`)}
                  >
                    <div>
                      <div class="font-medium text-foreground">{change.name}</div>
                      <div class="text-sm text-muted-foreground">{change.taskProgress.done} / {change.taskProgress.total} tasks complete</div>
                    </div>

                    <ChevronRight class="h-4 w-4 text-muted-foreground" />
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div class="border-b border-border px-6 py-4">
              <h2 class="text-lg font-semibold text-foreground">Archive</h2>
            </div>

            {#if archivedChanges.value.length === 0}
              <div class="px-6 py-8 text-center text-muted-foreground">No archived changes</div>
            {:else}
              <div class="divide-y divide-border">
                {#each archivedChanges.value as change}
                  <button
                    type="button"
                    class="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-secondary/60"
                    onclick={() => tabStore.open(`/changes/${encodeURIComponent(change.name)}`)}
                  >
                    <div class="flex items-center gap-3">
                      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Archive class="h-5 w-5" />
                      </div>
                      <div>
                        <div class="font-medium text-foreground">{change.name}</div>
                        <div class="text-sm text-muted-foreground">{change.taskProgress.done} / {change.taskProgress.total} tasks complete</div>
                      </div>
                    </div>

                    <ChevronRight class="h-4 w-4 text-muted-foreground" />
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {:else if changeName}
        <ChangeViewer changeName={changeName} onChangeLoaded={(change) => (loadedChange = change)} />
      {:else}
        <Dashboard />
      {/if}
      </div>
    </div>

    {#if showSuggestions && changeName && layoutStore.responsiveMode !== 'narrow'}
      <div class="flex h-full w-(--suggestion-panel-width) shrink-0 border-l border-border bg-card">
        <SuggestionPanel {changeName} change={loadedChange} />
      </div>
    {/if}
  </div>

  {#if showSuggestions && changeName && layoutStore.responsiveMode === 'narrow'}
    <Sheet.Root open={showSuggestions} onOpenChange={(open) => !open && suggestionStore.exitSuggestionMode()}>
      <Sheet.Overlay />
      <Sheet.Content side="right" aria-label="Suggestions" class="w-[min(24rem,calc(100vw-2rem))] border-l border-border p-0">
      <SuggestionPanel {changeName} change={loadedChange} />
      </Sheet.Content>
    </Sheet.Root>
  {/if}
</div>
