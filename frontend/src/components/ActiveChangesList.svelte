<script lang="ts">
  import type { ChangeSummary } from '../lib/api';
  import Icon from './Icon.svelte';
  import TaskProgress from './TaskProgress.svelte';

  interface Props {
    changes?: ChangeSummary[];
    onSelect?: (changeName: string) => void;
  }

  let { changes = [], onSelect = () => {} }: Props = $props();
</script>

<div class="divide-y divide-border">
  {#if changes.length === 0}
    <div class="px-6 py-8 text-center text-on-surface-muted">No active changes</div>
  {:else}
    {#each changes as change}
      <button class="w-full px-6 py-4 hover:bg-surface/50 text-left" onclick={() => onSelect(change.name)}>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-info-bg">
              <Icon name="pencil-square" class="h-5 w-5 text-info" />
            </div>
            <div>
              <div class="font-medium text-on-bg">{change.name}</div>
              <div class="text-sm text-on-surface-muted flex items-center gap-2 mt-1">
                <span>{change.specDeltaCount} spec delta{change.specDeltaCount !== 1 ? 's' : ''}</span>
                {#if change.hasDesign}
                  <span class="rounded px-1.5 py-0.5 text-xs bg-accent-bg text-accent">design</span>
                {/if}
              </div>
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
