<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getDropdownMenuContext } from './context';

  interface Props {
    inset?: boolean;
    disabled?: boolean;
    closeOnSelect?: boolean;
    onSelect?: () => void;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    inset = false,
    disabled = false,
    closeOnSelect = true,
    onSelect = () => {},
    class: className = '',
    children,
    ...restProps
  }: Props = $props();

  const dropdownMenu = getDropdownMenuContext();

  function handleClick() {
    if (disabled) {
      return;
    }

    onSelect();

    if (closeOnSelect) {
      dropdownMenu.setOpen(false);
    }
  }
</script>

<button
  {...restProps}
  type="button"
  role="menuitem"
  disabled={disabled}
  class={cn(
    'relative flex w-full cursor-default select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-secondary hover:text-foreground focus:bg-secondary disabled:pointer-events-none disabled:opacity-50',
    inset && 'pl-8',
    className,
  )}
  onclick={handleClick}
>
  {@render children?.()}
</button>
