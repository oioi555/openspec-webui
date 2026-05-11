<script lang="ts">
  import { FileText } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { SpecSummary } from '$lib/types/api';
  import { validationStore } from '$lib/state/validation.svelte.ts';
  import { deriveValidationListIconState, deriveValidationTargetSummary } from '$lib/state/validationCore';
  import { formatDate } from '$lib/utils';
  import type { ExplorerSortMode } from './sort-utils';
  import { timestampValue } from './sort-utils';
  import ExplorerSection from './explorer-section.svelte';
  import ExplorerSectionItem from './explorer-section-item.svelte';
  import * as m from '$lib/paraglide/messages.js';
  import { FIXED_LABELS } from '$lib/uiText';

  interface Props {
    specs: SpecSummary[];
    onItemSelected?: () => void;
    headerRight?: Snippet;
    headerExtra?: Snippet;
    sortMode?: ExplorerSortMode;
  }

  let {
    specs,
    onItemSelected = () => {},
    headerRight,
    headerExtra,
    sortMode = 'name',
  }: Props = $props();

  let sortedSpecs = $derived.by(() => {
    return [...specs].sort((left, right) => {
      // Specs default to name ordering and only apply date ordering in date mode;
      // compareBySortMode's name/date branching would obscure that behavior.
      if (sortMode === 'date') {
        const timestampDiff = timestampValue(right.lastModified) - timestampValue(left.lastModified);
        if (timestampDiff !== 0) {
          return timestampDiff;
        }
      }

      return left.name.localeCompare(right.name);
    });
  });

  function validationStatusForSpec(name: string) {
    return deriveValidationListIconState(
      'spec',
      deriveValidationTargetSummary(validationStore, { type: 'spec', name }).state,
    );
  }
</script>

<ExplorerSection
  title={FIXED_LABELS.explorer.specs}
  icon={FileText}
  section="specs"
  count={specs.length}
  {headerRight}
  {headerExtra}
  emptyMessage={m.explorer_no_specs_found()}
>
  {#each sortedSpecs as spec}
    {@const specPath = `/specs/${encodeURIComponent(spec.name)}`}
    <ExplorerSectionItem
      path={specPath}
      section="specs"
      kind="spec"
      {onItemSelected}
      name={spec.name}
      date={spec.lastModified ? formatDate(spec.lastModified) : null}
      validationStatus={validationStatusForSpec(spec.name)}
    />
  {/each}
</ExplorerSection>
