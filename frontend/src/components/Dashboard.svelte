<script lang="ts">
  import { Bookmark, BookOpen, Calendar, CheckSquare, FileText, House, SquarePen } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { EmptyState } from '$lib/components/ui/empty-state';
  import { IconBox } from '$lib/components/ui/icon-box';
  import { activeChanges, project } from '../stores/index.svelte.ts';
  import { commandPreferencesStore } from '../stores/commandPreferences.svelte.ts';
  import { getWorkspaceCommands } from '../lib/commandShortcuts';
  import { layoutStore } from '../stores/layout.svelte.ts';
  import { tabStore } from '../stores/tabs.svelte.ts';
  import MarkdownRenderer from './MarkdownRenderer.svelte';
  import { Progress } from '$lib/components/ui/progress';
  import CommandShortcutBar from './CommandShortcutBar.svelte';
  import { formatDate } from '../lib/utils';

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
                  {#if change.lastModified}
                    <span class="flex items-center gap-0.5"><Calendar class="h-3.5 w-3.5" />{formatDate(change.lastModified)}</span>
                  {/if}
                  <span class="flex items-center gap-0.5"><FileText class="h-3.5 w-3.5" />{change.specDeltaCount}</span>
                  <span class="flex items-center gap-0.5"><CheckSquare class="h-3.5 w-3.5" />{change.taskProgress.done}/{change.taskProgress.total}</span>
                </div>
              </div>
              <div class="w-32">
                <Progress value={change.taskProgress.percentage} />
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
