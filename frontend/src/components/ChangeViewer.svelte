<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getChange, getChangeFileUrl, type Change, type FileGroup, type ChangeFile } from '../lib/api';
  import { navigateTo, changesRefreshTrigger, addToast, activeChanges } from '../stores/index';
  import { suggestionStore } from '../stores/suggestions';
  import { commandPreferencesStore } from '../stores/commandPreferences';
  import { getChangeCommands } from '../lib/commandShortcuts';
  import MarkdownRenderer from './MarkdownRenderer.svelte';
  import HtmlRenderer from './HtmlRenderer.svelte';
  import TaskProgress from './TaskProgress.svelte';
  import SuggestionPanel from './SuggestionPanel.svelte';
  import SuggestionPopover from './SuggestionPopover.svelte';
  import CommandShortcutBar from './CommandShortcutBar.svelte';

  export let changeName: string;

  let change: Change | null = null;
  let loading = true;
  let error: string | null = null;
  let lastRefreshTrigger = 0;

  // Two-level navigation state
  let activeGroupIndex = 0;
  let activeFileIndex = 0;

  // Computed: current group and file
  $: activeGroup = change?.fileGroups[activeGroupIndex] ?? null;
  $: activeFile = activeGroup?.files[activeFileIndex] ?? null;

  // Special handling for deltas tab (always last if present)
  $: showDeltasTab = (change?.specDeltas.length ?? 0) > 0;
  $: isDeltasActive = activeGroupIndex === (change?.fileGroups.length ?? 0);

  onMount(async () => {
    await loadChange();
    lastRefreshTrigger = $changesRefreshTrigger;
  });

  // React to WebSocket refresh signals - preserve navigation state on hot reload
  $: if ($changesRefreshTrigger > lastRefreshTrigger) {
    lastRefreshTrigger = $changesRefreshTrigger;
    loadChange(true);
  }

  async function loadChange(preserveState = false) {
    // Only show loading state on initial load, not hot reload
    if (!preserveState) {
      loading = true;
    }
    error = null;

    // Save current navigation state for hot reload
    const savedGroupIndex = activeGroupIndex;
    const savedFileIndex = activeFileIndex;

    try {
      change = await getChange(changeName);

      if (preserveState && change) {
        // Restore navigation state, validating indices are still valid
        const maxGroupIndex = change.fileGroups.length + (change.specDeltas.length > 0 ? 1 : 0) - 1;
        activeGroupIndex = Math.min(savedGroupIndex, maxGroupIndex);

        const currentGroup = change.fileGroups[activeGroupIndex];
        const maxFileIndex = currentGroup ? currentGroup.files.length - 1 : 0;
        activeFileIndex = Math.min(savedFileIndex, Math.max(0, maxFileIndex));

        // Reconcile suggestions on hot-reload if suggestion mode is active
        if ($suggestionStore.isActive) {
          reconcileSuggestionsWithContent(change);
        }
      } else {
        // Reset selection on initial load or navigation
        activeGroupIndex = 0;
        activeFileIndex = 0;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load change';
    } finally {
      loading = false;
    }
  }

  function reconcileSuggestionsWithContent(changeData: Change) {
    // Gather all markdown content from the change
    const contentParts: string[] = [];

    // Add content from all markdown files in all groups
    for (const group of changeData.fileGroups) {
      for (const file of group.files) {
        if (file.type === 'markdown' && file.content) {
          contentParts.push(file.content);
        }
      }
    }

    // Add content from spec deltas
    for (const delta of changeData.specDeltas) {
      contentParts.push(delta.content);
    }

    const combinedContent = contentParts.join('\n');
    const resolvedCount = suggestionStore.reconcileSuggestions(combinedContent);

    if (resolvedCount > 0) {
      const message = resolvedCount === 1
        ? '1 suggestion resolved'
        : `${resolvedCount} suggestions resolved`;
      addToast(message, 'success');
    }
  }

  function selectGroup(index: number) {
    activeGroupIndex = index;
    activeFileIndex = 0;
  }

  function selectDeltas() {
    activeGroupIndex = change?.fileGroups.length ?? 0;
  }

  $: if (changeName) loadChange();

  // Determine back link based on whether the change is active or archived
  $: backLink = $activeChanges.some(c => c.name === changeName) ? '/' : '/changes';

  // Suggestion mode state
  $: suggestionModeActive = $suggestionStore.isActive;
  $: changeCommands = change ? getChangeCommands(change, $commandPreferencesStore) : [];

  function toggleSuggestionMode() {
    if (suggestionModeActive) {
      suggestionStore.exitSuggestionMode();
    } else {
      suggestionStore.enterSuggestionMode(changeName);
    }
  }

  // Exit suggestion mode when navigating away
  onDestroy(() => {
    if ($suggestionStore.isActive) {
      suggestionStore.exitSuggestionMode();
    }
  });

</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <button
      type="button"
      aria-label="Back to changes list"
      title="Back to changes list"
      class="p-2 hover:bg-gray-700 rounded-lg"
      onclick={() => navigateTo(backLink)}
    >
      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <div class="flex-1">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold text-gray-100">{changeName}</h1>
        {#if change?.isArchived}
          <span class="px-2 py-1 text-xs bg-gray-700 text-gray-400 rounded">Archived</span>
        {/if}
      </div>
      {#if change}
        <div class="flex items-center gap-4 mt-2">
          <div class="w-48">
            <TaskProgress progress={change.taskProgress} size="sm" />
          </div>
          <span class="text-sm text-gray-400">
            {change.taskProgress.done} of {change.taskProgress.total} tasks complete
          </span>
        </div>
      {/if}
    </div>
    <CommandShortcutBar commands={changeCommands} changeName={change?.name ?? null} />
    <!-- Suggest Changes button -->
    {#if !change?.isArchived}
      <button
        onclick={toggleSuggestionMode}
        class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
               {suggestionModeActive
                 ? 'bg-blue-600 text-white'
                 : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span class="text-sm font-medium">
          {suggestionModeActive ? 'Exit Suggestions' : 'Suggest Changes'}
        </span>
      </button>
    {/if}
  </div>

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <div class="text-gray-400">Loading...</div>
    </div>
  {:else if error}
    <div class="bg-red-900/50 border border-red-700 rounded-lg p-4">
      <p class="text-red-300">{error}</p>
    </div>
  {:else if change}
    <!-- Primary tabs: Groups + Deltas -->
    <div class="border-b border-gray-700">
      <nav class="flex space-x-4">
        {#each change.fileGroups as group, i}
          <button
            class="px-4 py-2 border-b-2 font-medium text-sm transition-colors {activeGroupIndex === i && !isDeltasActive
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'}"
            onclick={() => selectGroup(i)}
          >
            {group.name}
            {#if group.files.length > 1}
              <span class="ml-1 px-1.5 py-0.5 text-xs bg-gray-700 rounded-full">
                {group.files.length}
              </span>
            {/if}
          </button>
        {/each}

        {#if showDeltasTab}
          <button
            class="px-4 py-2 border-b-2 font-medium text-sm transition-colors {isDeltasActive
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'}"
            onclick={selectDeltas}
          >
            Spec Deltas
            <span class="ml-1 px-1.5 py-0.5 text-xs bg-gray-700 text-gray-300 rounded-full">
              {change.specDeltas.length}
            </span>
          </button>
        {/if}
      </nav>
    </div>

    <!-- Secondary tabs: Files within group (if multiple) -->
    {#if activeGroup && activeGroup.files.length > 1 && !isDeltasActive}
      <div class="flex space-x-2 px-2">
        {#each activeGroup.files as file, i}
          <button
            class="px-3 py-1.5 text-sm rounded-md transition-colors {activeFileIndex === i
              ? 'bg-gray-700 text-gray-100'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'}"
            onclick={() => (activeFileIndex = i)}
          >
            {file.name}
            {#if file.type === 'html'}
              <span class="ml-1 text-xs text-orange-400">HTML</span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Content area -->
    <div
      class="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 transition-all duration-300"
      class:mr-96={suggestionModeActive}
    >
      {#if isDeltasActive}
        <!-- Spec Deltas -->
        <div class="space-y-8">
          {#each change.specDeltas as delta}
            <div>
              <h3 class="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <span class="px-2 py-1 text-sm bg-green-900 text-green-300 rounded">{delta.capability}</span>
              </h3>
              <MarkdownRenderer content={delta.content} highlightDiff={true} suggestionModeEnabled={suggestionModeActive} />
            </div>
          {/each}
        </div>
      {:else if activeFile}
        {#if activeFile.type === 'markdown' && activeFile.content}
          <MarkdownRenderer
            content={activeFile.content}
            suggestionModeEnabled={suggestionModeActive}
          />
        {:else if activeFile.type === 'html'}
          <HtmlRenderer
            src={getChangeFileUrl(changeName, activeFile.path)}
            title={activeFile.name}
          />
        {/if}
      {/if}
    </div>

    <!-- Suggestion Mode Components -->
    {#if suggestionModeActive}
      <SuggestionPanel {changeName} {change} />
      <SuggestionPopover />
    {/if}
  {/if}
</div>
