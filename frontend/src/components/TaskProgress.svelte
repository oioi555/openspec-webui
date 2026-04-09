<script lang="ts">
  import type { TaskProgress } from '../lib/api';

  interface Props {
    progress: TaskProgress;
    size?: 'sm' | 'md';
    showLabel?: boolean;
    showFraction?: boolean;
  }

  let { progress, size = 'md', showLabel = false, showFraction = true }: Props = $props();

  let percentage = $derived(progress.percentage);
  let color = $derived(
    percentage === 100
      ? 'bg-success-solid'
      : percentage > 50
        ? 'bg-primary'
      : percentage > 0
        ? 'bg-warning-solid'
          : 'bg-muted'
  );
</script>

<div class="w-full">
  <div class="flex items-center gap-2">
    <div
      class="flex-1 overflow-hidden rounded-full bg-secondary {size === 'sm' ? 'h-2' : 'h-3'}"
    >
      <div
        class="h-full rounded-full transition-all duration-300 {color}"
        style="width: {percentage}%"
      ></div>
    </div>
    {#if showFraction}
      <span class="whitespace-nowrap text-sm text-muted-foreground {size === 'sm' ? 'text-xs' : ''}">
        {progress.done}/{progress.total}
      </span>
    {/if}
  </div>
  {#if showLabel}
    <div class="mt-1 text-sm text-muted-foreground">
      {percentage}% complete
    </div>
  {/if}
</div>
