<script lang="ts">
  import { Archive } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { ChangeSummary } from '$lib/types/api';
  import { formatChangeName, formatDate } from '$lib/utils';
  import type { ExplorerSortMode } from './sort-utils';
  import { timestampValue } from './sort-utils';
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
    return [...changes].sort((left, right) => {
      // Archive sorting uses the displayed name with the date prefix stripped;
      // compareBySortMode compares raw `.name` values.
      const leftName = formatChangeName(left.name);
      const rightName = formatChangeName(right.name);
      if (sortMode === 'name') {
        return leftName.localeCompare(rightName);
      }

      const timestampDiff = timestampValue(right.lastModified) - timestampValue(left.lastModified);
      if (timestampDiff !== 0) {
        return timestampDiff;
      }

      return leftName.localeCompare(rightName);
    });
  });
</script>

<ExplorerSection
  title={FIXED_LABELS.explorer.archive}
  icon={Archive}
  section="archive"
  count={changes.length}
  {headerRight}
  {headerExtra}
  emptyMessage={m.explorer_no_archived_changes()}
>
  {#each sortedChanges as change, index}
    {@const changePath = `/changes/${encodeURIComponent(change.name)}`}
    <ExplorerSectionItem
      path={changePath}
      section="archive"
      kind="archived-change"
      {onItemSelected}
      class={index === sortedChanges.length - 1 ? 'border-b-0' : ''}
      name={change.name}
      displayName={formatChangeName(change.name)}
      date={change.lastModified ? formatDate(change.lastModified) : null}
      specDeltaCount={change.specDeltaCount}
      taskProgress={change.taskProgress}
    />
  {/each}
</ExplorerSection>
