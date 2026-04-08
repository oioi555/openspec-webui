<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { getSheetContext } from './context';

  interface Props {
    disabled?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { disabled = false, class: className = '', children, ...restProps }: Props = $props();
  const sheet = getSheetContext();
</script>

<button
  {...restProps}
  type="button"
  aria-haspopup="dialog"
  aria-expanded={sheet.isOpen()}
  disabled={disabled}
  class={cn('inline-flex items-center gap-2', className)}
  onclick={() => !disabled && sheet.setOpen(true)}
>
  {@render children?.()}
</button>
