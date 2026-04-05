<script lang="ts">
  import { untrack } from 'svelte';
  import { getChange, getChangeFileUrl, type Change } from '../lib/api';
  import { navigateTo, changesRefreshTrigger, addToast, activeChanges } from '../stores/index.svelte.ts';
  import { suggestionStore } from '../stores/suggestions.svelte.ts';
  import { commandPreferencesStore } from '../stores/commandPreferences.svelte.ts';
  import { getChangeCommands } from '../lib/commandShortcuts';
  import MarkdownRenderer from './MarkdownRenderer.svelte';
  import HtmlRenderer from './HtmlRenderer.svelte';
  import Icon from './Icon.svelte';
  import TaskProgress from './TaskProgress.svelte';
  import SuggestionPanel from './SuggestionPanel.svelte';
  import SuggestionPopover from './SuggestionPopover.svelte';
  import CommandShortcutBar from './CommandShortcutBar.svelte';

  interface Props {
    changeName: string;
  }

  let { changeName }: Props = $props();

  let change = $state<Change | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  let activeGroupIndex = $state(0);
  let activeFileIndex = $state(0);

  let activeGroup = $derived(change?.fileGroups[activeGroupIndex] ?? null);
  let activeFile = $derived(activeGroup?.files[activeFileIndex] ?? null);
  let showDeltasTab = $derived((change?.specDeltas.length ?? 0) > 0);
  let isDeltasActive = $derived(activeGroupIndex === (change?.fileGroups.length ?? 0));
  let backLink = $derived(activeChanges.value.some((item) => item.name === changeName) ? '/' : '/changes');
  let suggestionModeActive = $derived(suggestionStore.isActive);
  let changeCommands = $derived(change ? getChangeCommands(change, commandPreferencesStore) : []);

  let previousChangeName: string | null = null;
  let previousRefreshTrigger = -1;

  async function loadChange(preserveState = false) {
    if (!preserveState) {
      loading = true;
    }

    error = null;

    const savedGroupIndex = activeGroupIndex;
    const savedFileIndex = activeFileIndex;

    try {
      change = await getChange(changeName);

      if (preserveState && change) {
        const maxGroupIndex = change.fileGroups.length + (change.specDeltas.length > 0 ? 1 : 0) - 1;
        activeGroupIndex = Math.min(savedGroupIndex, maxGroupIndex);

        const currentGroup = change.fileGroups[activeGroupIndex];
        const maxFileIndex = currentGroup ? currentGroup.files.length - 1 : 0;
        activeFileIndex = Math.min(savedFileIndex, Math.max(0, maxFileIndex));

        if (suggestionStore.isActive) {
          reconcileSuggestionsWithContent(change);
        }
      } else {
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
    const contentParts: string[] = [];

    for (const group of changeData.fileGroups) {
      for (const file of group.files) {
        if (file.type === 'markdown' && file.content) {
          contentParts.push(file.content);
        }
      }
    }

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
    activeFileIndex = 0;
  }

  function toggleSuggestionMode() {
    if (suggestionModeActive) {
      suggestionStore.exitSuggestionMode();
    } else {
      suggestionStore.enterSuggestionMode(changeName);
    }
  }

  $effect(() => {
    const refreshTrigger = changesRefreshTrigger.value;

    if (!changeName) {
      return;
    }

    const isSameChange = previousChangeName === changeName;
    const preserveState = isSameChange && refreshTrigger > previousRefreshTrigger;

    previousChangeName = changeName;
    previousRefreshTrigger = refreshTrigger;

    void untrack(() => loadChange(preserveState));
  });

  $effect(() => {
    return () => {
      if (suggestionStore.isActive) {
        suggestionStore.exitSuggestionMode();
      }
    };
  });
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <button
      type="button"
      aria-label="Back to changes list"
      title="Back to changes list"
      class="p-2 hover:bg-surface rounded-lg"
      onclick={() => navigateTo(backLink)}
    >
      <Icon name="chevron-left" class="h-5 w-5 text-on-surface-muted" />
    </button>
    <div class="flex-1">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold text-on-bg">{changeName}</h1>
        {#if change?.isArchived}
          <span class="px-2 py-1 text-xs bg-input-bg text-on-surface-muted rounded">Archived</span>
        {/if}
      </div>
      {#if change}
        <div class="flex items-center gap-4 mt-2">
          <div class="w-48">
            <TaskProgress progress={change.taskProgress} size="sm" />
          </div>
          <span class="text-sm text-on-surface-muted">
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
                 ? 'bg-brand text-on-brand'
                 : 'bg-input-bg text-on-surface hover:bg-input-border'}"
      >
        <Icon name="pencil-square" class="h-5 w-5" />
        <span class="text-sm font-medium">
          {suggestionModeActive ? 'Exit Suggestions' : 'Suggest Changes'}
        </span>
      </button>
    {/if}
  </div>

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <div class="text-on-surface-muted">Loading...</div>
    </div>
  {:else if error}
    <div class="rounded-lg border border-danger-border bg-danger-bg p-4">
      <p class="text-danger">{error}</p>
    </div>
  {:else if change}
    <!-- Primary tabs: Groups + Deltas -->
    <div class="border-b border-border">
      <nav class="flex space-x-4">
        {#each change.fileGroups as group, i}
          <button
            class="px-4 py-2 border-b-2 font-medium text-sm transition-colors {activeGroupIndex === i && !isDeltasActive
              ? 'border-brand text-brand'
              : 'border-transparent text-on-surface-muted hover:text-on-surface'}"
            onclick={() => selectGroup(i)}
          >
            {group.name}
            {#if group.files.length > 1}
              <span class="ml-1 px-1.5 py-0.5 text-xs bg-input-bg rounded-full">
                {group.files.length}
              </span>
            {/if}
          </button>
        {/each}

        {#if showDeltasTab}
          <button
            class="px-4 py-2 border-b-2 font-medium text-sm transition-colors {isDeltasActive
              ? 'border-brand text-brand'
              : 'border-transparent text-on-surface-muted hover:text-on-surface'}"
            onclick={selectDeltas}
          >
            Spec Deltas
            <span class="ml-1 px-1.5 py-0.5 text-xs bg-input-bg text-on-surface rounded-full">
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
              ? 'bg-input-bg text-on-bg'
              : 'text-on-surface-muted hover:text-on-surface hover:bg-surface'}"
            onclick={() => (activeFileIndex = i)}
          >
            {file.name}
            {#if file.type === 'html'}
              <span class="ml-1 text-xs text-html">HTML</span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Content area -->
    <div
      class="bg-surface rounded-lg shadow-lg border border-border p-6 transition-all duration-300"
      class:mr-96={suggestionModeActive}
    >
      {#if isDeltasActive}
        <!-- Spec Deltas -->
        <div class="space-y-8">
          {#each change.specDeltas as delta}
            <div>
              <h3 class="text-lg font-semibold text-on-bg mb-4 flex items-center gap-2">
                <span class="rounded px-2 py-1 text-sm bg-success-bg text-success">{delta.capability}</span>
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
