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
  const minimalIconClass = $derived.by(() => {
    switch (meta.iconBoxVariant) {
      case 'success':
        return 'text-success';
      case 'info':
        return 'text-info';
      case 'warning':
        return 'text-warning';
      case 'danger':
        return 'text-danger';
      default:
        return 'text-muted-foreground';
    }
  });
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
  <span
    class={cn('inline-flex shrink-0 items-center', className)}
    title={displayLabel}
    aria-label={displayLabel}
  >
    <meta.icon class={cn(size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5', 'shrink-0', minimalIconClass)} />
    <span class="sr-only">{displayLabel}</span>
  </span>
{:else}
  <Badge variant={meta.badgeVariant} class={cn('gap-1.5 text-[11px] font-medium', className)} title={displayLabel}>
    <meta.icon class="h-3 w-3" />
    <span class={showLabel ? '' : 'sr-only'}>{displayLabel}</span>
  </Badge>
{/if}
