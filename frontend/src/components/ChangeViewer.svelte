<script lang="ts">
  import { untrack } from 'svelte';
  import { Archive, SquarePen } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { ErrorBanner } from '$lib/components/ui/error-banner';
  import { IconBox } from '$lib/components/ui/icon-box';
  import { LoadingState } from '$lib/components/ui/loading-state';
  import { UnderlineTabs } from '$lib/components/ui/underline-tabs';
  import { getChange, getChangeFileUrl, type Change } from '../lib/api';
  import { changesRefreshTrigger, addToast } from '../stores/index.svelte.ts';
  import { suggestionStore } from '../stores/suggestions.svelte.ts';
  import { commandPreferencesStore } from '../stores/commandPreferences.svelte.ts';
  import { getChangeCommands } from '../lib/commandShortcuts';
  import MarkdownRenderer from './MarkdownRenderer.svelte';
  import HtmlRenderer from './HtmlRenderer.svelte';
  import TaskProgress from './TaskProgress.svelte';
  import SuggestionPopover from './SuggestionPopover.svelte';
  import CommandShortcutBar from './CommandShortcutBar.svelte';

  interface Props {
    changeName: string;
    onChangeLoaded?: (change: Change | null) => void;
  }

  let { changeName, onChangeLoaded = () => {} }: Props = $props();

  let change = $state<Change | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  let activeGroupIndex = $state(0);
  let activeFileIndex = $state(0);

  let activeGroup = $derived(change?.fileGroups[activeGroupIndex] ?? null);
  let activeFile = $derived(activeGroup?.files[activeFileIndex] ?? null);
  let showDeltasTab = $derived((change?.specDeltas.length ?? 0) > 0);
  let isDeltasActive = $derived(activeGroupIndex === (change?.fileGroups.length ?? 0));
  let suggestionModeActive = $derived(suggestionStore.isActive);
  let changeCommands = $derived(change ? getChangeCommands(change, commandPreferencesStore) : []);
  let primaryTabs = $derived(
    change
      ? [
        ...change.fileGroups.map((group, index) => ({
          id: `group-${index}`,
          label: group.name,
          badge: group.files.length > 1 ? group.files.length : undefined,
        })),
        ...(showDeltasTab
          ? [{ id: 'spec-deltas', label: 'Spec Deltas', badge: change.specDeltas.length }]
          : []),
      ]
      : []
  );
  let activePrimaryTabId = $derived(isDeltasActive ? 'spec-deltas' : `group-${activeGroupIndex}`);

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
      onChangeLoaded(change);

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
      onChangeLoaded(null);
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

  function handlePrimaryTabSelect(id: string) {
    if (id === 'spec-deltas') {
      selectDeltas();
      return;
    }

    if (id.startsWith('group-')) {
      const index = Number(id.slice('group-'.length));
      if (!Number.isNaN(index)) {
        selectGroup(index);
      }
    }
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
      onChangeLoaded(null);

      if (suggestionStore.isActive) {
        suggestionStore.exitSuggestionMode();
      }
    };
  });
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-wrap items-start gap-4">
    <div class="flex-1">
      <div class="flex items-center gap-3">
        {#if change?.isArchived}
          <IconBox icon={Archive} variant="muted" />
        {:else}
          <IconBox icon={SquarePen} variant="info" />
        {/if}
        <h1 class="text-2xl font-bold text-foreground">{changeName}</h1>
        {#if change?.isArchived}
          <Badge variant="secondary">Archived</Badge>
        {/if}
      </div>
      {#if change}
        <div class="flex items-center gap-4 mt-2">
          <span class="text-sm text-muted-foreground">
            {change.taskProgress.done} of {change.taskProgress.total} tasks complete
          </span>
          <div class="w-48">
            <TaskProgress progress={change.taskProgress} size="sm" />
          </div>
        </div>
      {/if}
    </div>

    <div class="flex flex-col items-stretch gap-3 sm:items-end">
      {#if changeCommands.length > 0}
        <div class="flex max-w-full justify-end sm:max-w-md">
          <CommandShortcutBar commands={changeCommands} changeName={change?.name ?? null} />
        </div>
      {/if}

      {#if !change?.isArchived}
        <div class="flex justify-end">
          <Button variant={suggestionModeActive ? 'default' : 'secondary'} onclick={toggleSuggestionMode}>
            <SquarePen class="h-5 w-5" />
            <span>{suggestionModeActive ? 'Exit' : 'Suggest'}</span>
          </Button>
        </div>
      {/if}
    </div>
  </div>

  {#if loading}
    <LoadingState />
  {:else if error}
    <ErrorBanner {error} />
  {:else if change}
    <!-- Primary tabs: Groups + Deltas -->
    <UnderlineTabs tabs={primaryTabs} activeId={activePrimaryTabId} onSelect={handlePrimaryTabSelect} />

    <!-- Secondary tabs: Files within group (if multiple) -->
    {#if activeGroup && activeGroup.files.length > 1 && !isDeltasActive}
      <div class="flex space-x-2 px-2">
        {#each activeGroup.files as file, i}
            <button
              class="px-3 py-1.5 text-sm rounded-md transition-colors {activeFileIndex === i
              ? 'bg-secondary text-foreground'
              : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'}"
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
    <div class="rounded-lg border border-border bg-card p-6 shadow-lg">
      {#if isDeltasActive}
        <!-- Spec Deltas -->
        <div class="space-y-8">
          {#each change.specDeltas as delta}
            <div>
              <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <Badge variant="success" class="px-2 py-1 text-sm">{delta.capability}</Badge>
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
      <SuggestionPopover />
    {/if}
  {/if}
</div>
