<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getDropdownMenuContext } from './context';
  import {
    getMenuItems,
    focusFirst,
    handleMenuKeydown,
  } from './menuNavigation';

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

  // Focus the first enabled menuitem after the content mounts.
  // Uses a microtask so the DOM is fully rendered before querying.
  $effect(() => {
    if (!dropdownMenu.isOpen() || !contentElement) return;

    const frame = requestAnimationFrame(() => {
      if (!contentElement) return;
      const items = getMenuItems(contentElement);
      if (items.length > 0) {
        focusFirst(items);
      } else {
        // No focusable items — make content itself focusable for keyboard users.
        contentElement.tabIndex = -1;
        contentElement.focus();
      }
    });

    return () => cancelAnimationFrame(frame);
  });

  function closeAndReturnFocus() {
    const trigger = dropdownMenu.getTriggerElement();
    dropdownMenu.setOpen(false);
    // Return focus to trigger after the DOM updates.
    requestAnimationFrame(() => {
      trigger?.focus();
    });
  }

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

    closeAndReturnFocus();
  }

  function handleContentKeydown(event: KeyboardEvent) {
    if (!contentElement) return;

    const result = handleMenuKeydown(event, contentElement);

    if (result === 'escape') {
      event.preventDefault();
      closeAndReturnFocus();
    }
  }
</script>

<svelte:window onpointerdown={handleWindowPointerdown} />

{#if dropdownMenu.isOpen()}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    bind:this={contentElement}
    {...restProps}
    role="menu"
    onkeydown={handleContentKeydown}
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
