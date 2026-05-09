<script lang="ts">
  import { Pin, X, LayoutDashboard, Clipboard, ClipboardCopy, Settings } from '@lucide/svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';
  import { tabStore, type TabType } from '$lib/state/tabs.svelte.ts';
  import { archivedChanges } from '$lib/state/appData.svelte.ts';
  import { formatChangeName } from '$lib/utils.ts';
  import { toast } from 'svelte-sonner';
  import { FIXED_LABELS, getPinnedTabAriaLabel, getPreviewTabAriaLabel, getRegularTabAriaLabel } from '$lib/uiText';
  import { getEntityVisual, type IconComponent } from '$lib/visualSemantics';

  const TAB_ICONS: Record<TabType, { icon: IconComponent; color: string }> = {
    dashboard: { icon: LayoutDashboard, color: 'text-muted-foreground' },
    spec: { icon: getEntityVisual('spec').icon, color: getEntityVisual('spec').iconClass },
    change: { icon: getEntityVisual('active-change').icon, color: getEntityVisual('active-change').iconClass },
    settings: { icon: Settings, color: 'text-muted-foreground' },
  };

  const ARCHIVED_CHANGE_ICON = {
    icon: getEntityVisual('archived-change').icon,
    color: getEntityVisual('archived-change').iconClass,
  };

  function getTabIcon(tab: { type: string; name: string }) {
    if (tab.type === 'change') {
      const isArchived = archivedChanges.value.some((c) => c.name === tab.name);
      return isArchived ? ARCHIVED_CHANGE_ICON : TAB_ICONS.change;
    }
    return TAB_ICONS[tab.type as TabType] ?? TAB_ICONS.dashboard;
  }

  function isHomeTab(tab: { id: string; path: string; type: string }) {
    return tab.type === 'dashboard' && tab.path === '/';
  }

  // --- Actions ---
  function togglePin(tabId: string, pinned: boolean) {
    if (pinned) {
      tabStore.unpin(tabId);
    } else {
      tabStore.pin(tabId);
    }
  }

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(m.common_copied_with_value({ label, value: text }));
    } catch {
      toast.error(m.common_failed_to_copy());
    }
  }

  // --- Drag & Drop ---
  let draggedIndex = $state<number | null>(null);

  // --- Tab refs for auto-scroll ---
  let tabRefs = $state<HTMLButtonElement[]>([]);

  // Auto-scroll to active tab when it changes
  $effect(() => {
    const activeId = tabStore.activeTabId;
    const activeIndex = tabStore.tabs.findIndex(t => t.id === activeId);
    if (activeIndex >= 0 && tabRefs[activeIndex]) {
      tabRefs[activeIndex].scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  });

  function handleDragStart(event: DragEvent, index: number) {
    draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDrop(event: DragEvent, index: number) {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    tabStore.reorder(draggedIndex, index);
    draggedIndex = null;
  }

  function handleDropAtEnd(event: DragEvent) {
    event.preventDefault();
    if (draggedIndex === null) return;
    tabStore.reorder(draggedIndex, tabStore.tabs.length - 1);
    draggedIndex = null;
  }

  function handleDragEnd() {
    draggedIndex = null;
  }

  // --- Horizontal scroll with mouse wheel ---
  function handleWheel(event: WheelEvent) {
    // Convert vertical wheel to horizontal scroll
    if (event.deltaY !== 0) {
      event.preventDefault();
      const scrollContainer = event.currentTarget as HTMLElement;
      scrollContainer.scrollLeft += event.deltaY;
    }
  }
</script>

<div class="border-b border-border bg-card">
  <ScrollArea.Root class="w-full" orientation="horizontal" viewportClass="h-full" onwheel={handleWheel}>
    <!--
      h-12 = 48px tab bar height (taller for tab-like appearance)
      items-end = push tab items to the bottom, creating the "tab" visual
      pl-2 = 8px left inset so the first tab follows the Explorer header's leading edge
    -->
    <div class="flex min-w-full h-12 items-end pl-2" role="tablist">
      {#each tabStore.tabs as tab, index (tab.id)}
        {@const iconDef = getTabIcon(tab)}
        {@const isActive = tabStore.activeTabId === tab.id}
        {@const isHome = isHomeTab(tab)}
        {@const isPinned = tab.pinned ?? false}
        {@const isPreview = tab.preview === true}
        {@const visibleLabel = tab.type === 'change' ? formatChangeName(tab.name) : tab.type === 'dashboard' ? FIXED_LABELS.common.dashboard : tab.name}

        <ContextMenu.Root>
          <button
            bind:this={tabRefs[index]}
            type="button"
            class="group relative flex h-9 min-w-15 shrink-0 items-center gap-1 rounded-t-md border border-b-0 border-transparent px-2 text-sm transition-all duration-150
              {isActive
                ? 'max-w-96 border-border bg-background text-foreground -mb-px'
                : 'max-w-64 text-muted-foreground hover:bg-muted/50 hover:text-foreground'}
              {draggedIndex === index ? 'opacity-50' : ''}"
            role="tab"
            aria-selected={isActive}
            aria-label={isPreview ? getPreviewTabAriaLabel(visibleLabel) : getRegularTabAriaLabel(visibleLabel)}
            title={isPreview ? `${visibleLabel} • ${FIXED_LABELS.tab.preview}` : visibleLabel}
            data-preview={isPreview ? 'true' : 'false'}
            draggable={isHome ? false : true}
            onclick={() => tabStore.focus(tab.id)}
            ondblclick={() => tabStore.confirmTab(tab.id)}
            ondragstart={(e) => handleDragStart(e, index)}
            ondragover={handleDragOver}
            ondrop={(e) => handleDrop(e, index)}
            ondragend={handleDragEnd}
          >
            <!-- File-type icon -->
            <iconDef.icon class="h-4 w-4 shrink-0 {iconDef.color}" />

            <!-- Tab name (formatted: date prefix removed for changes) -->
            <span class:italic={isPreview} class="truncate">{visibleLabel}</span>

            <!-- Right slot: Pin icon (pinned, clickable to unpin) or Close button -->
            {#if isPinned}
              <!-- svelte-ignore node_invalid_placement_ssr -->
              <button
                type="button"
                class="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
                tabindex={-1}
                aria-label={isHome ? getPinnedTabAriaLabel(visibleLabel) : FIXED_LABELS.tab.unpinAria}
                disabled={isHome}
                onclick={(e) => {
                  e.stopPropagation();
                  if (!isHome) {
                    togglePin(tab.id, true);
                  }
                }}
              >
                <Pin class="h-3.5 w-3.5" />
              </button>
            {:else}
              <!-- svelte-ignore node_invalid_placement_ssr -->
              <button
                type="button"
                class="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm transition-opacity hover:bg-muted
                  {isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}"
                tabindex={-1}
                aria-label={FIXED_LABELS.tab.closeAria}
                onclick={(e) => { e.stopPropagation(); tabStore.close(tab.id); }}
              >
                <X class="h-3.5 w-3.5" />
              </button>
            {/if}
          </button>

          <!-- Context Menu -->
          <ContextMenu.Content>
            <ContextMenu.Item onSelect={() => togglePin(tab.id, isPinned)} disabled={isHome}>
              {isPinned ? t(m.context_menu_unpin) : t(m.context_menu_pin)}
            </ContextMenu.Item>
            <ContextMenu.Item onSelect={() => tabStore.close(tab.id)} disabled={isPinned || isHome}>
              {t(m.context_menu_close)}
            </ContextMenu.Item>
            <ContextMenu.Item onSelect={() => tabStore.closeOthers(tab.id)} disabled={isHome}>
              {t(m.context_menu_close_others)}
            </ContextMenu.Item>
            <ContextMenu.Item onSelect={() => tabStore.closeAll()}>
              {t(m.context_menu_close_all)}
            </ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item onSelect={() => copyToClipboard(tab.type === 'dashboard' ? visibleLabel : tab.name, t(m.copy_label_tab_name))}>
              <Clipboard class="h-4 w-4" />
              {t(m.context_menu_copy_name)}
            </ContextMenu.Item>
            <ContextMenu.Item onSelect={() => copyToClipboard(`openspec${tab.path}`, t(m.copy_label_tab_path))}>
              <ClipboardCopy class="h-4 w-4" />
              {t(m.context_menu_copy_path)}
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      {/each}

      <!-- Drop zone after last tab (allows dropping at the rightmost position) -->
      {#if draggedIndex !== null}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="h-9 w-12 shrink-0"
          ondragover={handleDragOver}
          ondrop={handleDropAtEnd}
        ></div>
      {/if}
    </div>
  </ScrollArea.Root>
</div>
