<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  type Size = 'default' | 'sm' | 'lg' | 'icon';

  interface Props {
    variant?: Variant;
    size?: Size;
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  const variantClasses: Record<Variant, string> = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
    ghost: 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    link: 'bg-transparent text-primary underline-offset-4 hover:underline',
  };

  const sizeClasses: Record<Size, string> = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-6',
    icon: 'size-10',
  };

  let {
    variant = 'default',
    size = 'default',
    type = 'button',
    class: className = '',
    children,
    ...restProps
  }: Props = $props();
</script>

<button
  {...restProps}
  {type}
  class={cn(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className,
  )}
>
  {@render children?.()}
</button>
