<script lang="ts">
  import { Archive, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, FileText, SquarePen, X } from '@lucide/svelte';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import { getWorkspaceCommands } from '../../lib/commandShortcuts';
  import { activeChanges, archivedChanges, project, specs } from '../../stores/index.svelte.ts';
  import { commandPreferencesStore } from '../../stores/commandPreferences.svelte.ts';
  import { layoutStore, type ExplorerSection } from '../../stores/layout.svelte.ts';
  import { tabStore } from '../../stores/tabs.svelte.ts';
  import CommandShortcutBar from '../CommandShortcutBar.svelte';
  import TaskProgress from '../TaskProgress.svelte';

  interface Props {
    temporary?: boolean;
    onItemSelected?: () => void;
    onRequestClose?: () => void;
  }

  let {
    temporary = false,
    onItemSelected = () => {},
    onRequestClose = () => {},
  }: Props = $props();

  let workspaceCommands = $derived(getWorkspaceCommands(activeChanges.value, commandPreferencesStore));

  function sectionOpen(section: ExplorerSection) {
    return !layoutStore.sectionCollapsed[section];
  }

  function openTab(path: string, section: ExplorerSection) {
    layoutStore.focusSection(section);
    tabStore.open(path);
    onItemSelected();
  }

  function itemClass(path: string) {
    return tabStore.activeTab.path === path
      ? 'bg-primary/10 text-foreground'
      : 'text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground';
  }
</script>

<aside class="flex h-full min-h-0 flex-col bg-card">
  <div class="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
    <div class="min-w-0">
      <div class="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Workspace</div>
      <button
        type="button"
        class="flex max-w-full items-center gap-2 truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
        onclick={() => layoutStore.openOverlay('project-selector')}
      >
        <span class="truncate">{project.value?.name ?? 'OpenSpec WebUI'}</span>
        <ChevronsUpDown class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>
    </div>

    {#if temporary}
      <button
        type="button"
        class="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Close explorer"
        onclick={onRequestClose}
      >
        <X class="h-4 w-4" />
      </button>
    {:else}
      <button
        type="button"
        class="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Collapse explorer"
        onclick={() => layoutStore.setExplorerCollapsed(true)}
      >
        <ChevronLeft class="h-4 w-4" />
      </button>
    {/if}
  </div>

  <ScrollArea.Root class="min-h-0 flex-1" viewportClass="h-full">
    <div class="space-y-4 p-3">
      <Collapsible.Root
        open={sectionOpen('active-changes')}
        onOpenChange={(open) => {
          layoutStore.setSectionCollapsed('active-changes', !open);
          if (open) {
            layoutStore.focusSection('active-changes');
          }
        }}
        class={`overflow-hidden rounded-lg border border-border/70 ${layoutStore.focusedSection === 'active-changes' ? 'ring-1 ring-ring/40' : ''}`}
      >
        <div class="border-b border-border/70 bg-secondary/40 px-3 py-2">
          <div class="flex items-center justify-between gap-2">
            <Collapsible.Trigger class="flex flex-1 items-center justify-between rounded-md px-1 py-1 text-left">
              <span class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Active Changes</span>
              <span class="flex items-center gap-2">
                <span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">{activeChanges.value.length}</span>
                {#if sectionOpen('active-changes')}
                  <ChevronDown class="h-4 w-4 text-muted-foreground" />
                {:else}
                  <ChevronRight class="h-4 w-4 text-muted-foreground" />
                {/if}
              </span>
            </Collapsible.Trigger>
          </div>

          {#if workspaceCommands.length > 0}
            <div class="mt-2">
              <CommandShortcutBar commands={workspaceCommands} />
            </div>
          {/if}
        </div>

        <Collapsible.Content>
          <div class="divide-y divide-border/70">
            {#if activeChanges.value.length === 0}
              <div class="px-3 py-6 text-sm text-muted-foreground">No active changes</div>
            {:else}
              {#each activeChanges.value as change}
                <button
                  type="button"
                  class={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${itemClass(`/changes/${encodeURIComponent(change.name)}`)}`}
                  onclick={() => openTab(`/changes/${encodeURIComponent(change.name)}`, 'active-changes')}
                >
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-info-bg text-info">
                    <SquarePen class="h-4 w-4" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium">{change.name}</div>
                    <div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{change.specDeltaCount} delta{change.specDeltaCount === 1 ? '' : 's'}</span>
                      {#if change.hasDesign}
                        <span class="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">Design</span>
                      {/if}
                    </div>
                  </div>

                  <div class="w-20 shrink-0">
                    <TaskProgress progress={change.taskProgress} size="sm" />
                  </div>
                </button>
              {/each}
            {/if}
          </div>
        </Collapsible.Content>
      </Collapsible.Root>

      <Collapsible.Root
        open={sectionOpen('archive')}
        onOpenChange={(open) => {
          layoutStore.setSectionCollapsed('archive', !open);
          if (open) {
            layoutStore.focusSection('archive');
          }
        }}
        class={`overflow-hidden rounded-lg border border-border/70 ${layoutStore.focusedSection === 'archive' ? 'ring-1 ring-ring/40' : ''}`}
      >
        <div class="border-b border-border/70 bg-secondary/40 px-3 py-2">
          <Collapsible.Trigger class="flex w-full items-center justify-between rounded-md px-1 py-1 text-left">
            <span class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Archive</span>
            <span class="flex items-center gap-2">
              <span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">{archivedChanges.value.length}</span>
              {#if sectionOpen('archive')}
                <ChevronDown class="h-4 w-4 text-muted-foreground" />
              {:else}
                <ChevronRight class="h-4 w-4 text-muted-foreground" />
              {/if}
            </span>
          </Collapsible.Trigger>
        </div>

        <Collapsible.Content>
          <div class="divide-y divide-border/70">
            {#if archivedChanges.value.length === 0}
              <div class="px-3 py-6 text-sm text-muted-foreground">No archived changes</div>
            {:else}
              {#each archivedChanges.value as change}
                <button
                  type="button"
                  class={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${itemClass(`/changes/${encodeURIComponent(change.name)}`)}`}
                  onclick={() => openTab(`/changes/${encodeURIComponent(change.name)}`, 'archive')}
                >
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Archive class="h-4 w-4" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium">{change.name}</div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {change.taskProgress.done} / {change.taskProgress.total} tasks complete
                    </div>
                  </div>

                  <span class="rounded-full bg-success-bg px-2 py-0.5 text-[10px] font-medium text-success">Done</span>
                </button>
              {/each}
            {/if}
          </div>
        </Collapsible.Content>
      </Collapsible.Root>

      <Collapsible.Root
        open={sectionOpen('specs')}
        onOpenChange={(open) => {
          layoutStore.setSectionCollapsed('specs', !open);
          if (open) {
            layoutStore.focusSection('specs');
          }
        }}
        class={`overflow-hidden rounded-lg border border-border/70 ${layoutStore.focusedSection === 'specs' ? 'ring-1 ring-ring/40' : ''}`}
      >
        <div class="border-b border-border/70 bg-secondary/40 px-3 py-2">
          <Collapsible.Trigger class="flex w-full items-center justify-between rounded-md px-1 py-1 text-left">
            <span class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Specs</span>
            <span class="flex items-center gap-2">
              <span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">{specs.value.length}</span>
              {#if sectionOpen('specs')}
                <ChevronDown class="h-4 w-4 text-muted-foreground" />
              {:else}
                <ChevronRight class="h-4 w-4 text-muted-foreground" />
              {/if}
            </span>
          </Collapsible.Trigger>
        </div>

        <Collapsible.Content>
          <div class="divide-y divide-border/70">
            {#if specs.value.length === 0}
              <div class="px-3 py-6 text-sm text-muted-foreground">No specs found</div>
            {:else}
              {#each specs.value as spec}
                <button
                  type="button"
                  class={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${itemClass(`/specs/${encodeURIComponent(spec.name)}`)}`}
                  onclick={() => openTab(`/specs/${encodeURIComponent(spec.name)}`, 'specs')}
                >
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-success-bg text-success">
                    <FileText class="h-4 w-4" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium">{spec.name}</div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {spec.hasDesign ? 'spec + design' : 'spec only'}
                    </div>
                  </div>

                  {#if spec.hasDesign}
                    <span class="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">Design</span>
                  {/if}
                </button>
              {/each}
            {/if}
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  </ScrollArea.Root>
</aside>
