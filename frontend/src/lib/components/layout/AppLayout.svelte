<script lang="ts">
  import * as Resizable from '$lib/components/ui/resizable';
  import * as Sheet from '$lib/components/ui/sheet';
  import { layoutStore } from '$lib/state/layout.svelte.ts';
  import { projectStore } from '$lib/state/projects.svelte.ts';
  import { FIXED_LABELS } from '$lib/uiText';
  import ActivityBar from './ActivityBar.svelte';
  import ExplorerPane from './ExplorerPane.svelte';
  import MainViewer from './MainViewer.svelte';
  import ProjectSelector from './ProjectSelector.svelte';
  import AddProjectDialog from './AddProjectDialog.svelte';
  import EmptyProjectState from './EmptyProjectState.svelte';

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
      <Sheet.Overlay class="left-12" />
      <Sheet.Content side="left" aria-label={FIXED_LABELS.layout.explorer} class="z-50 left-12 w-[min(20rem,calc(100vw-3rem-3rem))] max-w-none border-r border-border p-0">
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

  <ProjectSelector open={layoutStore.overlay === 'project-selector'} onClose={() => layoutStore.closeOverlay()} />
  <AddProjectDialog open={layoutStore.overlay === 'add-project'} onClose={() => layoutStore.closeOverlay()} />
</div>
