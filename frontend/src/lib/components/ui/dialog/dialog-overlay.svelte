<script lang="ts">
  import { cn } from '$lib/utils';
  import { getDialogContext } from './context';

  interface Props {
    class?: string;
    closeOnClick?: boolean;
    ariaLabel?: string;
    [key: string]: unknown;
  }

  let { class: className = '', closeOnClick = true, ariaLabel = 'Close dialog', ...restProps }: Props = $props();
  const dialog = getDialogContext();

  function handleClick() {
    if (closeOnClick) {
      dialog.setOpen(false);
    }
  }
</script>

{#if dialog.isOpen()}
  <button
    {...restProps}
    type="button"
    tabindex="-1"
    aria-label={ariaLabel}
    class={cn('fixed inset-0 z-40 bg-overlay', className)}
    onclick={handleClick}
  ></button>
{/if}
