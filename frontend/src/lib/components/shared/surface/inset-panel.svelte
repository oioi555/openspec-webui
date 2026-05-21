<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    dashed?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { dashed = false, class: className = '', children, ...restProps }: Props = $props();
</script>

<div
  {...restProps}
  data-slot="inset-panel"
  class={cn(
    'rounded-md border px-4 py-4',
    dashed ? 'border-dashed border-border/80 bg-background/40' : 'border-border/70 bg-background/70',
    className,
  )}
>
  {@render children?.()}
</div>
