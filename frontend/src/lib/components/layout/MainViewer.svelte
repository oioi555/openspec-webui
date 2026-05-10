<script lang="ts">
  import { decodeName } from '$lib/utils';
  import { ErrorBanner } from '$lib/components/shared/error-banner';
  import { LoadingState } from '$lib/components/shared/loading-state';
  import { error, initializeData, isLoading } from '$lib/state/appData.svelte.ts';
  import { tabStore } from '$lib/state/tabs.svelte.ts';
  import Dashboard from '$lib/views/Dashboard.svelte';
  import ChangeViewer from '$lib/views/ChangeViewer.svelte';
  import SpecViewer from '$lib/views/SpecViewer.svelte';
  import SettingsView from './SettingsView.svelte';
  import TabBar from './TabBar.svelte';

  let activeTab = $derived(tabStore.activeTab);
  let activePath = $derived(activeTab.path);
  let specName = $derived(activePath.startsWith('/specs/') ? decodeName(activePath.slice('/specs/'.length)) : null);
  let changeName = $derived(activePath.startsWith('/changes/') ? decodeName(activePath.slice('/changes/'.length)) : null);
  let settingsState = $derived(
    tabStore.getViewerState<{ initialSection?: 'general' | 'workflow' | 'commands' | 'validation' | 'versions'; requestKey?: number }>(activeTab.id)
  );
</script>

<div class="flex h-full min-h-0 min-w-0 flex-col bg-background">
  <TabBar />

  <div class="flex min-h-0 min-w-0 flex-1">
    <div class="min-h-0 min-w-0 flex-1 overflow-auto">
      {#if isLoading.value}
        <div class="mx-auto max-w-7xl px-4 py-6 lg:px-6">
          <LoadingState />
        </div>
      {:else if error.value}
        <div class="mx-auto max-w-7xl px-4 py-6 lg:px-6">
          <ErrorBanner error={error.value} onRetry={() => initializeData()} />
        </div>
      {:else if activeTab.type === 'settings'}
        <div class="mx-auto h-full w-full max-w-7xl px-4 py-6 lg:px-6">
          <SettingsView
            initialSection={settingsState?.initialSection}
            requestKey={settingsState?.requestKey}
          />
        </div>
      {:else}
        <div class="mx-auto max-w-7xl px-4 py-6 lg:px-6">
          {#if activePath === '/'}
            <Dashboard />
          {:else if specName}
            <SpecViewer specName={specName} />
          {:else if changeName}
            <ChangeViewer changeName={changeName} />
          {:else}
            <Dashboard />
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
