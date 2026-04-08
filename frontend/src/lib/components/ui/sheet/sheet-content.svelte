<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getSheetContext } from './context';

  type Side = 'top' | 'right' | 'bottom' | 'left';

  interface Props {
    side?: Side;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  const sideClasses: Record<Side, string> = {
    top: 'inset-x-0 top-0 border-b',
    right: 'right-0 top-0 h-full w-full max-w-md border-l',
    bottom: 'inset-x-0 bottom-0 border-t',
    left: 'left-0 top-0 h-full w-full max-w-md border-r',
  };

  let { side = 'right', class: className = '', children, ...restProps }: Props = $props();
  const sheet = getSheetContext();

  function handleWindowKeydown(event: KeyboardEvent) {
    if (sheet.isOpen() && event.key === 'Escape') {
      sheet.setOpen(false);
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if sheet.isOpen()}
  <div
    {...restProps}
    role="dialog"
    aria-modal="true"
    class={cn(
      'fixed z-50 bg-card p-6 shadow-2xl',
      side === 'right' || side === 'left' ? 'overflow-y-auto' : 'max-h-[80vh] overflow-y-auto',
      sideClasses[side],
      className,
    )}
  >
    {@render children?.()}
  </div>
{/if}
