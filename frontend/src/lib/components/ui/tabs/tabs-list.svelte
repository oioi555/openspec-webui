<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { class: className = '', children, ...restProps }: Props = $props();
</script>

<div
  {...restProps}
  role="tablist"
  class={cn('inline-flex h-10 items-center justify-center rounded-lg bg-secondary p-1 text-muted-foreground', className)}
>
  {@render children?.()}
</div>
