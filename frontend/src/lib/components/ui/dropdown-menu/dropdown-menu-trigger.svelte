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
>
  {@render children?.()}
</button>
