<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getDialogContext } from './context';

  interface Props {
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { class: className = '', children, ...restProps }: Props = $props();
  const dialog = getDialogContext();

  function handleWindowKeydown(event: KeyboardEvent) {
    if (dialog.isOpen() && event.key === 'Escape') {
      dialog.setOpen(false);
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if dialog.isOpen()}
  <div class="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" role="presentation">
    <div
      {...restProps}
      role="dialog"
      aria-modal="true"
      class={cn('relative z-50 flex w-full max-w-lg flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-2xl', className)}
    >
      {@render children?.()}
    </div>
  </div>
{/if}
