<script lang="ts">
  import { cn } from '$lib/utils';
  import { getDialogContext } from './context';

  interface Props {
    class?: string;
    closeOnClick?: boolean;
    [key: string]: unknown;
  }

  let { class: className = '', closeOnClick = true, ...restProps }: Props = $props();
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
    aria-label="Close dialog"
    class={cn('fixed inset-0 z-40 bg-overlay', className)}
    onclick={handleClick}
  ></button>
{/if}
