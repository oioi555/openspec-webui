<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getTabsContext } from './context';

  interface Props {
    value: string;
    disabled?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { value, disabled = false, class: className = '', children, ...restProps }: Props = $props();

  const tabs = getTabsContext();

  function handleClick() {
    if (!disabled) {
      tabs.setValue(value);
    }
  }
</script>

<button
  {...restProps}
  type="button"
  role="tab"
  aria-selected={tabs.getValue() === value}
  data-state={tabs.getValue() === value ? 'active' : 'inactive'}
  disabled={disabled}
  class={cn(
    'inline-flex min-w-0 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    tabs.getValue() === value && 'bg-background text-foreground shadow-sm',
    className,
  )}
  onclick={handleClick}
>
  {@render children?.()}
</button>
