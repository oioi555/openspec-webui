<script lang="ts">
  import { ChevronDown, ChevronRight } from '@lucide/svelte';
  import { InsetPanel, SurfaceCard } from '$lib/components/shared/surface';
  import { SeverityIndicator } from '$lib/components/shared/severity-indicator';
  import { StatusIndicator } from '$lib/components/shared/status-indicator';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import { validationStore } from '$lib/state/validation.svelte.ts';
  import { deriveValidationTargetSummary } from '$lib/state/validationCore';
  import type { ValidationItemType } from '$lib/types/api';
  import { FIXED_LABELS, getValidationItemTypeLabel } from '$lib/uiText';
  import { cn, formatDate } from '$lib/utils';
  import { getValidationStatusVisual } from '$lib/visualSemantics';

  interface Props {
    itemType: Extract<ValidationItemType, 'spec' | 'change'>;
    itemName: string;
    class?: string;
  }

  let { itemType, itemName, class: className = '' }: Props = $props();

  let detailsOpen = $state(false);

  const summary = $derived(
    deriveValidationTargetSummary(
      {
        result: validationStore.result,
        error: validationStore.error,
        latestRunAt: validationStore.latestRunAt,
      },
      {
        type: itemType,
        name: itemName,
      },
    ),
  );

  const itemTypeLabel = $derived(getValidationItemTypeLabel(itemType));
  const hasDetails = $derived(summary.issues.length > 0);
  const statusLabel = $derived(getValidationStatusVisual(summary.state).label);
  const statusAriaLabel = $derived(FIXED_LABELS.validation.viewer.statusAria(itemTypeLabel, itemName, statusLabel));
  const detailsAriaLabel = $derived(
    FIXED_LABELS.validation.viewer.detailsAria(itemTypeLabel, itemName, detailsOpen),
  );

  $effect(() => {
    if (!hasDetails && detailsOpen) {
      detailsOpen = false;
    }
  });

</script>

<SurfaceCard shadow="sm" class={cn('overflow-hidden', className)}>
  <Collapsible.Root open={detailsOpen} onOpenChange={(open) => (detailsOpen = open)}>
    <div role="status" aria-label={statusAriaLabel}>
      <Collapsible.Trigger
        disabled={!hasDetails}
        class={cn(
          'flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left transition-colors',
          hasDetails && 'hover:bg-secondary/50'
        )}
        aria-label={hasDetails ? detailsAriaLabel : statusAriaLabel}
        title={hasDetails ? (detailsOpen ? FIXED_LABELS.validation.viewer.hideDetails : FIXED_LABELS.validation.viewer.details) : undefined}
      >
        <StatusIndicator state={summary.state} format="icon-box" />

        <div class="min-w-0 flex-1">
          <div class="flex min-w-0 flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-foreground">{statusLabel}</span>

            {#if summary.issueCount > 0}
              <span class="text-xs text-muted-foreground">{FIXED_LABELS.validation.issueCount(summary.issueCount)}</span>
            {/if}

            {#if summary.lastRunAt}
              <span class="text-xs text-muted-foreground">
                {FIXED_LABELS.validation.lastRun}: {formatDate(summary.lastRunAt)}
              </span>
            {/if}
          </div>
        </div>

        {#if hasDetails}
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-colors">
            {#if detailsOpen}
              <ChevronDown class="h-3.5 w-3.5" />
            {:else}
              <ChevronRight class="h-3.5 w-3.5" />
            {/if}
          </span>
        {/if}
      </Collapsible.Trigger>
    </div>

    {#if hasDetails}
      <Collapsible.Content>
        <div class="border-t border-border/70 px-4 py-4">
          <ul class="space-y-3">
            {#each summary.issues as issue}
              <li>
                <InsetPanel class="px-3 py-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <SeverityIndicator level={issue.level} format="icon-box" />

                    {#if issue.path}
                      <span class="text-xs text-muted-foreground">{issue.path}</span>
                    {/if}
                  </div>

                  <p class="mt-2 text-sm leading-relaxed text-foreground">{issue.message}</p>
                </InsetPanel>
              </li>
            {/each}
          </ul>
        </div>
      </Collapsible.Content>
    {/if}
  </Collapsible.Root>
</SurfaceCard>
