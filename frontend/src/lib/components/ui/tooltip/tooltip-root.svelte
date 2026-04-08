<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { setTooltipContext } from './context';

  interface Props {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    open = undefined,
    defaultOpen: initialOpen = false,
    onOpenChange = () => {},
    class: className = '',
    children,
    ...restProps
  }: Props = $props();

  let internalOpen = $state(false);

  $effect(() => {
    if (open === undefined) {
      internalOpen = initialOpen;
    }
  });

  function isOpen() {
    return open ?? internalOpen;
  }

  function setOpen(nextOpen: boolean) {
    if (open === undefined) {
      internalOpen = nextOpen;
    }

    onOpenChange(nextOpen);
  }

  setTooltipContext({ isOpen, setOpen });
</script>

<div {...restProps} class={cn('relative inline-flex', className)}>
  {@render children?.()}
</div>
