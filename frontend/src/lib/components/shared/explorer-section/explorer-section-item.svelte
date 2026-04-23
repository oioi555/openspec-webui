<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Calendar, CircleCheckBig, FileText } from '@lucide/svelte';
  import { Progress } from '$lib/components/ui/progress';
  import { ItemContextMenu } from '$lib/components/shared/item-context-menu';
  import { createItemContextMenuItems, type ItemContextMenuKind } from '$lib/itemContextMenu';
  import { layoutStore, type ExplorerSection } from '$lib/state/layout.svelte.ts';
  import { tabStore } from '$lib/state/tabs.svelte.ts';
  import { uiPreferencesStore } from '$lib/state/uiPreferences.svelte.ts';
  import { cn } from '$lib/utils';

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
            layoutStore.openOverlay('search', { initialQuery: name });
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

<ItemContextMenu items={menuItems}>
  <button
    type="button"
    class={cn(
      'flex w-full items-start gap-3 px-3 py-3 text-left transition-colors border-b border-border/50',
      isActive
        ? 'bg-primary/10 text-foreground'
        : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
      className
    )}
    onclick={handleClick}
  >
    <div class="min-w-0 flex-1">
      <div class="truncate text-sm font-medium" title={name}>{displayName ?? name}</div>
      {#if date || specDeltaCount != null || taskProgress}
        <div class="mt-1 flex items-center {showProgress ? 'justify-between' : 'gap-2'} text-xs text-muted-foreground">
          <div class="flex items-center gap-2">
            {#if date}
              <span class="flex items-center gap-0.5"><Calendar class="h-3 w-3" />{date}</span>
            {/if}
            {#if specDeltaCount != null}
              <span class="flex items-center gap-0.5"><FileText class="h-3 w-3" />{specDeltaCount}</span>
            {/if}
            {#if taskProgress}
              <span class="flex items-center gap-0.5"><CircleCheckBig class="h-3 w-3" />{taskProgress.done}/{taskProgress.total}</span>
            {/if}
          </div>
          {#if showProgress && taskProgress}
            <div class="w-14 shrink-0">
              <Progress value={taskProgress.percentage} />
            </div>
          {/if}
        </div>
      {/if}
    </div>
    {@render children?.()}
  </button>
</ItemContextMenu>
