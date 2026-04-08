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

<div {...restProps} class={cn('mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}>
  {@render children?.()}
</div>
