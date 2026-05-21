<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Card } from '$lib/components/ui/card';
  import { cn } from '$lib/utils';

  type Tone = 'card' | 'inset';
  type Radius = 'none' | 'sm' | 'lg' | 'xl';

  interface Props {
    tone?: Tone;
    radius?: Radius;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  const toneClasses: Record<Tone, string> = {
    card: 'border-border bg-card',
    inset: 'border-border/70 bg-background/70',
  };

  const radiusClasses: Record<Radius, string> = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  };

  let {
    tone = 'inset',
    radius = 'lg',
    class: className = '',
    children,
    ...restProps
  }: Props = $props();
</script>

<Card
  {...restProps}
  data-slot="interactive-card"
  class={cn(
    'gap-0 border py-0 shadow-sm transition-all',
    tone === 'card' && 'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
    tone === 'inset' && 'hover:border-primary/40',
    toneClasses[tone],
    radiusClasses[radius],
    tone === 'inset' && 'hover:bg-secondary/40',
    className,
  )}
>
  {@render children?.()}
</Card>
