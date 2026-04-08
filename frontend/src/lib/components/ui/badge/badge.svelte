<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  type Variant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';

  interface Props {
    variant?: Variant;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  const variantClasses: Record<Variant, string> = {
    default: 'border-transparent bg-primary/10 text-primary',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    outline: 'border-border bg-transparent text-foreground',
    success: 'border-transparent bg-success-bg text-success',
    warning: 'border-transparent bg-warning-bg text-warning',
    destructive: 'border-transparent bg-danger-bg text-danger',
  };

  let { variant = 'default', class: className = '', children, ...restProps }: Props = $props();
</script>

<span
  {...restProps}
  class={cn(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
    variantClasses[variant],
    className,
  )}
>
  {@render children?.()}
</span>
