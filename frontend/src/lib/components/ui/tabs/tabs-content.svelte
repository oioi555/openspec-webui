<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getTabsContext } from './context';

  interface Props {
    value: string;
    forceMount?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { value, forceMount = false, class: className = '', children, ...restProps }: Props = $props();

  const tabs = getTabsContext();
</script>

{#if forceMount || tabs.getValue() === value}
  <div
    {...restProps}
    role="tabpanel"
    hidden={tabs.getValue() !== value}
    data-state={tabs.getValue() === value ? 'active' : 'inactive'}
    class={cn('mt-2 outline-none', className)}
  >
    {@render children?.()}
  </div>
{/if}
