<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { Calendar, ChevronDown, ChevronRight, CircleCheckBig, Clipboard, FileText, Quote, Search } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { ErrorBanner } from '$lib/components/shared/error-banner';
  import { TypeIndicator } from '$lib/components/shared/type-indicator';
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
    validateSearchKeyword,
  } from '$lib/contextCopy';
  import { changesRefreshTrigger } from '$lib/state/appData.svelte.ts';
  import { commandPreferencesStore } from '$lib/state/commandPreferences.svelte.ts';
  import type { SearchNavigationState } from '$lib/state/search.svelte.ts';
  import { searchStore, SEARCH_MIN_QUERY_LENGTH } from '$lib/state/search.svelte.ts';
  import { uiPreferencesStore } from '$lib/state/uiPreferences.svelte.ts';
  import type { Change, OtherFile } from '$lib/types/api';
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
  let otherFileOpenStates = $state<Record<string, boolean>>({});
  let contentRef = $state<HTMLDivElement | null>(null);

  interface ChangeViewerState {
    groupIndex?: number;
    fileIndex?: number;
    searchNavigation?: SearchNavigationState;
  }

  interface RevisionRecord {
    id?: string;
    description?: string;
    reason?: string;
    author?: string;
    createdAt?: string;
    metadata?: {
      type?: string;
      affectedAPI?: string;
      affectedField?: string;
      updateTarget?: string[];
      source?: {
        file?: string;
        function?: string;
      };
    };
  }

  interface RevisionsFile {
    changeId?: string;
    revisions: RevisionRecord[];
  }

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
  let showOtherTab = $derived((change?.otherFiles.length ?? 0) > 0);
  let isDeltasActive = $derived(showDeltasTab && activeGroupIndex === (change?.fileGroups.length ?? 0));
  let isOtherActive = $derived(
    change ? activeGroupIndex === change.fileGroups.length + (showDeltasTab ? 1 : 0) : false,
  );
  let changeCommands = $derived(change ? getChangeCommands(change, commandPreferencesSnapshot()) : []);
  let activeSearchQuery = $derived(
    uiPreferencesStore.searchHighlightsEnabled && searchStore.query.length >= SEARCH_MIN_QUERY_LENGTH
      ? searchStore.query
      : undefined,
  );
  let highlightQuery = $derived(
    uiPreferencesStore.searchHighlightsEnabled && searchStore.query.length >= SEARCH_MIN_QUERY_LENGTH
      ? searchStore.query
      : undefined,
  );
  const GROUP_ORDER = ['proposal', 'design', 'tasks', 'specs'];

  function groupSortIndex(name: string): number {
    const lower = name.toLowerCase();
    for (let i = 0; i < GROUP_ORDER.length; i++) {
      if (lower.includes(GROUP_ORDER[i])) return i;
    }
    return GROUP_ORDER.length;
  }

  function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function countQueryMatches(content: string | null | undefined, query: string | undefined): number {
    if (!content || !query) {
      return 0;
    }

    const matches = content.match(new RegExp(escapeRegExp(query), 'gi'));
    return matches?.length ?? 0;
  }

  let sortedFileGroups = $derived(
    change
      ? [...change.fileGroups].sort((a, b) => groupSortIndex(a.name) - groupSortIndex(b.name))
      : [],
  );

  let fileGroupHitCounts = $derived((() => {
    const counts = new Map<number, number>();
    if (!change || !activeSearchQuery) {
      return counts;
    }

    change.fileGroups.forEach((group, index) => {
      counts.set(
        index,
        group.files.reduce((total, file) => total + countQueryMatches(file.content, activeSearchQuery), 0),
      );
    });

    return counts;
  })());

  let specDeltaHitCounts = $derived((() => {
    const counts = new Map<string, number>();
    if (!change || !activeSearchQuery) {
      return counts;
    }

    change.specDeltas.forEach((delta) => {
      counts.set(delta.capability, countQueryMatches(delta.content, activeSearchQuery));
    });

    return counts;
  })());

  let otherFileHitCounts = $derived((() => {
    const counts = new Map<string, number>();
    if (!change || !activeSearchQuery) {
      return counts;
    }

    change.otherFiles.forEach((file) => {
      counts.set(file.path, countQueryMatches(file.content, activeSearchQuery));
    });

    return counts;
  })());

  let primaryTabs = $derived(
    change
      ? [
        ...sortedFileGroups
          .map((group) => {
            const groupIndex = change!.fileGroups.indexOf(group);
            return {
              id: `group-${groupIndex}`,
              label: group.name,
              badge: group.files.length > 1 ? group.files.length : undefined,
              hitIndicator: (fileGroupHitCounts.get(groupIndex) ?? 0) > 0,
            };
          }),
        ...(showDeltasTab
          ? [{
              id: 'spec-deltas',
              label: FIXED_LABELS.viewer.specDeltas,
              badge: change.specDeltas.length,
              hitIndicator: Array.from(specDeltaHitCounts.values()).some((count) => count > 0),
            }]
          : []),
        ...(showOtherTab
          ? [{
              id: 'other-files',
              label: FIXED_LABELS.dashboard.other,
              badge: change.otherFiles.length,
              hitIndicator: Array.from(otherFileHitCounts.values()).some((count) => count > 0),
            }]
          : []),
      ]
      : []
  );
  let activePrimaryTabId = $derived(
    isOtherActive ? 'other-files' : isDeltasActive ? 'spec-deltas' : `group-${activeGroupIndex}`,
  );

  let previousChangeName: string | null = null;
  let previousRefreshTrigger = -1;
  let hasSelection = $state(false);
  let snapshotSelection = $state('');

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
      snapshotSelection = window.getSelection()?.toString() ?? '';
      hasSelection = snapshotSelection.length > 0;
    }
  }

  let canSearch = $derived(validateSearchKeyword(snapshotSelection).valid);

  function handleSearchFromSelection() {
    const { valid, keyword } = validateSearchKeyword(snapshotSelection);
    if (valid) {
      searchStore.open(keyword);
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
      otherFileOpenStates = {};

      if (change) {
        const persistedState = tabStore.getViewerState<ChangeViewerState>(tabId);
        const maxGroupIndex =
          change.fileGroups.length
          + (change.specDeltas.length > 0 ? 1 : 0)
          + (change.otherFiles.length > 0 ? 1 : 0)
          - 1;
        const nextGroupIndex = persistedState?.groupIndex ?? (preserveState ? savedGroupIndex : 0);
        activeGroupIndex = Math.min(Math.max(nextGroupIndex, 0), Math.max(0, maxGroupIndex));

        const deltasIndex = change.fileGroups.length;
        const otherIndex = change.fileGroups.length + (change.specDeltas.length > 0 ? 1 : 0);

        if (
          (activeGroupIndex === deltasIndex && change.specDeltas.length > 0)
          || (activeGroupIndex === otherIndex && change.otherFiles.length > 0)
        ) {
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

  function selectOtherFiles() {
    if (!change) {
      return;
    }

    activeGroupIndex = change.fileGroups.length + (change.specDeltas.length > 0 ? 1 : 0);
    activeFileIndex = 0;
  }

  function handlePrimaryTabSelect(id: string) {
    if (id === 'spec-deltas') {
      selectDeltas();
      return;
    }

    if (id === 'other-files') {
      selectOtherFiles();
      return;
    }

    if (id.startsWith('group-')) {
      const index = Number(id.slice('group-'.length));
      if (!Number.isNaN(index)) {
        selectGroup(index);
      }
    }
  }

  function getOtherFileElement(path: string): HTMLElement | null {
    const elements = contentRef?.querySelectorAll<HTMLElement>('[data-other-file-path]') ?? [];
    return Array.from(elements).find((element) => element.dataset.otherFilePath === path) ?? null;
  }

  function getOtherFileDisplayContent(file: OtherFile): string {
    if (file.type === 'json') {
      try {
        return JSON.stringify(JSON.parse(file.content), null, 2);
      } catch {
        return file.content;
      }
    }

    return file.content;
  }

  function isRevisionsFile(file: OtherFile): boolean {
    return file.type === 'json' && (file.name === 'revisions.json' || file.path.endsWith('/revisions.json'));
  }

  function parseRevisionsFile(file: OtherFile): RevisionsFile | null {
    if (!isRevisionsFile(file)) {
      return null;
    }

    try {
      const parsed = JSON.parse(file.content) as Partial<RevisionsFile>;
      if (Array.isArray(parsed.revisions)) {
        return {
          changeId: typeof parsed.changeId === 'string' ? parsed.changeId : undefined,
          revisions: parsed.revisions,
        };
      }
    } catch {
      // Fall through to generic JSON rendering.
    }

    return null;
  }

  function getRevisionSource(revision: RevisionRecord): string | null {
    const source = revision.metadata?.source;
    if (!source?.file) {
      return null;
    }

    return source.function ? `${source.file}#${source.function}` : source.file;
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

    const current = tabStore.getViewerState<ChangeViewerState>(tabId);
    if (current?.groupIndex !== activeGroupIndex || current?.fileIndex !== activeFileIndex) {
      tabStore.setViewerState(tabId, {
        ...current,
        groupIndex: activeGroupIndex,
        fileIndex: activeFileIndex,
      });
    }
  });

  $effect(() => {
    if (!change || loading || change.name !== changeName) {
      return;
    }

    const viewerState = tabStore.getViewerState<ChangeViewerState>(tabId);
    const searchNavigation = viewerState?.searchNavigation;
    let targetOtherFilePath: string | null = null;
    if (!searchNavigation?.requestKey) {
      return;
    }

    if (viewerState) {
      const { searchNavigation: _ignored, ...rest } = viewerState;
      if (Object.keys(rest).length > 0) {
        tabStore.setViewerState(tabId, rest);
      } else {
        tabStore.clearViewerState(tabId);
      }
    }

    if (searchNavigation.matchLocation?.specDeltaCapability) {
      selectDeltas();

      const nextDeltaOpenStates: Record<number, boolean> = {};
      change.specDeltas.forEach((delta, index) => {
        if ((specDeltaHitCounts.get(delta.capability) ?? 0) > 0) {
          nextDeltaOpenStates[index] = true;
        }
      });

      if (Object.keys(nextDeltaOpenStates).length === 0) {
        const targetIndex = change.specDeltas.findIndex(
          (delta) => delta.capability === searchNavigation.matchLocation?.specDeltaCapability,
        );
        if (targetIndex >= 0) {
          nextDeltaOpenStates[targetIndex] = true;
        }
      }

      deltaOpenStates = nextDeltaOpenStates;
    } else if (searchNavigation.matchLocation?.fileGroupName) {
      const targetGroup = sortedFileGroups.find((group) => group.name === searchNavigation.matchLocation?.fileGroupName);
      if (targetGroup) {
        activeGroupIndex = change.fileGroups.indexOf(targetGroup);

        if (searchNavigation.matchLocation.fileName) {
          const targetFileIndex = targetGroup.files.findIndex(
            (file) => file.name === searchNavigation.matchLocation?.fileName,
          );
          activeFileIndex = targetFileIndex >= 0 ? targetFileIndex : 0;
        } else {
          activeFileIndex = 0;
        }
      }
    } else if (searchNavigation.matchLocation?.otherFilePath) {
      targetOtherFilePath = searchNavigation.matchLocation.otherFilePath;
      selectOtherFiles();
      otherFileOpenStates[targetOtherFilePath] = true;
    }

    void tick().then(() => {
      if (targetOtherFilePath) {
        const otherFileElement = getOtherFileElement(targetOtherFilePath);
        const target = otherFileElement?.querySelector<HTMLElement>('mark.search-highlight') ?? otherFileElement;
        target?.scrollIntoView({ behavior: 'auto', block: 'center' });
        return;
      }

      if (!highlightQuery) {
        return;
      }

      const firstHighlight = contentRef?.querySelector<HTMLElement>('mark.search-highlight');
      firstHighlight?.scrollIntoView({ behavior: 'auto', block: 'center' });
    });
  });

</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-wrap items-start gap-4">
    <div class="flex-1">
      <div class="flex items-center gap-3">
        <TypeIndicator kind={change?.isArchived ? 'archived-change' : 'active-change'} format="icon-box" size="lg" />
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

  {#if loading}
    <LoadingState />
  {:else if error}
    <ErrorBanner {error} />
  {:else if change}
    {#if !change.isArchived}
      <ValidationViewerStatus itemType="change" itemName={changeName} />
    {/if}

    <!-- Primary tabs: Groups + Deltas -->
    <UnderlineTabs tabs={primaryTabs} activeId={activePrimaryTabId} onSelect={handlePrimaryTabSelect} />

    <!-- Secondary tabs: Files within group (if multiple) -->
    {#if activeGroup && activeGroup.files.length > 1 && !isDeltasActive && !isOtherActive}
      <div class="flex space-x-2 px-2">
        {#each activeGroup.files as file, i}
            <button
              class="px-3 py-1.5 text-sm rounded-md transition-colors {activeFileIndex === i
              ? 'bg-secondary text-foreground'
              : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'}"
              onclick={() => (activeFileIndex = i)}
            >
            <span class="inline-flex items-center gap-1.5">
              <span>{file.name}</span>
              {#if countQueryMatches(file.content, activeSearchQuery) > 0}
                <Badge variant="warning" class="min-w-5 justify-center px-1.5 py-0 text-[10px] leading-5">
                  {countQueryMatches(file.content, activeSearchQuery)}
                </Badge>
              {/if}
            </span>
          </button>
        {/each}
      </div>
    {/if}

    <!-- Content area -->
    <SurfaceCard shadow="lg" class="p-6">
      <div bind:this={contentRef}>
        {#if isDeltasActive}
          <!-- Spec Deltas -->
          <div class="flex flex-col gap-3">
            {#each change.specDeltas as delta, i}
              <Collapsible.Root open={deltaOpenStates[i] ?? false} onOpenChange={(open) => (deltaOpenStates[i] = open)}>
                <ContextMenu.Root onOpenChange={handleMenuOpenChange}>
                  <InteractiveCard tone="inset" radius="xl" class="h-full overflow-hidden text-left hover:translate-y-0 hover:shadow-sm hover:border-border/70">
                    <Collapsible.Trigger class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                      <h3 class="flex items-center gap-2 text-xl font-medium text-foreground">
                        <TypeIndicator kind="spec" format="icon-box" size="md" />
                        {delta.capability}
                        {#if (specDeltaHitCounts.get(delta.capability) ?? 0) > 0}
                          <Badge variant="warning" class="min-w-5 justify-center px-1.5 py-0 text-[10px] leading-5">
                            {specDeltaHitCounts.get(delta.capability)}
                          </Badge>
                        {/if}
                      </h3>
                      <div class="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground border border-border/50"
                          title={FIXED_LABELS.search.relatedChanges}
                          onclick={(e: MouseEvent) => { e.stopPropagation(); searchStore.open(delta.capability); }}
                        >
                          <Search class="h-3.5 w-3.5" />
                        </button>
                        <span class="flex p-1.5 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                          {#if deltaOpenStates[i] ?? false}
                            <ChevronDown class="h-3.5 w-3.5" />
                          {:else}
                            <ChevronRight class="h-3.5 w-3.5" />
                          {/if}
                        </span>
                      </div>
                    </Collapsible.Trigger>
                    <Collapsible.Content>
                      <div class="border-t border-border/60 px-5 py-4">
                        <MarkdownRenderer content={delta.content} highlightDiff={true} highlightQuery={highlightQuery} />
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
                        )
                      }
                    >
                      <Quote class="h-4 w-4" />
                      {t(m.common_quote_copy)}
                    </ContextMenu.Item>
                    <ContextMenu.Item disabled={!canSearch} onSelect={handleSearchFromSelection}>
                      <Search class="h-4 w-4" />
                      {t(m.common_search)}
                    </ContextMenu.Item>
                  </ContextMenu.Content>
                </ContextMenu.Root>
              </Collapsible.Root>
            {/each}
          </div>
        {:else if isOtherActive}
          <div class="flex flex-col gap-3">
            {#each change.otherFiles as otherFile}
              {@const revisionsFile = parseRevisionsFile(otherFile)}
              <Collapsible.Root
                open={otherFileOpenStates[otherFile.path] ?? false}
                onOpenChange={(open) => (otherFileOpenStates[otherFile.path] = open)}
              >
                <InteractiveCard
                  tone="inset"
                  radius="xl"
                  class="h-full overflow-hidden text-left hover:translate-y-0 hover:shadow-sm hover:border-border/70"
                  data-other-file-path={otherFile.path}
                >
                  <Collapsible.Trigger class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                    <h3 class="flex min-w-0 items-center gap-2 text-base font-medium text-foreground">
                      <TypeIndicator kind="active-change" format="icon-box" size="md" />
                      <span class="truncate">{otherFile.path}</span>
                      {#if (otherFileHitCounts.get(otherFile.path) ?? 0) > 0}
                        <Badge variant="warning" class="min-w-5 justify-center px-1.5 py-0 text-[10px] leading-5">
                          {otherFileHitCounts.get(otherFile.path)}
                        </Badge>
                      {/if}
                    </h3>
                    <span class="flex shrink-0 items-center justify-center rounded-md border border-border/50 p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                      {#if otherFileOpenStates[otherFile.path] ?? false}
                        <ChevronDown class="h-3.5 w-3.5" />
                      {:else}
                        <ChevronRight class="h-3.5 w-3.5" />
                      {/if}
                    </span>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <div class="border-t border-border/60 px-5 py-4">
                      {#if revisionsFile}
                        <div class="space-y-4">
                          <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {#if revisionsFile.changeId}
                              <span>Change: <span class="font-medium text-foreground">{revisionsFile.changeId}</span></span>
                            {/if}
                            <Badge variant="secondary">{revisionsFile.revisions.length} revisions</Badge>
                          </div>

                          {#if revisionsFile.revisions.length === 0}
                            <p class="text-sm text-muted-foreground">No revisions recorded.</p>
                          {:else}
                            <div class="space-y-3">
                              {#each revisionsFile.revisions as revision}
                                <div class="rounded-lg border border-border/60 bg-muted/20 p-4">
                                  <div class="mb-3 flex flex-wrap items-center gap-2">
                                    {#if revision.id}
                                      <Badge variant="outline">{revision.id}</Badge>
                                    {/if}
                                    {#if revision.metadata?.type}
                                      <Badge variant="secondary">{revision.metadata.type}</Badge>
                                    {/if}
                                    {#if revision.author}
                                      <span class="text-xs text-muted-foreground">by {revision.author}</span>
                                    {/if}
                                    {#if revision.createdAt}
                                      <span class="text-xs text-muted-foreground">{formatDate(revision.createdAt)}</span>
                                    {/if}
                                  </div>

                                  {#if revision.description}
                                    <p class="whitespace-pre-wrap text-sm leading-6 text-foreground">{revision.description}</p>
                                  {/if}

                                  {#if revision.reason}
                                    <div class="mt-3 rounded-md border border-border/50 bg-background/60 p-3">
                                      <div class="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Reason</div>
                                      <p class="whitespace-pre-wrap text-sm leading-6 text-foreground">{revision.reason}</p>
                                    </div>
                                  {/if}

                                  {#if revision.metadata}
                                    <div class="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                      {#if revision.metadata.affectedAPI}
                                        <div><span class="font-medium text-foreground">API:</span> {revision.metadata.affectedAPI}</div>
                                      {/if}
                                      {#if revision.metadata.affectedField}
                                        <div><span class="font-medium text-foreground">Field:</span> {revision.metadata.affectedField}</div>
                                      {/if}
                                      {#if revision.metadata.updateTarget?.length}
                                        <div><span class="font-medium text-foreground">Updates:</span> {revision.metadata.updateTarget.join(', ')}</div>
                                      {/if}
                                      {#if getRevisionSource(revision)}
                                        <div><span class="font-medium text-foreground">Source:</span> {getRevisionSource(revision)}</div>
                                      {/if}
                                    </div>
                                  {/if}
                                </div>
                              {/each}
                            </div>
                          {/if}
                        </div>
                      {:else if otherFile.type === 'markdown'}
                        <MarkdownRenderer content={otherFile.content} highlightQuery={highlightQuery} />
                      {:else}
                        <pre class="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/30 p-4 text-sm leading-6 text-foreground"><code>{getOtherFileDisplayContent(otherFile)}</code></pre>
                      {/if}
                    </div>
                  </Collapsible.Content>
                </InteractiveCard>
              </Collapsible.Root>
            {/each}
          </div>
        {:else if activeFile}
          <ContextMenu.Root onOpenChange={handleMenuOpenChange}>
            <div>
              {#if activeFile.content}
                <MarkdownRenderer content={activeFile.content} highlightQuery={highlightQuery} />
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
              <ContextMenu.Item disabled={!canSearch} onSelect={handleSearchFromSelection}>
                <Search class="h-4 w-4" />
                {t(m.common_search)}
              </ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Root>
        {/if}
      </div>
    </SurfaceCard>
  {/if}
</div>
