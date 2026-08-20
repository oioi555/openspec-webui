<script lang="ts">
  import { tick, type Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getDialogContext } from './context';

  interface Props {
    class?: string;
    containerClass?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { class: className = '', containerClass = '', children, ...restProps }: Props = $props();
  const dialog = getDialogContext();
  let contentEl: HTMLDivElement | undefined = $state();

  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  $effect(() => {
    if (!dialog.isOpen() || typeof document === 'undefined') return;
    const returnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    void tick().then(() => {
      const firstFocusable = contentEl?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? contentEl)?.focus();
    });

    return () => returnFocus?.focus();
  });

  function handleWindowKeydown(event: KeyboardEvent) {
    if (dialog.isOpen() && event.key === 'Escape') {
      dialog.setOpen(false);
    }
  }

  function handleContentKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !contentEl) return;
    const focusable = [...contentEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
      .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
    if (focusable.length === 0) {
      event.preventDefault();
      contentEl.focus();
      return;
    }

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if dialog.isOpen()}
  <div class={cn('fixed inset-0 z-50 flex items-center justify-center px-4 py-6', containerClass)} role="presentation">
    <div
      bind:this={contentEl}
      {...restProps}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onkeydown={handleContentKeydown}
      class={cn('relative z-50 flex w-full max-w-lg flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-2xl', className)}
    >
      {@render children?.()}
    </div>
  </div>
{/if}
