<script lang="ts">
  import type { Component } from 'svelte';
  import { cn } from '$lib/utils';

  type Size = 'sm' | 'md' | 'lg';
  type Variant = 'info' | 'success' | 'muted' | 'warning' | 'danger';
  type IconComponent = Component<{ class?: string }>;

  interface Props {
    size?: Size;
    variant?: Variant;
    icon: IconComponent;
    class?: string;
    [key: string]: unknown;
  }

  const boxSizeClasses: Record<Size, string> = {
    sm: 'h-8 w-8 rounded-md',
    md: 'h-10 w-10 rounded-lg',
    lg: 'h-12 w-12 rounded-xl',
  };

  const iconSizeClasses: Record<Size, string> = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const variantClasses: Record<Variant, string> = {
    info: 'bg-info-bg text-info',
    success: 'bg-success-bg text-success',
    muted: 'bg-muted text-muted-foreground',
    warning: 'bg-warning-bg text-warning',
    danger: 'bg-danger-bg text-danger',
  };

  let { size = 'md', variant = 'info', icon: Icon, class: className = '', ...restProps }: Props = $props();
</script>

<div
  {...restProps}
  class={cn(
    'flex shrink-0 items-center justify-center',
    boxSizeClasses[size],
    variantClasses[variant],
    className,
  )}
>
  <Icon class={iconSizeClasses[size]} />
</div>
