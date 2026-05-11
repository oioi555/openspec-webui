<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Calendar, CircleCheckBig, FileText } from '@lucide/svelte';
  import { Progress } from '$lib/components/ui/progress';
  import { createItemContextMenuItems, type ItemContextMenuKind } from '$lib/itemContextMenu';
  import { layoutStore, type ExplorerSection } from '$lib/state/layout.svelte.ts';
  import { searchStore } from '$lib/state/search.svelte.ts';
  import { tabStore } from '$lib/state/tabs.svelte.ts';
  import { uiPreferencesStore } from '$lib/state/uiPreferences.svelte.ts';
  import type { ValidationStatusKind } from '$lib/visualSemantics';
  import ExplorerListItemButton from './explorer-list-item-button.svelte';

  interface Props {
    path: string;
    section: ExplorerSection;
    kind: ItemContextMenuKind;
    name: string;
    onItemSelected?: () => void;
    class?: string;
    date?: string | null;
    specDeltaCount?: number | null;
    taskProgress?: { done: number; total: number; percentage: number } | null;
    showProgress?: boolean;
    displayName?: string;
    validationStatus?: ValidationStatusKind | null;
    children?: Snippet;
  }

  let {
    path,
    section,
    kind,
    name,
    onItemSelected = () => {},
    class: className = '',
    date,
    specDeltaCount,
    taskProgress,
    showProgress = false,
    displayName,
    validationStatus = null,
    children,
  }: Props = $props();

  const menuItems = $derived(
    kind === 'spec'
      ? createItemContextMenuItems({
        kind: 'spec',
        name,
        onOpenInNewTab: () => {
            layoutStore.focusSection(section);
            tabStore.openConfirmed(path);
        },
        onSearchRelatedChanges: () => {
            searchStore.open(name);
            onItemSelected();
        },
      })
      : createItemContextMenuItems({
        kind,
        name,
        onOpenInNewTab: () => {
            layoutStore.focusSection(section);
            tabStore.openConfirmed(path);
        },
        })
  );

  function handleClick(event: MouseEvent) {
    layoutStore.focusSection(section);

    if (!uiPreferencesStore.previewTabsEnabled || event.ctrlKey) {
      tabStore.openConfirmed(path);
    } else {
      tabStore.openPreview(path);
    }

    onItemSelected();
  }

  const isActive = $derived(tabStore.activeTab?.path === path);
</script>

<ExplorerListItemButton
  items={menuItems}
  {kind}
  {name}
  {displayName}
  {validationStatus}
  active={isActive}
  class={className}
  onclick={handleClick}
>
  {#if date || specDeltaCount != null || taskProgress}
    <div class="flex w-full items-center gap-3 text-xs text-muted-foreground">
      <div class="min-w-0 flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        {#if date}
          <span
            class="inline-flex min-w-0 max-w-full items-center gap-0.5"
            title={date}
          >
            <Calendar class="h-3 w-3 shrink-0" />
            <span class="truncate whitespace-nowrap">{date}</span>
          </span>
        {/if}
        {#if specDeltaCount != null}
          <span class="inline-flex items-center gap-0.5 whitespace-nowrap">
            <FileText class="h-3 w-3" />{specDeltaCount}
          </span>
        {/if}
        {#if taskProgress}
          <span class="inline-flex items-center gap-0.5 whitespace-nowrap">
            <CircleCheckBig class="h-3 w-3" />{taskProgress.done}/{taskProgress.total}
          </span>
        {/if}
      </div>
      {#if showProgress && taskProgress}
        <div class="w-14 shrink-0">
          <Progress value={taskProgress.percentage} />
        </div>
      {/if}
    </div>
  {/if}
  {@render children?.()}
</ExplorerListItemButton>
