<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  type Direction = 'horizontal' | 'vertical';

  interface DragEventDetail {
    deltaX: number;
    deltaY: number;
    originalEvent: PointerEvent;
  }

  interface Props {
    direction?: Direction;
    withHandle?: boolean;
    onDragStart?: (event: PointerEvent) => void;
    onDrag?: (detail: DragEventDetail) => void;
    onDragEnd?: (event: PointerEvent) => void;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    direction = 'horizontal',
    withHandle = true,
    onDragStart = () => {},
    onDrag = () => {},
    onDragEnd = () => {},
    class: className = '',
    children,
    ...restProps
  }: Props = $props();

  let startX = 0;
  let startY = 0;

  function handlePointerDown(event: PointerEvent) {
    const target = event.currentTarget;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    startX = event.clientX;
    startY = event.clientY;
    target.setPointerCapture(event.pointerId);
    onDragStart(event);
  }

  function handlePointerMove(event: PointerEvent) {
    const target = event.currentTarget;

    if (!(target instanceof HTMLElement) || !target.hasPointerCapture(event.pointerId)) {
      return;
    }

    onDrag({
      deltaX: event.clientX - startX,
      deltaY: event.clientY - startY,
      originalEvent: event,
    });
  }

  function handlePointerUp(event: PointerEvent) {
    const target = event.currentTarget;

    if (target instanceof HTMLElement && target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    onDragEnd(event);
  }
</script>

<div
  {...restProps}
  role="separator"
  aria-orientation={direction}
  class={cn(
    'relative shrink-0 touch-none select-none bg-border/70 transition-colors hover:bg-primary/30',
    direction === 'horizontal' ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize',
    className,
  )}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
>
  {#if withHandle}
    <div
      class={cn(
        'absolute rounded-full border border-border bg-card shadow-sm',
        direction === 'horizontal'
          ? 'left-1/2 top-1/2 h-10 w-2 -translate-x-1/2 -translate-y-1/2'
          : 'left-1/2 top-1/2 h-2 w-10 -translate-x-1/2 -translate-y-1/2',
      )}
    ></div>
  {/if}

  {@render children?.()}
</div>
