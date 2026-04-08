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

<h2 {...restProps} class={cn('text-lg font-semibold text-card-foreground', className)}>
  {@render children?.()}
</h2>
