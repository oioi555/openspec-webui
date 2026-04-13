<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Resizable from '$lib/components/ui/resizable';
  import * as Sheet from '$lib/components/ui/sheet';
  import { layoutStore } from '../../stores/layout.svelte.ts';
  import { projectStore } from '../../stores/projects.svelte.ts';
  import SettingsModal from '../SettingsModal.svelte';
  import ActivityBar from './ActivityBar.svelte';
  import ExplorerPane from './ExplorerPane.svelte';
  import MainViewer from './MainViewer.svelte';
  import SearchDialog from './SearchDialog.svelte';
  import ProjectSelector from './ProjectSelector.svelte';
  import EmptyProjectState from '../EmptyProjectState.svelte';

  let dragStartWidth = $state(layoutStore.rememberedExplorerWidth);

  function getExplorerMaxWidth() {
    if (typeof window === 'undefined') {
      return 600;
    }

    return Math.max(180, Math.min(600, window.innerWidth - 48 - 1 - 300));
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

  {#if !projectStore.activeProjectId}
    <div class="min-h-0 min-w-0 flex-1 overflow-hidden">
      <EmptyProjectState />
    </div>
  {:else if layoutStore.responsiveMode === 'narrow'}
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
              maxSize="600px"
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
            <MainViewer />
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
      <ProjectSelector />
    </Dialog.Content>
  </Dialog.Root>
</div>
