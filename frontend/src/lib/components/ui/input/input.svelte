<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    type?: string;
    class?: string;
    [key: string]: unknown;
  }

  let { type = 'text', class: className = '', ...restProps }: Props = $props();
</script>

<input
  {...restProps}
  {type}
  class={cn(
    'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
    className,
  )}
/>
