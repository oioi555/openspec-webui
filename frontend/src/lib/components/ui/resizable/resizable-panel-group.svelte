<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  type Direction = 'horizontal' | 'vertical';

  interface Props {
    direction?: Direction;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { direction = 'horizontal', class: className = '', children, ...restProps }: Props = $props();
</script>

<div
  {...restProps}
  data-direction={direction}
  class={cn('flex size-full min-h-0 min-w-0', direction === 'horizontal' ? 'flex-row' : 'flex-col', className)}
>
  {@render children?.()}
</div>
