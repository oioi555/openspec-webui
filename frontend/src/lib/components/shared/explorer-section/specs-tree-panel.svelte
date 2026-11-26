<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { ChevronRight, FileText } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { EmptyState } from '$lib/components/shared/empty-state';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';
  import {
    ancestorPaths,
    buildSpecTree,
    collectFolderPaths,
    countSpecs,
    flattenVisibleRows,
    nextTreeFocus,
    sortSpecTree,
    summarizeValidation,
    type SpecTreeRow,
  } from '$lib/specTree';
  import { specs } from '$lib/state/appData.svelte.ts';
  import { projectStore } from '$lib/state/projects.svelte.ts';
  import { specTreeExpansionStore } from '$lib/state/specTreeExpansion.svelte.ts';
  import { tabStore } from '$lib/state/tabs.svelte.ts';
  import { validationStore } from '$lib/state/validation.svelte.ts';
  import { deriveValidationListIconState, deriveValidationTargetSummary } from '$lib/state/validationCore';
  import { FIXED_LABELS } from '$lib/uiText';
  import { cn, formatDate } from '$lib/utils';
  import type { ExplorerSortMode } from './sort-utils';
  import ExplorerSectionItem from './explorer-section-item.svelte';
  import ExplorerSortControl from './explorer-sort-control.svelte';
  import SpecsTreeFolderRow from './specs-tree-folder-row.svelte';

  interface Props {
    onItemSelected?: () => void;
  }

  let { onItemSelected = () => {} }: Props = $props();

  const INDENT_PX = 12;

  let sortMode = $state<ExplorerSortMode>('name');
  let focusIndex = $state(0);
  let treeRef: HTMLDivElement | undefined = $state(undefined);

  const projectId = $derived(projectStore.activeProjectId ?? '');
  const tree = $derived(sortSpecTree(buildSpecTree(specs.value), sortMode));
  const folderPaths = $derived(collectFolderPaths(tree));
  const folderPathSet = $derived(new Set(folderPaths));
  const expanded = $derived(specTreeExpansionStore.expandedFor(projectId));
  const rows = $derived(flattenVisibleRows(tree, expanded));
  const activeSpecName = $derived(tabStore.activeTab?.type === 'spec' ? tabStore.activeTab.name : null);

  function specState(name: string) {
    return deriveValidationTargetSummary(validationStore, { type: 'spec', name }).state;
  }

  function specPath(name: string) {
    return `/specs/${encodeURIComponent(name)}`;
  }

  // Remembered paths that no longer exist are dropped whenever the operator changes the expansion.
  function toggleFolder(path: string) {
    specTreeExpansionStore.prune(projectId, folderPaths);
    specTreeExpansionStore.toggle(projectId, path);
  }

  function expandFolder(path: string) {
    specTreeExpansionStore.prune(projectId, folderPaths);
    specTreeExpansionStore.expand(projectId, path);
  }

  function collapseFolder(path: string) {
    specTreeExpansionStore.prune(projectId, folderPaths);
    specTreeExpansionStore.collapse(projectId, path);
  }

  function rowElement(index: number) {
    return treeRef?.querySelector<HTMLElement>(`[data-tree-index="${index}"]`) ?? null;
  }

  function focusRow(index: number) {
    focusIndex = index;
    const element = rowElement(index);
    element?.focus();
    element?.scrollIntoView({ block: 'nearest' });
  }

  function activateRow(row: SpecTreeRow, index: number) {
    if (row.node.spec) {
      rowElement(index)?.querySelector<HTMLButtonElement>('[data-spec-open] button')?.click();
    } else {
      toggleFolder(row.node.path);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    const item = target?.closest<HTMLElement>('[data-tree-index]');
    if (!item) return;
    // Enter on an inner button already triggers its own click.
    if (event.key === 'Enter' && target !== item) return;

    const index = Number(item.dataset.treeIndex);
    const action = nextTreeFocus(rows, index, event.key);
    if (action.type === 'none') return;

    event.preventDefault();
    switch (action.type) {
      case 'focus':
        focusRow(action.index);
        break;
      case 'expand':
        expandFolder(action.path);
        break;
      case 'collapse':
        collapseFolder(action.path);
        break;
      case 'activate':
        activateRow(action.row, index);
        break;
    }
  }

  // Keep the roving tab stop on an existing row.
  $effect(() => {
    if (focusIndex >= rows.length) {
      focusIndex = Math.max(0, rows.length - 1);
    }
  });

  // Reveal the active spec: expand its ancestors (never collapsing others) and scroll it into view.
  $effect(() => {
    const name = activeSpecName;
    const id = projectId;
    const existing = folderPathSet;
    if (!name || !id) return;

    const ancestors = ancestorPaths(name).filter((path) => existing.has(path));
    untrack(() => specTreeExpansionStore.expandMany(id, ancestors));

    void tick().then(() => {
      const index = untrack(() => rows.findIndex((row) => row.node.path === name));
      if (index < 0) return;
      focusIndex = index;
      rowElement(index)?.scrollIntoView({ block: 'nearest' });
    });
  });
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <div class="shrink-0 border-b border-border bg-card px-3 py-3">
    <div class="flex min-w-0 items-center gap-2">
      <FileText class="h-4 w-4 shrink-0 text-muted-foreground" />
      <div class="min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {FIXED_LABELS.explorer.specs}
      </div>
      <Badge variant="secondary" class="min-w-5 shrink-0 justify-center px-2 py-0.5 text-[11px] font-medium">
        {specs.value.length}
      </Badge>
      <div class="shrink-0">
        <ExplorerSortControl
          value={sortMode}
          onValueChange={(value) => (sortMode = value)}
          ariaLabel={`${FIXED_LABELS.explorer.specs} ${FIXED_LABELS.explorer.sortBy}`}
        />
      </div>
    </div>
  </div>

  <ScrollArea.Root class="min-h-0 flex-1" viewportClass="h-full">
    {#if specs.value.length === 0}
      <EmptyState message={m.explorer_no_specs_found()} icon={FileText} class="px-4 py-6" />
    {:else}
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <div
        bind:this={treeRef}
        role="tree"
        aria-label={FIXED_LABELS.explorer.specs}
        tabindex={-1}
        onkeydown={handleKeydown}
      >
        {#each rows as row, index (row.node.path)}
          {@const spec = row.node.spec}
          {@const isActive = spec !== null && spec.name === activeSpecName}
          <div
            role="treeitem"
            aria-level={row.level}
            aria-expanded={row.hasChildren ? row.expanded : undefined}
            aria-selected={isActive}
            aria-label={spec ? undefined : t(m.specs_tree_folder_label, { name: row.node.segment, count: countSpecs(row.node) })}
            tabindex={index === focusIndex ? 0 : -1}
            data-tree-index={index}
            data-path={row.node.path}
            class="outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            style={`padding-left: ${(row.level - 1) * INDENT_PX}px`}
            onfocusin={() => (focusIndex = index)}
          >
            <div class="flex min-w-0 items-stretch">
              <!-- Twistie column: same width on every row so sibling icons line up. -->
              <div
                class={cn(
                  'flex w-6 shrink-0 justify-end border-b border-border/50',
                  spec ? 'items-start pt-[17px]' : 'items-center',
                )}
              >
                {#if row.hasChildren}
                  <button
                    type="button"
                    tabindex={-1}
                    class="flex items-center text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={t(row.expanded ? m.specs_tree_collapse : m.specs_tree_expand, { name: row.node.segment })}
                    title={t(row.expanded ? m.specs_tree_collapse : m.specs_tree_expand, { name: row.node.segment })}
                    onclick={() => toggleFolder(row.node.path)}
                  >
                    <ChevronRight class={cn('h-3.5 w-3.5 transition-transform', row.expanded && 'rotate-90')} />
                  </button>
                {/if}
              </div>
              {#if spec}
                <div class="min-w-0 flex-1" data-spec-open>
                  <ExplorerSectionItem
                    path={specPath(spec.name)}
                    section="specs"
                    kind="spec"
                    tabindex={-1}
                    {onItemSelected}
                    class="pl-1.5"
                    name={spec.name}
                    displayName={row.node.segment}
                    date={spec.lastModified ? formatDate(spec.lastModified) : null}
                    validationStatus={deriveValidationListIconState('spec', specState(spec.name))}
                  />
                </div>
              {:else}
                <div class="min-w-0 flex-1">
                  <SpecsTreeFolderRow
                    segment={row.node.segment}
                    path={row.node.path}
                    count={countSpecs(row.node)}
                    expanded={row.expanded}
                    validationStatus={summarizeValidation(row.node, specState)}
                    onToggle={() => toggleFolder(row.node.path)}
                  />
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </ScrollArea.Root>
</div>
