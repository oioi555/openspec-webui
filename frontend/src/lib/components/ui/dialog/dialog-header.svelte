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

<div {...restProps} class={cn('flex flex-col space-y-2 text-center sm:text-left', className)}>
  {@render children?.()}
</div>
