<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getCollapsibleContext } from './context';

  interface Props {
    forceMount?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { forceMount = false, class: className = '', children, ...restProps }: Props = $props();

  const collapsible = getCollapsibleContext();
</script>

{#if forceMount || collapsible.isOpen()}
  <div {...restProps} hidden={!collapsible.isOpen()} class={cn('overflow-hidden', className)}>
    {@render children?.()}
  </div>
{/if}
