<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    height?: string;
    class?: string;
    [key: string]: unknown;
  }

  let { height = 'h-64', class: className = '', ...restProps }: Props = $props();
</script>

<div
  {...restProps}
  class={cn('flex items-center justify-center text-sm text-muted-foreground', height, className)}
>
  Loading...
</div>
