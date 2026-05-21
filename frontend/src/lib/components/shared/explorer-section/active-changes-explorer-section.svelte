<script lang="ts">
  import { SquarePen } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { ChangeSummary } from '$lib/types/api';
  import { validationStore } from '$lib/state/validation.svelte.ts';
  import { deriveValidationListIconState, deriveValidationTargetSummary } from '$lib/state/validationCore';
  import { formatDate } from '$lib/utils';
  import type { ExplorerSortMode } from './sort-utils';
  import { compareBySortMode } from './sort-utils';
  import ExplorerSection from './explorer-section.svelte';
  import ExplorerSectionItem from './explorer-section-item.svelte';
  import * as m from '$lib/paraglide/messages.js';
  import { FIXED_LABELS } from '$lib/uiText';

  interface Props {
    changes: ChangeSummary[];
    onItemSelected?: () => void;
    headerRight?: Snippet;
    headerExtra?: Snippet;
    sortMode?: ExplorerSortMode;
  }

  let {
    changes,
    onItemSelected = () => {},
    headerRight,
    headerExtra,
    sortMode = 'date',
  }: Props = $props();

  let sortedChanges = $derived.by(() => {
    return [...changes].sort(compareBySortMode<ChangeSummary>(sortMode));
  });

  function validationStatusForChange(name: string) {
    return deriveValidationListIconState(
      'active-change',
      deriveValidationTargetSummary(validationStore, { type: 'change', name }).state,
    );
  }
</script>

<ExplorerSection
  title={FIXED_LABELS.explorer.activeChanges}
  icon={SquarePen}
  section="active-changes"
  count={changes.length}
  {headerRight}
  {headerExtra}
  emptyMessage={m.explorer_no_active_changes()}
>
  {#each sortedChanges as change, index}
    {@const changePath = `/changes/${encodeURIComponent(change.name)}`}
    <ExplorerSectionItem
      path={changePath}
      section="active-changes"
      kind="active-change"
      {onItemSelected}
      class={index === sortedChanges.length - 1 ? 'border-b-0' : ''}
      name={change.name}
      date={change.lastModified ? formatDate(change.lastModified) : null}
      specDeltaCount={change.specDeltaCount}
      taskProgress={change.taskProgress}
      validationStatus={validationStatusForChange(change.name)}
      showProgress
    />
  {/each}
</ExplorerSection>
