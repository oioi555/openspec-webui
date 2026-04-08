<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getTooltipContext } from './context';

  interface Props {
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { class: className = '', children, ...restProps }: Props = $props();
  const tooltip = getTooltipContext();
</script>

<button
  {...restProps}
  type="button"
  class={cn('inline-flex items-center', className)}
  onmouseenter={() => tooltip.setOpen(true)}
  onmouseleave={() => tooltip.setOpen(false)}
  onfocus={() => tooltip.setOpen(true)}
  onblur={() => tooltip.setOpen(false)}
>
  {@render children?.()}
</button>
