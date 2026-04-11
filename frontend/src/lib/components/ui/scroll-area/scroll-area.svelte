<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  type Orientation = 'vertical' | 'horizontal' | 'both';

  interface Props {
    orientation?: Orientation;
    viewportClass?: string;
    class?: string;
    children?: Snippet;
    onwheel?: (event: WheelEvent) => void;
    [key: string]: unknown;
  }

  const orientationClasses: Record<Orientation, string> = {
    vertical: 'overflow-y-auto overflow-x-hidden',
    horizontal: 'overflow-x-auto overflow-y-hidden',
    both: 'overflow-auto',
  };

  let {
    orientation = 'vertical',
    viewportClass = '',
    class: className = '',
    children,
    onwheel,
    ...restProps
  }: Props = $props();
</script>

<div {...restProps} class={cn('relative', className)}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class={cn('size-full rounded-[inherit] overscroll-contain', orientationClasses[orientation], viewportClass)} onwheel={onwheel}>
    {@render children?.()}
  </div>
</div>
