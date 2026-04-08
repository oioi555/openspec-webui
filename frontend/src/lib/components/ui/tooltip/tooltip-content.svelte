<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getTooltipContext } from './context';

  type Side = 'top' | 'right' | 'bottom' | 'left';

  interface Props {
    side?: Side;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  const sideClasses: Record<Side, string> = {
    top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
    right: 'left-full top-1/2 ml-2 -translate-y-1/2',
    bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
    left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  };

  let { side = 'top', class: className = '', children, ...restProps }: Props = $props();
  const tooltip = getTooltipContext();
</script>

{#if tooltip.isOpen()}
  <div
    {...restProps}
    role="tooltip"
    class={cn(
      'absolute z-50 max-w-xs rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-lg',
      sideClasses[side],
      className,
    )}
  >
    {@render children?.()}
  </div>
{/if}
