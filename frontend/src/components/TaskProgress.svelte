<script lang="ts">
  import type { TaskProgress } from '../lib/api';

  interface Props {
    progress: TaskProgress;
    size?: 'sm' | 'md';
    showLabel?: boolean;
  }

  let { progress, size = 'md', showLabel = false }: Props = $props();

  let percentage = $derived(progress.percentage);
  let color = $derived(
    percentage === 100
      ? 'bg-success-solid'
      : percentage > 50
        ? 'bg-brand'
        : percentage > 0
          ? 'bg-warning-solid'
          : 'bg-input-border'
  );
</script>

<div class="w-full">
  <div class="flex items-center gap-2">
    <div
      class="flex-1 bg-input-bg rounded-full overflow-hidden {size === 'sm' ? 'h-2' : 'h-3'}"
    >
      <div
        class="h-full rounded-full transition-all duration-300 {color}"
        style="width: {percentage}%"
      ></div>
    </div>
    <span class="text-sm text-on-surface-muted whitespace-nowrap {size === 'sm' ? 'text-xs' : ''}">
      {progress.done}/{progress.total}
    </span>
  </div>
  {#if showLabel}
    <div class="text-sm text-on-surface-muted mt-1">
      {percentage}% complete
    </div>
  {/if}
</div>
