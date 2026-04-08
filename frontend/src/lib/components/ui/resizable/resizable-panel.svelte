<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    defaultSize?: string | null;
    minSize?: string | null;
    maxSize?: string | null;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    defaultSize = null,
    minSize = null,
    maxSize = null,
    class: className = '',
    children,
    ...restProps
  }: Props = $props();

  let style = $derived(
    [
      defaultSize ? `flex-basis:${defaultSize}` : '',
      minSize ? `min-width:${minSize}` : '',
      maxSize ? `max-width:${maxSize}` : '',
    ]
      .filter(Boolean)
      .join(';'),
  );
</script>

<div {...restProps} style={style || undefined} class={cn('min-h-0 min-w-0 overflow-hidden', className)}>
  {@render children?.()}
</div>
