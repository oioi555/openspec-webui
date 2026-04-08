<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { setDropdownMenuContext } from './context';

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
  let triggerElement = $state<HTMLElement | null>(null);
  let contentElement = $state<HTMLElement | null>(null);

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

  setDropdownMenuContext({
    isOpen,
    setOpen,
    getTriggerElement: () => triggerElement,
    setTriggerElement: (element) => {
      triggerElement = element;
    },
    getContentElement: () => contentElement,
    setContentElement: (element) => {
      contentElement = element;
    },
  });
</script>

<div {...restProps} class={cn('relative inline-flex', className)}>
  {@render children?.()}
</div>
