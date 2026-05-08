<script lang="ts">
  import { untrack } from 'svelte';
  import { Archive, Calendar, ChevronDown, ChevronRight, CircleCheckBig, Clipboard, FileText, Quote, Search, SquarePen } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { ErrorBanner } from '$lib/components/shared/error-banner';
  import { IconBox } from '$lib/components/shared/icon-box';
  import { LoadingState } from '$lib/components/shared/loading-state';
  import { InteractiveCard, SurfaceCard } from '$lib/components/shared/surface';
  import ValidationViewerStatus from '$lib/components/shared/ValidationViewerStatus.svelte';
  import { UnderlineTabs } from '$lib/components/shared/underline-tabs';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import * as ContextMenu from '$lib/components/ui/context-menu';
  import { toast } from 'svelte-sonner';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';
  import { getChange } from '$lib/api';
  import {
    buildCopySelectionResult,
    buildQuotedCopySelectionResult,
    getChangeViewerContextLabel,
  } from '$lib/contextCopy';
  import { changesRefreshTrigger } from '$lib/state/appData.svelte.ts';
  import { commandPreferencesStore } from '$lib/state/commandPreferences.svelte.ts';
  import { searchStore } from '$lib/state/search.svelte.ts';
  import type { Change } from '$lib/types/api';
  import { getChangeCommands } from '$lib/commandShortcuts';
  import MarkdownRenderer from '$lib/components/shared/MarkdownRenderer.svelte';
  import { Progress } from '$lib/components/ui/progress';
  import CommandShortcutBar from '$lib/components/shared/CommandShortcutBar.svelte';
  import { formatChangeName, formatDate } from '$lib/utils';
  import { FIXED_LABELS } from '$lib/uiText';
  import { tabStore } from '$lib/state/tabs.svelte.ts';

  interface Props {
    changeName: string;
  }

  let { changeName }: Props = $props();

  let tabId = $derived(`change:${changeName}`);

  let change = $state<Change | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  let activeGroupIndex = $state(0);
  let activeFileIndex = $state(0);
  let deltaOpenStates = $state<Record<number, boolean>>({});

  function commandPreferencesSnapshot() {
    return {
      format: commandPreferencesStore.format,
      commandVisibility: commandPreferencesStore.commandVisibility,
      availability: commandPreferencesStore.availability,
    };
  }

  let activeGroup = $derived(change?.fileGroups[activeGroupIndex] ?? null);
  let activeFile = $derived(activeGroup?.files[activeFileIndex] ?? null);
  let showDeltasTab = $derived((change?.specDeltas.length ?? 0) > 0);
  let isDeltasActive = $derived(activeGroupIndex === (change?.fileGroups.length ?? 0));
  let changeCommands = $derived(change ? getChangeCommands(change, commandPreferencesSnapshot()) : []);
  const GROUP_ORDER = ['proposal', 'design', 'tasks', 'specs'];

  function groupSortIndex(name: string): number {
    const lower = name.toLowerCase();
    for (let i = 0; i < GROUP_ORDER.length; i++) {
      if (lower.includes(GROUP_ORDER[i])) return i;
    }
    return GROUP_ORDER.length;
  }

  let primaryTabs = $derived(
    change
      ? [
        ...[...change.fileGroups]
          .sort((a, b) => groupSortIndex(a.name) - groupSortIndex(b.name))
          .map((group) => ({
            id: `group-${change!.fileGroups.indexOf(group)}`,
            label: group.name,
            badge: group.files.length > 1 ? group.files.length : undefined,
          })),
        ...(showDeltasTab
          ? [{ id: 'spec-deltas', label: FIXED_LABELS.viewer.specDeltas, badge: change.specDeltas.length }]
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
      toast.success(m.common_copied({ label }));
    } catch {
      toast.error(m.common_failed_to_copy());
    }
  }

  function handleCopy() {
    const result = buildCopySelectionResult(window.getSelection()?.toString());
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    copyToClipboard(result.text, m.copy_label_text());
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

    copyToClipboard(result.text, m.copy_label_quoted_text());
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

      if (change) {
        const persistedState = tabStore.getViewerState<{ groupIndex: number; fileIndex: number }>(tabId);
        const maxGroupIndex = change.fileGroups.length + (change.specDeltas.length > 0 ? 1 : 0) - 1;
        const nextGroupIndex = persistedState?.groupIndex ?? (preserveState ? savedGroupIndex : 0);
        activeGroupIndex = Math.min(Math.max(nextGroupIndex, 0), Math.max(0, maxGroupIndex));

        if (activeGroupIndex === change.fileGroups.length && change.specDeltas.length > 0) {
          activeFileIndex = 0;
        } else {
          const currentGroup = change.fileGroups[activeGroupIndex];
          const maxFileIndex = currentGroup ? currentGroup.files.length - 1 : 0;
          const nextFileIndex = persistedState?.fileIndex ?? (preserveState ? savedFileIndex : 0);
          activeFileIndex = Math.min(Math.max(nextFileIndex, 0), Math.max(0, maxFileIndex));
        }
      } else {
        activeGroupIndex = 0;
        activeFileIndex = 0;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : t(m.error_failed_to_load_change);
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

  $effect(() => {
    if (!change || change.name !== changeName) {
      return;
    }

    const current = tabStore.getViewerState<{ groupIndex: number; fileIndex: number }>(tabId);
    if (current?.groupIndex !== activeGroupIndex || current?.fileIndex !== activeFileIndex) {
      tabStore.setViewerState(tabId, { groupIndex: activeGroupIndex, fileIndex: activeFileIndex });
    }
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
          <Badge variant="secondary">{FIXED_LABELS.common.archived}</Badge>
        {/if}
      </div>
      {#if change}
        <div class="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground">
          {#if change.lastModified}
            {@const lastModifiedLabel = formatDate(change.lastModified)}
            <span class="inline-flex min-w-0 max-w-full items-center gap-1" title={lastModifiedLabel}>
              <Calendar class="h-3.5 w-3.5 shrink-0" />
              <span class="truncate whitespace-nowrap">{lastModifiedLabel}</span>
            </span>
          {/if}
          <span class="flex items-center gap-1"><FileText class="h-3.5 w-3.5" />{change.specDeltas.length}</span>
          <span class="flex items-center gap-1"><CircleCheckBig class="h-3.5 w-3.5" />{change.taskProgress.done}/{change.taskProgress.total}</span>
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

  <ValidationViewerStatus itemType="change" itemName={changeName} />

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
    <SurfaceCard shadow="lg" class="p-6">
      {#if isDeltasActive}
        <!-- Spec Deltas -->
        <div class="flex flex-col gap-3">
          {#each change.specDeltas as delta, i}
            <Collapsible.Root open={deltaOpenStates[i] ?? false} onOpenChange={(open) => (deltaOpenStates[i] = open)}>
              <ContextMenu.Root onOpenChange={handleMenuOpenChange}>
                <InteractiveCard tone="inset" radius="xl" class="h-full overflow-hidden text-left hover:translate-y-0 hover:shadow-sm hover:border-border/70">
                  <Collapsible.Trigger class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                    <h3 class="flex items-center gap-2 text-2xl font-bold text-foreground">
                      <IconBox icon={FileText} variant="success" />
                      {delta.capability}
                    </h3>
                    <div class="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                        title={FIXED_LABELS.search.relatedChanges}
                        onclick={(e: MouseEvent) => { e.stopPropagation(); searchStore.open(delta.capability); }}
                      >
                        <Search class="h-4 w-4" />
                      </button>
                      {#if deltaOpenStates[i] ?? false}
                        <ChevronDown class="h-5 w-5 text-muted-foreground" />
                      {:else}
                        <ChevronRight class="h-5 w-5 text-muted-foreground" />
                      {/if}
                    </div>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <div class="border-t border-border/60 px-5 py-4">
                      <MarkdownRenderer content={delta.content} highlightDiff={true} />
                    </div>
                  </Collapsible.Content>
                </InteractiveCard>
                <ContextMenu.Content>
                  <ContextMenu.Item disabled={!hasSelection} onSelect={handleCopy}>
                    <Clipboard class="h-4 w-4" />
                    {t(m.common_copy)}
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    disabled={!hasSelection}
                    onSelect={() =>
                      handleQuoteCopy(
                        getChangeViewerContextLabel({ deltaCapability: delta.capability }),
                      )}
                    }
                  >
                    <Quote class="h-4 w-4" />
                    {t(m.common_quote_copy)}
                  </ContextMenu.Item>
                </ContextMenu.Content>
              </ContextMenu.Root>
            </Collapsible.Root>
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
              {t(m.common_copy)}
            </ContextMenu.Item>
            <ContextMenu.Item
              disabled={!hasSelection}
              onSelect={() =>
                handleQuoteCopy(
                  getChangeViewerContextLabel({ activeFileName: activeFile?.name }),
                )}
            >
              <Quote class="h-4 w-4" />
              {t(m.common_quote_copy)}
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      {/if}
    </SurfaceCard>
  {/if}
</div>
