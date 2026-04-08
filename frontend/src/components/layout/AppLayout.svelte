<script lang="ts">
  import { ChevronRight } from '@lucide/svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Resizable from '$lib/components/ui/resizable';
  import * as Sheet from '$lib/components/ui/sheet';
  import { layoutStore } from '../../stores/layout.svelte.ts';
  import SettingsModal from '../SettingsModal.svelte';
  import ActivityBar from './ActivityBar.svelte';
  import ExplorerPane from './ExplorerPane.svelte';
  import MainViewer from './MainViewer.svelte';
  import SearchDialog from './SearchDialog.svelte';

  let dragStartWidth = $state(layoutStore.rememberedExplorerWidth);

  function getExplorerMaxWidth() {
    if (typeof window === 'undefined') {
      return 400;
    }

    return Math.max(180, Math.min(400, window.innerWidth - 48 - 1 - 300));
  }

  function handleDragStart() {
    dragStartWidth = layoutStore.rememberedExplorerWidth;
  }

  function handleDrag(detail: { deltaX: number }) {
    const nextWidth = Math.min(Math.max(dragStartWidth + detail.deltaX, 180), getExplorerMaxWidth());
    layoutStore.setExplorerWidth(nextWidth);
  }

  function closeOverlay() {
    layoutStore.closeOverlay();
  }
</script>

<div class="flex h-full min-h-0 min-w-0 overflow-hidden bg-background text-foreground">
  <ActivityBar />

  {#if layoutStore.responsiveMode === 'narrow'}
    <div class="min-h-0 min-w-0 flex-1 overflow-hidden">
      <MainViewer />
    </div>

    <Sheet.Root open={layoutStore.narrowDrawerOpen} onOpenChange={(open) => layoutStore.setNarrowDrawerOpen(open)}>
      <Sheet.Overlay />
      <Sheet.Content side="left" aria-label="Explorer" class="z-50 w-[min(20rem,calc(100vw-3rem))] max-w-none border-r border-border p-0">
        <ExplorerPane temporary={true} onItemSelected={() => layoutStore.setNarrowDrawerOpen(false)} onRequestClose={() => layoutStore.setNarrowDrawerOpen(false)} />
      </Sheet.Content>
    </Sheet.Root>
  {:else}
    <div class="min-h-0 min-w-0 flex-1 overflow-hidden">
      <div class="flex h-full min-h-0 min-w-0 overflow-hidden">
        {#if !layoutStore.explorerCollapsed}
          <Resizable.PanelGroup direction="horizontal" class="h-full">
            <Resizable.Panel
              defaultSize={`${layoutStore.explorerWidth}px`}
              minSize="180px"
              maxSize="400px"
              class="flex-none shrink-0 border-r border-border"
            >
              <ExplorerPane />
            </Resizable.Panel>

            <Resizable.Handle onDragStart={handleDragStart} onDrag={handleDrag} />

            <Resizable.Panel minSize="300px" class="min-w-0 flex-1">
              <MainViewer />
            </Resizable.Panel>
          </Resizable.PanelGroup>
        {:else}
          <div class="min-h-0 min-w-0 flex-1 overflow-hidden">
            <div class="flex h-full min-h-0 min-w-0 overflow-hidden">
              <button
                type="button"
                class="m-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label="Expand explorer"
                onclick={() => layoutStore.setExplorerCollapsed(false)}
              >
                <ChevronRight class="h-4 w-4" />
              </button>
              <div class="min-h-0 min-w-0 flex-1 overflow-hidden">
                <MainViewer />
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <SearchDialog open={layoutStore.overlay === 'search'} onClose={closeOverlay} />
  <SettingsModal open={layoutStore.overlay === 'settings'} onClose={closeOverlay} />

  <Dialog.Root open={layoutStore.overlay === 'project-selector'} onOpenChange={(open) => !open && closeOverlay()}>
    <Dialog.Overlay />
    <Dialog.Content class="max-w-md">
      <Dialog.Header>
        <Dialog.Title>Project Selector</Dialog.Title>
        <Dialog.Description>This placeholder keeps the Activity Bar project control interactive until a real selector is wired in.</Dialog.Description>
      </Dialog.Header>

      <div class="rounded-lg border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
        Project switching is not implemented in this shell pass.
      </div>
    </Dialog.Content>
  </Dialog.Root>
</div>
