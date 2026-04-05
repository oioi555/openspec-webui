<script lang="ts">
  import { archivedChanges, navigateTo } from '../stores/index.svelte.ts';
  import Icon from './Icon.svelte';
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-on-bg">Archived Changes</h1>
    <p class="text-on-surface-muted mt-1">Completed and archived change proposals</p>
  </div>

  <!-- Archived Changes -->
  <div class="bg-surface rounded-lg shadow-lg border border-border">
    {#if archivedChanges.value.length === 0}
      <div class="px-6 py-8 text-center text-on-surface-muted">No archived changes</div>
    {:else}
      <div class="divide-y divide-border">
        {#each archivedChanges.value as change}
          <button
            class="w-full px-6 py-4 hover:bg-surface/50 text-left"
            onclick={() => navigateTo(`/changes/${change.name}`)}
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-input-bg flex items-center justify-center">
                  <Icon name="archive-box" class="h-5 w-5 text-on-surface-muted" />
                </div>
                <div>
                  <div class="font-medium text-on-surface">{change.name}</div>
                  {#if change.archivedDate}
                    <div class="text-sm text-on-surface-muted">Archived: {change.archivedDate}</div>
                  {/if}
                </div>
              </div>
              <span class="rounded px-2 py-1 text-xs bg-success-bg text-success">Completed</span>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
