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
</script>

<button {...restProps} type="button" class={cn('inline-flex items-center gap-2', className)} onclick={() => dialog.setOpen(false)}>
  {@render children?.()}
</button>
