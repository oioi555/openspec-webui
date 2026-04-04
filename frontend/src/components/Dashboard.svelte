<script lang="ts">
  import { stats, activeChanges, project, navigateTo } from '../stores/index';
  import { commandPreferencesStore } from '../stores/commandPreferences';
  import { getWorkspaceCommands } from '../lib/commandShortcuts';
  import TaskProgress from './TaskProgress.svelte';
  import MarkdownRenderer from './MarkdownRenderer.svelte';
  import ActiveChangesList from './ActiveChangesList.svelte';
  import CommandShortcutBar from './CommandShortcutBar.svelte';

  $: workspaceCommands = getWorkspaceCommands($activeChanges, $commandPreferencesStore);
</script>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-100">Home</h1>
    {#if $project?.description}
      <p class="text-gray-400 mt-1">{$project.description}</p>
    {/if}
  </div>

  <!-- Stats Cards -->
  {#if $stats}
    <div class="grid grid-cols-3 gap-3">
      <!-- Active Changes -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 px-4 py-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-400">Active Changes</div>
            <div class="text-2xl font-bold text-blue-400">{$stats.activeChanges}</div>
          </div>
          {#if $stats.activeChanges > 0}
            <div class="w-20">
              <TaskProgress progress={$stats.overallTaskProgress} size="sm" />
            </div>
          {/if}
        </div>
      </div>

      <!-- Archived Changes (link) -->
      <button
        class="bg-gray-800 rounded-lg border border-gray-700 px-4 py-3 text-left hover:bg-gray-750 hover:border-gray-600 transition-colors"
        onclick={() => navigateTo('/changes')}
      >
        <div class="text-sm text-gray-400">Archived Changes</div>
        <div class="text-2xl font-bold text-gray-100">{$stats.archivedChanges}</div>
      </button>

      <!-- Total Specs (link) -->
      <button
        class="bg-gray-800 rounded-lg border border-gray-700 px-4 py-3 text-left hover:bg-gray-750 hover:border-gray-600 transition-colors"
        onclick={() => navigateTo('/specs')}
      >
        <div class="text-sm text-gray-400">Total Specs</div>
        <div class="text-2xl font-bold text-gray-100">{$stats.totalSpecs}</div>
      </button>
    </div>
  {/if}

  <!-- Active Changes -->
  <div class="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
    <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-100">Active Changes</h2>
      <CommandShortcutBar commands={workspaceCommands} />
    </div>
    <ActiveChangesList changes={$activeChanges} onSelect={(name) => navigateTo(`/changes/${name}`)} />
  </div>

  <!-- Project Info -->
  {#if $project?.content}
    <div class="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      <div class="px-6 py-4 border-b border-gray-700">
        <h2 class="text-lg font-semibold text-gray-100">Project Documentation</h2>
      </div>
      <div class="px-6 py-4">
        <MarkdownRenderer content={$project.content} />
      </div>
    </div>
  {/if}
</div>
