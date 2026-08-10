<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getDropdownMenuContext } from './context';

  interface Props {
    disabled?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { disabled = false, class: className = '', children, ...restProps }: Props = $props();
  const dropdownMenu = getDropdownMenuContext();

  let triggerElement = $state<HTMLElement | null>(null);

  $effect(() => {
    dropdownMenu.setTriggerElement(triggerElement);
  });

  function handleKeydown(event: KeyboardEvent) {
    if (disabled) return;

    // ArrowDown/ArrowUp open the menu.  The Content component's $effect will
    // focus the first/last item respectively after the DOM updates.
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!dropdownMenu.isOpen()) {
        event.preventDefault();
        dropdownMenu.setOpen(true);
      }
    }
  }
</script>

<button
  bind:this={triggerElement}
  {...restProps}
  type="button"
  aria-haspopup="menu"
  aria-expanded={dropdownMenu.isOpen()}
  disabled={disabled}
  class={cn('inline-flex items-center gap-2', className)}
  onclick={() => !disabled && dropdownMenu.setOpen(!dropdownMenu.isOpen())}
  onkeydown={handleKeydown}
>
  {@render children?.()}
</button>
