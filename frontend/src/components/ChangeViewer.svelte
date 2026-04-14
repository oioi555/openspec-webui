<script lang="ts">
  import { untrack } from 'svelte';
  import { Archive, Calendar, CheckSquare, Clipboard, FileText, Quote, SquarePen } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { ErrorBanner } from '$lib/components/ui/error-banner';
  import { IconBox } from '$lib/components/ui/icon-box';
  import { LoadingState } from '$lib/components/ui/loading-state';
  import { UnderlineTabs } from '$lib/components/ui/underline-tabs';
  import * as ContextMenu from '$lib/components/ui/context-menu';
  import { toast } from 'svelte-sonner';
  import { getChange, type Change } from '../lib/api';
  import {
    buildCopySelectionResult,
    buildQuotedCopySelectionResult,
    getChangeViewerContextLabel,
  } from '../lib/contextCopy';
  import { changesRefreshTrigger } from '../stores/index.svelte.ts';
  import { commandPreferencesStore } from '../stores/commandPreferences.svelte.ts';
  import { getChangeCommands } from '../lib/commandShortcuts';
  import MarkdownRenderer from './MarkdownRenderer.svelte';
  import { Progress } from '$lib/components/ui/progress';
  import CommandShortcutBar from './CommandShortcutBar.svelte';
  import { formatChangeName, formatDate } from '../lib/utils';

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
  let hasSelection = $state(false);

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Failed to copy');
    }
  }

  function handleCopy() {
    const result = buildCopySelectionResult(window.getSelection()?.toString());
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    copyToClipboard(result.text, 'Text');
  }

  function handleQuoteCopy(contextLabel: string) {
    const result = buildQuotedCopySelectionResult({
      sourceName: changeName,
      contextLabel,
      selection: window.getSelection()?.toString(),
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    copyToClipboard(result.text, 'Quoted text');
  }

  function handleMenuOpenChange(open: boolean) {
    if (open) {
      hasSelection = (window.getSelection()?.toString().length ?? 0) > 0;
    }
  }

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
        <h1 class="text-2xl font-bold text-foreground">
          {change?.isArchived ? formatChangeName(changeName) : changeName}
        </h1>
        {#if change?.isArchived}
          <Badge variant="secondary">Archived</Badge>
        {/if}
      </div>
      {#if change}
        <div class="flex items-center gap-3 mt-2 text-muted-foreground">
          {#if change.isArchived && change.archivedDate}
            <span class="flex items-center gap-1"><Calendar class="h-3.5 w-3.5" />{change.archivedDate}</span>
          {:else if change.lastModified}
            <span class="flex items-center gap-1"><Calendar class="h-3.5 w-3.5" />{formatDate(change.lastModified)}</span>
          {/if}
          <span class="flex items-center gap-1"><FileText class="h-3.5 w-3.5" />{change.specDeltas.length}</span>
          <span class="flex items-center gap-1"><CheckSquare class="h-3.5 w-3.5" />{change.taskProgress.done}/{change.taskProgress.total}</span>
          <div class="w-32">
            <Progress value={change.taskProgress.percentage} />
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
            <ContextMenu.Root onOpenChange={handleMenuOpenChange}>
              <div class="h-full rounded-xl border border-border/70 bg-background/70 p-0 text-left shadow-sm">
                <div class="px-5 py-4 text-left">
                  <h3 class="flex items-center gap-2 text-2xl font-bold text-foreground">
                    <IconBox icon={FileText} variant="success" />
                    {delta.capability}
                  </h3>
                </div>
                <div class="border-t border-border/60 px-5 py-4">
                  <MarkdownRenderer content={delta.content} highlightDiff={true} />
                </div>
              </div>
              <ContextMenu.Content>
                <ContextMenu.Item disabled={!hasSelection} onSelect={handleCopy}>
                  <Clipboard class="h-4 w-4" />
                  Copy
                </ContextMenu.Item>
                <ContextMenu.Item
                  disabled={!hasSelection}
                  onSelect={() =>
                    handleQuoteCopy(
                      getChangeViewerContextLabel({ deltaCapability: delta.capability }),
                    )}
                >
                  <Quote class="h-4 w-4" />
                  Quote Copy
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Root>
          {/each}
        </div>
      {:else if activeFile}
        <ContextMenu.Root onOpenChange={handleMenuOpenChange}>
          <div>
            {#if activeFile.content}
              <MarkdownRenderer content={activeFile.content} />
            {/if}
          </div>
          <ContextMenu.Content>
            <ContextMenu.Item disabled={!hasSelection} onSelect={handleCopy}>
              <Clipboard class="h-4 w-4" />
              Copy
            </ContextMenu.Item>
            <ContextMenu.Item
              disabled={!hasSelection}
              onSelect={() =>
                handleQuoteCopy(
                  getChangeViewerContextLabel({ activeFileName: activeFile?.name }),
                )}
            >
              <Quote class="h-4 w-4" />
              Quote Copy
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      {/if}
    </div>
  {/if}
</div>
