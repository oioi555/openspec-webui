<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    inset?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { inset = false, class: className = '', children, ...restProps }: Props = $props();
</script>

<div {...restProps} class={cn('px-2 py-1.5 text-sm font-semibold text-card-foreground', inset && 'pl-8', className)}>
  {@render children?.()}
</div>
