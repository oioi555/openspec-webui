<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getCollapsibleContext } from './context';

  interface Props {
    disabled?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { disabled = false, class: className = '', children, ...restProps }: Props = $props();

  const collapsible = getCollapsibleContext();

  function handleClick() {
    if (!disabled) {
      collapsible.toggle();
    }
  }
</script>

<button
  {...restProps}
  type="button"
  aria-expanded={collapsible.isOpen()}
  data-state={collapsible.isOpen() ? 'open' : 'closed'}
  disabled={disabled}
  class={cn('inline-flex items-center gap-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50', className)}
  onclick={handleClick}
>
  {@render children?.()}
</button>
