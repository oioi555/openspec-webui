<script lang="ts">
  import { activeChanges, project, navigateTo } from '../stores/index.svelte.ts';
  import { commandPreferencesStore } from '../stores/commandPreferences.svelte.ts';
  import { getWorkspaceCommands } from '../lib/commandShortcuts';
  import MarkdownRenderer from './MarkdownRenderer.svelte';
  import ActiveChangesList from './ActiveChangesList.svelte';
  import CommandShortcutBar from './CommandShortcutBar.svelte';

  let workspaceCommands = $derived(getWorkspaceCommands(activeChanges.value, commandPreferencesStore));
</script>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-on-bg">Home</h1>
    {#if project.value?.description}
      <p class="text-on-surface-muted mt-1">{project.value.description}</p>
    {/if}
  </div>

  <!-- Active Changes -->
  <div class="bg-surface rounded-lg shadow-lg border border-border">
    <div class="px-6 py-4 border-b border-border flex items-center justify-between">
      <h2 class="text-lg font-semibold text-on-bg">
        Active Changes
        <span class="ml-2 px-1.5 py-0.5 text-xs bg-input-border text-on-surface rounded-full">{activeChanges.value.length}</span>
      </h2>
      <CommandShortcutBar commands={workspaceCommands} />
    </div>
    <ActiveChangesList changes={activeChanges.value} onSelect={(name) => navigateTo(`/changes/${name}`)} />
  </div>

  <!-- Project Info -->
  {#if project.value?.content}
    <div class="bg-surface rounded-lg shadow-lg border border-border">
      <div class="px-6 py-4 border-b border-border">
        <h2 class="text-lg font-semibold text-on-bg">Project Documentation</h2>
      </div>
      <div class="px-6 py-4">
        <MarkdownRenderer content={project.value.content} />
      </div>
    </div>
  {/if}
</div>
