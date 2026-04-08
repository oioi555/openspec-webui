<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setDialogContext } from './context';

  interface Props {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: Snippet;
  }

  let { open = undefined, defaultOpen: initialOpen = false, onOpenChange = () => {}, children }: Props = $props();

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

  setDialogContext({ isOpen, setOpen });
</script>

{@render children?.()}
