<script lang="ts">
  import { cn } from '$lib/utils';

  type Orientation = 'horizontal' | 'vertical';

  interface Props {
    orientation?: Orientation;
    decorative?: boolean;
    class?: string;
    [key: string]: unknown;
  }

  let { orientation = 'horizontal', decorative = true, class: className = '', ...restProps }: Props = $props();
</script>

<div
  {...restProps}
  role={decorative ? 'none' : 'separator'}
  aria-orientation={decorative ? undefined : orientation}
  class={cn(
    'shrink-0 bg-border',
    orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
    className,
  )}
></div>
