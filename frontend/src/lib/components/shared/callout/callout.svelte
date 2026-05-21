<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  type Variant = 'info' | 'warning' | 'error' | 'success';

  interface Props {
    variant?: Variant;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  const variantClasses: Record<Variant, string> = {
    info: 'border-info-border bg-info-bg text-info',
    warning: 'border-warning-border bg-warning-bg text-warning',
    error: 'border-danger-border bg-danger-bg text-danger',
    success: 'border-success-border bg-success-bg text-success',
  };

  let { variant = 'info', class: className = '', children, ...restProps }: Props = $props();
</script>

<div
  {...restProps}
  role="note"
  class={cn('rounded-sm border px-4 py-3 text-sm', variantClasses[variant], className)}
>
  {@render children?.()}
</div>
