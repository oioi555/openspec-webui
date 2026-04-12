<script lang="ts">
  
  import { decodeName } from '$lib/utils';
  import { ErrorBanner } from '$lib/components/ui/error-banner';
  import { LoadingState } from '$lib/components/ui/loading-state';
  import * as Sheet from '$lib/components/ui/sheet';
  import type { Change } from '../../lib/api';
  import { error, initializeData, isLoading } from '../../stores/index.svelte.ts';
  import { layoutStore } from '../../stores/layout.svelte.ts';
  import { suggestionStore } from '../../stores/suggestions.svelte.ts';
  import { tabStore } from '../../stores/tabs.svelte.ts';
  import Dashboard from '../Dashboard.svelte';
  import ChangeViewer from '../ChangeViewer.svelte';
  import SpecViewer from '../SpecViewer.svelte';
  import SuggestionPanel from '../SuggestionPanel.svelte';
  import TabBar from './TabBar.svelte';

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
        <LoadingState />
      {:else if error.value}
        <ErrorBanner error={error.value} onRetry={() => initializeData()} />
      {:else if activePath === '/'}
        <Dashboard />
      {:else if specName}
        <SpecViewer specName={specName} />
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
