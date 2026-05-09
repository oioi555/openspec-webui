<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { IconBox } from '$lib/components/shared/icon-box';
  import { cn } from '$lib/utils';
  import { getValidationStatusVisual, type ValidationStatusKind } from '$lib/visualSemantics';

  type Format = 'icon-box' | 'badge' | 'minimal';
  type Size = 'sm' | 'md';

  interface Props {
    state: ValidationStatusKind;
    format?: Format;
    size?: Size;
    showLabel?: boolean;
    label?: string;
    class?: string;
  }

  let { state, format = 'badge', size = 'sm', showLabel = true, label, class: className = '' }: Props = $props();
  const meta = $derived(getValidationStatusVisual(state));
  const displayLabel = $derived(label ?? meta.label);
</script>

{#if format === 'icon-box'}
  <IconBox
    icon={meta.icon}
    variant={meta.iconBoxVariant}
    size={size}
    aria-label={displayLabel}
    title={displayLabel}
    class={className}
  />
{:else if format === 'minimal'}
  <span class={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)} title={displayLabel}>
    <meta.icon class="h-3.5 w-3.5 shrink-0" />
    <span class={showLabel ? '' : 'sr-only'}>{displayLabel}</span>
  </span>
{:else}
  <Badge variant={meta.badgeVariant} class={cn('gap-1.5 text-[11px] font-medium', className)} title={displayLabel}>
    <meta.icon class="h-3 w-3" />
    <span class={showLabel ? '' : 'sr-only'}>{displayLabel}</span>
  </Badge>
{/if}
