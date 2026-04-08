<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { setCollapsibleContext } from './context';

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

  function toggle() {
    setOpen(!isOpen());
  }

  setCollapsibleContext({ isOpen, setOpen, toggle });
</script>

<div {...restProps} data-state={isOpen() ? 'open' : 'closed'} class={cn('w-full', className)}>
  {@render children?.()}
</div>
