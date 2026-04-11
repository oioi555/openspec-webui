<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getContextMenuContext } from './context';

  interface Props {
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { class: className = '', children, ...restProps }: Props = $props();
  const contextMenu = getContextMenuContext();

  let contentElement = $state<HTMLElement | null>(null);

  function handleWindowPointerdown(event: PointerEvent) {
    if (!contextMenu.isOpen()) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (contentElement?.contains(target)) {
      return;
    }

    contextMenu.setOpen(false);
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (contextMenu.isOpen() && event.key === 'Escape') {
      contextMenu.setOpen(false);
    }
  }

  /** Clamp position after element mounts so menu stays in viewport */
  $effect(() => {
    if (contextMenu.isOpen() && contentElement) {
      const pos = contextMenu.getPosition();
      const rect = contentElement.getBoundingClientRect();
      const pad = 8;
      let x = pos.x;
      let y = pos.y;
      if (x + rect.width > window.innerWidth - pad) x = window.innerWidth - rect.width - pad;
      if (y + rect.height > window.innerHeight - pad) y = window.innerHeight - rect.height - pad;
      if (x < pad) x = pad;
      if (y < pad) y = pad;
      contentElement.style.left = `${x}px`;
      contentElement.style.top = `${y}px`;
    }
  });
</script>

<svelte:window onpointerdown={handleWindowPointerdown} onkeydown={handleWindowKeydown} />

{#if contextMenu.isOpen()}
  <div
    bind:this={contentElement}
    {...restProps}
    role="menu"
    style="position: fixed; left: {contextMenu.getPosition().x}px; top: {contextMenu.getPosition().y}px;"
    class={cn(
      'z-50 min-w-40 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg',
      className,
    )}
  >
    {@render children?.()}
  </div>
{:else}
  <!-- keep contentElement null when closed -->
{/if}
