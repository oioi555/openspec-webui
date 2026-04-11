<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { setContextMenuContext } from './context';

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
  let position = $state({ x: 0, y: 0 });

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

  function getPosition() {
    return position;
  }

  function setPosition(x: number, y: number) {
    position = { x, y };
  }

  setContextMenuContext({ isOpen, setOpen, getPosition, setPosition });

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    setPosition(event.clientX, event.clientY);
    setOpen(true);
  }
</script>

<!--
  Use display:contents so the wrapper doesn't interfere with flex layout.
  The contextmenu listener sits on the wrapper so right-click anywhere on children triggers the menu.
-->
<div {...restProps} class={cn('contents', className)} oncontextmenu={handleContextMenu}>
  {@render children?.()}
</div>
