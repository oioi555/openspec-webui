<script lang="ts">
  import { Bookmark, BookOpen, House, SquarePen } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { EmptyState } from '$lib/components/ui/empty-state';
  import { IconBox } from '$lib/components/ui/icon-box';
  import { activeChanges, project } from '../stores/index.svelte.ts';
  import { commandPreferencesStore } from '../stores/commandPreferences.svelte.ts';
  import { getWorkspaceCommands } from '../lib/commandShortcuts';
  import { layoutStore } from '../stores/layout.svelte.ts';
  import { tabStore } from '../stores/tabs.svelte.ts';
  import MarkdownRenderer from './MarkdownRenderer.svelte';
  import TaskProgress from './TaskProgress.svelte';
  import CommandShortcutBar from './CommandShortcutBar.svelte';

  let workspaceCommands = $derived(getWorkspaceCommands(activeChanges.value, commandPreferencesStore));

  function openActiveChange(name: string) {
    layoutStore.focusSection('active-changes');
    tabStore.open(`/changes/${encodeURIComponent(name)}`);
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <div>
      <h1 class="flex items-center gap-2 text-2xl font-bold text-foreground">
        <IconBox icon={House} variant="info" />
        Home
      </h1>
      {#if project.value?.description}
        <p class="mt-1 text-muted-foreground">{project.value.description}</p>
      {/if}
    </div>
  </div>
  
  <!-- Active Changes -->
  <div class="rounded-lg border border-border bg-card shadow-lg">
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-border px-6 py-4">
      <h2 class="flex items-center gap-2 text-lg font-semibold text-foreground">
        <SquarePen class="h-5 w-5 text-muted-foreground" />
        Active Changes
        <Badge variant="secondary" class="ml-2 align-middle">{activeChanges.value.length}</Badge>
      </h2>

      {#if workspaceCommands.length > 0}
        <div class="flex max-w-full justify-end lg:max-w-lg">
          <CommandShortcutBar commands={workspaceCommands} />
        </div>
      {/if}
    </div>
    <div class="divide-y divide-border">
      {#if activeChanges.value.length === 0}
        <EmptyState message="No active changes" icon={SquarePen} class="px-6 py-8" />
      {:else}
        {#each activeChanges.value as change}
          <button type="button" class="w-full px-6 py-4 text-left transition-colors hover:bg-secondary/50" onclick={() => openActiveChange(change.name)}>
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-foreground">{change.name}</div>
                <div class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{change.specDeltaCount} spec delta{change.specDeltaCount !== 1 ? 's' : ''}</span>
                  {#if change.hasDesign}
                    <Badge variant="outline" class="text-xs font-medium lowercase">design</Badge>
                  {/if}
                </div>
              </div>
              <div class="w-32">
                <TaskProgress progress={change.taskProgress} size="sm" />
              </div>
            </div>
          </button>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Project Info -->
  {#if project.value?.content}
    <div class="rounded-lg border border-border bg-card shadow-lg">
      <div class="px-6 py-4 border-b border-border">
        <h2 class="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Bookmark class="h-5 w-5 text-muted-foreground" />
          Project Documentation
        </h2>
      </div>
      <div class="px-6 py-4">
        <MarkdownRenderer content={project.value.content} />
      </div>
    </div>
  {/if}
</div>
