<script lang="ts">
  import { SquarePen } from '@lucide/svelte';
  import type { ChangeSummary } from '../lib/api';
  import TaskProgress from './TaskProgress.svelte';

  interface Props {
    changes?: ChangeSummary[];
    onSelect?: (changeName: string) => void;
  }

  let { changes = [], onSelect = () => {} }: Props = $props();
</script>

<div class="divide-y divide-border">
  {#if changes.length === 0}
    <div class="px-6 py-8 text-center text-muted-foreground">No active changes</div>
  {:else}
    {#each changes as change}
      <button class="w-full px-6 py-4 text-left transition-colors hover:bg-secondary/50" onclick={() => onSelect(change.name)}>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-info-bg">
              <SquarePen class="h-5 w-5 text-info" />
            </div>
            <div>
              <div class="font-medium text-foreground">{change.name}</div>
              <div class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span>{change.specDeltaCount} spec delta{change.specDeltaCount !== 1 ? 's' : ''}</span>
                {#if change.hasDesign}
                  <span class="rounded bg-accent/15 px-1.5 py-0.5 text-xs text-accent">design</span>
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
