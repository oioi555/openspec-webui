<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getDialogContext } from './context';

  interface Props {
    disabled?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { disabled = false, class: className = '', children, ...restProps }: Props = $props();
  const dialog = getDialogContext();

  function handleClick() {
    if (!disabled) {
      dialog.setOpen(true);
    }
  }
</script>

<button
  {...restProps}
  type="button"
  aria-haspopup="dialog"
  aria-expanded={dialog.isOpen()}
  disabled={disabled}
  class={cn('inline-flex items-center gap-2', className)}
  onclick={handleClick}
>
  {@render children?.()}
</button>
