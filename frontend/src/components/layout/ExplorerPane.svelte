<script lang="ts">
  import { Archive, Calendar, CheckSquare, ChevronLeft, ChevronsUpDown, FileText, Folder, FolderOpen, SquarePen, X } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { EmptyState } from '$lib/components/ui/empty-state';
  import { ExplorerSection as SharedExplorerSection } from '$lib/components/ui/explorer-section';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import { getWorkspaceCommands } from '../../lib/commandShortcuts';
  import { activeChanges, archivedChanges, project, specs } from '../../stores/index.svelte.ts';
  import { commandPreferencesStore } from '../../stores/commandPreferences.svelte.ts';
  import { layoutStore, type ExplorerSection } from '../../stores/layout.svelte.ts';
  import { tabStore } from '../../stores/tabs.svelte.ts';
  import CommandShortcutBar from '../CommandShortcutBar.svelte';
  import { Progress } from '$lib/components/ui/progress';
  import { formatChangeName, formatDate } from '../../lib/utils';

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
      : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground';
  }
</script>

<aside class="flex h-full min-h-0 flex-col bg-card">
  <div class="flex h-12 items-center justify-between gap-3 border-b border-border px-4 py-3">
    <div class="min-w-0">
      <button
        type="button"
        class="flex max-w-full items-center gap-2 truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
        onclick={() => layoutStore.openOverlay('project-selector')}
      >
        <FolderOpen class="h-4 w-4 shrink-0 text-muted-foreground" />
        <span class="truncate">{project.value?.name ?? 'OpenSpec WebUI'}</span>
        <ChevronsUpDown class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>
    </div>

    {#if temporary}
      <Button
        variant="ghost"
        size="icon"
        class="size-8 text-muted-foreground"
        aria-label="Close explorer"
        onclick={onRequestClose}
      >
        <X class="h-4 w-4" />
      </Button>
    {:else}
      <Button
        variant="ghost"
        size="icon"
        class="size-8 text-muted-foreground"
        aria-label="Collapse explorer"
        onclick={() => layoutStore.setExplorerCollapsed(true)}
      >
        <ChevronLeft class="h-4 w-4" />
      </Button>
    {/if}
  </div>

  <ScrollArea.Root class="min-h-0 flex-1" viewportClass="h-full">
    <div class="space-y-4 p-3">
      {#snippet activeChangesExtra()}
        {#if workspaceCommands.length > 0}
          <CommandShortcutBar commands={workspaceCommands} />
        {/if}
      {/snippet}

      <SharedExplorerSection
        title="Active Changes"
        icon={SquarePen}
        count={activeChanges.value.length}
        open={sectionOpen('active-changes')}
        focused={layoutStore.focusedSection === 'active-changes'}
        onToggle={() => {
          const nextOpen = !sectionOpen('active-changes');
          layoutStore.setSectionCollapsed('active-changes', !nextOpen);
          if (nextOpen) {
            layoutStore.focusSection('active-changes');
          }
        }}
        headerExtra={activeChangesExtra}
      >
        <div class="divide-y divide-border/70">
          {#if activeChanges.value.length === 0}
            <EmptyState message="No active changes" icon={SquarePen} class="px-3 py-6" />
          {:else}
            {#each activeChanges.value as change}
              <button
                type="button"
                class={`flex w-full items-start gap-3 px-3 py-3 text-left transition-colors ${itemClass(`/changes/${encodeURIComponent(change.name)}`)}`}
                onclick={() => openTab(`/changes/${encodeURIComponent(change.name)}`, 'active-changes')}
              >
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-medium" title={change.name}>{change.name}</div>
                  <div class="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <div class="flex items-center gap-2">
                      {#if change.lastModified}
                        <span class="flex items-center gap-0.5"><Calendar class="h-3 w-3" />{formatDate(change.lastModified)}</span>
                      {/if}
                      <span class="flex items-center gap-0.5"><FileText class="h-3 w-3" />{change.specDeltaCount}</span>
                      <span class="flex items-center gap-0.5"><CheckSquare class="h-3 w-3" />{change.taskProgress.done}/{change.taskProgress.total}</span>
                    </div>
                    <div class="w-14 shrink-0">
                      <Progress value={change.taskProgress.percentage} />
                    </div>
                  </div>
                </div>
              </button>
            {/each}
          {/if}
        </div>
      </SharedExplorerSection>

      <SharedExplorerSection
        title="Archive"
        icon={Archive}
        count={archivedChanges.value.length}
        open={sectionOpen('archive')}
        focused={layoutStore.focusedSection === 'archive'}
        onToggle={() => {
          const nextOpen = !sectionOpen('archive');
          layoutStore.setSectionCollapsed('archive', !nextOpen);
          if (nextOpen) {
            layoutStore.focusSection('archive');
          }
        }}
      >
        <div class="divide-y divide-border/70">
          {#if archivedChanges.value.length === 0}
            <EmptyState message="No archived changes" icon={Archive} class="px-3 py-6" />
          {:else}
            {#each archivedChanges.value as change}
              <button
                type="button"
                class={`flex w-full items-start gap-3 px-3 py-3 text-left transition-colors ${itemClass(`/changes/${encodeURIComponent(change.name)}`)}`}
                onclick={() => openTab(`/changes/${encodeURIComponent(change.name)}`, 'archive')}
              >
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-medium" title={change.name}>{formatChangeName(change.name)}</div>
                  <div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {#if change.archivedDate}
                      <span class="flex items-center gap-0.5"><Calendar class="h-3 w-3" />{change.archivedDate}</span>
                    {/if}
                    <span class="flex items-center gap-0.5"><FileText class="h-3 w-3" />{change.specDeltaCount}</span>
                    <span class="flex items-center gap-0.5"><CheckSquare class="h-3 w-3" />{change.taskProgress.done}/{change.taskProgress.total}</span>
                  </div>
                </div>
              </button>
            {/each}
          {/if}
        </div>
      </SharedExplorerSection>

      <SharedExplorerSection
        title="Specs"
        icon={FileText}
        count={specs.value.length}
        open={sectionOpen('specs')}
        focused={layoutStore.focusedSection === 'specs'}
        onToggle={() => {
          const nextOpen = !sectionOpen('specs');
          layoutStore.setSectionCollapsed('specs', !nextOpen);
          if (nextOpen) {
            layoutStore.focusSection('specs');
          }
        }}
      >
        <div class="divide-y divide-border/70">
          {#if specs.value.length === 0}
            <EmptyState message="No specs found" icon={FileText} class="px-3 py-6" />
          {:else}
            {#each specs.value as spec}
              <button
                type="button"
                class={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${itemClass(`/specs/${encodeURIComponent(spec.name)}`)}`}
                onclick={() => openTab(`/specs/${encodeURIComponent(spec.name)}`, 'specs')}
              >
                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-medium">{spec.name}</div>
                  <div class="mt-1 flex items-center gap-0.5 text-xs text-muted-foreground">
                    {#if spec.lastModified}
                      <Calendar class="h-3 w-3" />{formatDate(spec.lastModified)}
                    {/if}
                  </div>
                </div>

                {#if spec.hasDesign}
                  <Badge variant="outline" class="text-[10px] font-medium">Design</Badge>
                {/if}
              </button>
            {/each}
          {/if}
        </div>
      </SharedExplorerSection>
    </div>
  </ScrollArea.Root>
</aside>
