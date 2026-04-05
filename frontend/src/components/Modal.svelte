<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import type { IconName } from './Icon.svelte';

  interface Props {
    open?: boolean;
    title?: string;
    description?: string | null;
    titleIcon?: IconName | null;
    size?: 'md' | 'lg';
    fixedHeight?: boolean;
    bodyClass?: string;
    onClose?: () => void;
    children?: Snippet;
  }

  let {
    open = false,
    title = '',
    description = null,
    titleIcon = null,
    size = 'md',
    fixedHeight = false,
    bodyClass = '',
    onClose = () => {},
    children,
  }: Props = $props();

  let maxWidthClass = $derived(size === 'lg' ? 'max-w-4xl' : 'max-w-2xl');
  let heightClass = $derived(fixedHeight ? 'h-[85vh]' : 'max-h-[85vh]');
  let resolvedBodyClass = $derived(bodyClass || 'overflow-y-auto');

  function handleWindowKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" role="presentation">
    <button
      type="button"
      class="absolute inset-0 bg-overlay"
      aria-label="Close dialog"
      onclick={onClose}
    ></button>

    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      class={`relative z-10 flex w-full min-h-0 flex-col ${heightClass} ${maxWidthClass} rounded-xl border border-border bg-surface shadow-2xl`}
    >
      <div class="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <div class="flex items-center gap-3">
            {#if titleIcon}
              <Icon name={titleIcon} class="h-6 w-6 shrink-0 text-brand" />
            {/if}
            <h2 id="modal-title" class="text-lg font-semibold text-on-bg">{title}</h2>
            {#if description}
              <p class={`mt-1 text-sm text-on-surface-muted`}>{description}</p>
            {/if}
          </div>
        </div>
        <button
          type="button"
          aria-label="Close dialog"
          title="Close"
          class="rounded-lg p-2 text-on-surface-muted transition-colors hover:bg-surface hover:text-on-surface"
          onclick={onClose}
        >
          <Icon name="close" class="h-5 w-5" />
        </button>
      </div>

      <div class={`min-h-0 flex-1 px-6 py-5 ${resolvedBodyClass}`}>
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}
