<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { IconBox } from '$lib/components/shared/icon-box';
  import { cn } from '$lib/utils';
  import { getValidationSeverityVisual } from '$lib/visualSemantics';

  type Format = 'icon-box' | 'badge' | 'minimal';
  type Size = 'sm' | 'md';

  interface Props {
    level: string;
    format?: Format;
    size?: Size;
    showLabel?: boolean;
    class?: string;
  }

  let { level, format = 'badge', size = 'sm', showLabel = true, class: className = '' }: Props = $props();
  const meta = $derived(getValidationSeverityVisual(level));
</script>

{#if format === 'icon-box'}
  <IconBox
    icon={meta.icon}
    variant={meta.iconBoxVariant}
    size={size}
    aria-label={meta.label}
    title={meta.label}
    class={className}
  />
{:else if format === 'minimal'}
  <span class={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)} title={meta.label}>
    <meta.icon class="h-3.5 w-3.5 shrink-0" />
    <span class={showLabel ? '' : 'sr-only'}>{meta.label}</span>
  </span>
{:else}
  <Badge variant={meta.badgeVariant} class={cn('gap-1.5 text-[11px] font-medium', className)} title={meta.label}>
    <meta.icon class="h-3 w-3" />
    <span class={showLabel ? '' : 'sr-only'}>{meta.label}</span>
  </Badge>
{/if}
