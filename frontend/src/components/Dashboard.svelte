<script lang="ts">
  import { activeChanges, project } from '../stores/index.svelte.ts';
  import { commandPreferencesStore } from '../stores/commandPreferences.svelte.ts';
  import { getWorkspaceCommands } from '../lib/commandShortcuts';
  import { layoutStore } from '../stores/layout.svelte.ts';
  import { tabStore } from '../stores/tabs.svelte.ts';
  import MarkdownRenderer from './MarkdownRenderer.svelte';
  import ActiveChangesList from './ActiveChangesList.svelte';
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
      <h1 class="text-2xl font-bold text-foreground">Home</h1>
      {#if project.value?.description}
        <p class="mt-1 text-muted-foreground">{project.value.description}</p>
      {/if}
    </div>
  </div>
  
  <!-- Active Changes -->
  <div class="rounded-lg border border-border bg-card shadow-lg">
    <div class="flex items-center justify-between border-b border-border px-6 py-4">
      <h2 class="text-lg font-semibold text-foreground">
        Active Changes <span class="badge-num">{activeChanges.value.length}</span>
      </h2>

      <CommandShortcutBar commands={workspaceCommands} />
    </div>
    <ActiveChangesList changes={activeChanges.value} onSelect={openActiveChange} />
  </div>

  <!-- Project Info -->
  {#if project.value?.content}
    <div class="rounded-lg border border-border bg-card shadow-lg">
      <div class="px-6 py-4 border-b border-border">
        <h2 class="text-lg font-semibold text-foreground">Project Documentation</h2>
      </div>
      <div class="px-6 py-4">
        <MarkdownRenderer content={project.value.content} />
      </div>
    </div>
  {/if}
</div>
