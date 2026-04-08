<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getDropdownMenuContext } from './context';

  type Side = 'top' | 'bottom';
  type Align = 'start' | 'center' | 'end';

  interface Props {
    side?: Side;
    align?: Align;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  const sideClasses: Record<Side, string> = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  };

  const alignClasses: Record<Align, string> = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  let { side = 'bottom', align = 'start', class: className = '', children, ...restProps }: Props = $props();
  const dropdownMenu = getDropdownMenuContext();

  let contentElement = $state<HTMLElement | null>(null);

  $effect(() => {
    dropdownMenu.setContentElement(contentElement);
  });

  function handleWindowPointerdown(event: PointerEvent) {
    if (!dropdownMenu.isOpen()) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    const triggerElement = dropdownMenu.getTriggerElement();

    if (contentElement?.contains(target) || triggerElement?.contains(target)) {
      return;
    }

    dropdownMenu.setOpen(false);
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (dropdownMenu.isOpen() && event.key === 'Escape') {
      dropdownMenu.setOpen(false);
    }
  }
</script>

<svelte:window onpointerdown={handleWindowPointerdown} onkeydown={handleWindowKeydown} />

{#if dropdownMenu.isOpen()}
  <div
    bind:this={contentElement}
    {...restProps}
    role="menu"
    class={cn(
      'absolute z-50 min-w-40 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg',
      sideClasses[side],
      alignClasses[align],
      className,
    )}
  >
    {@render children?.()}
  </div>
{/if}
