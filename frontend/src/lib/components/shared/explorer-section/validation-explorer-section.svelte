<script lang="ts">
  import { RotateCcw, CircleCheckBig, Clipboard, FileText, FlaskConical, LoaderCircle, Search, Settings } from '@lucide/svelte';
  import { Callout } from '$lib/components/shared/callout';
  import { StatusIndicator } from '$lib/components/shared/status-indicator';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';
  import { projectStore } from '$lib/state/projects.svelte.ts';
  import { searchStore } from '$lib/state/search.svelte.ts';
  import { tabStore } from '$lib/state/tabs.svelte.ts';
  import { getValidationItemPath, validationStore } from '$lib/state/validation.svelte.ts';
  import { uiPreferencesStore } from '$lib/state/uiPreferences.svelte.ts';
  import { FIXED_LABELS } from '$lib/uiText';
  import type { MenuItem } from '$lib/components/shared/item-context-menu';
  import type { ValidationItem, ValidationItemStatus } from '$lib/types/api';
  import { copyToClipboard, formatDate, truncateText } from '$lib/utils';
  import type { EntityKind } from '$lib/visualSemantics';
  import { getValidationStatusVisual } from '$lib/visualSemantics';
  import ExplorerListItemButton from './explorer-list-item-button.svelte';

  interface Props {
    onItemSelected?: () => void;
  }

  let { onItemSelected = () => {} }: Props = $props();
  let autoRunStartedForProject: string | null = null;
  type AttentionStatus = Exclude<ValidationItemStatus, 'passed'>;
  const FILTER_STATUSES: AttentionStatus[] = ['failed', 'warning', 'info'];
  let excludedStatuses = $state<Set<AttentionStatus>>(new Set());

  $effect(() => {
    const projectId = projectStore.activeProjectId;
    const projectChanged = validationStore.syncProject();

    if (projectChanged) {
      autoRunStartedForProject = null;
      excludedStatuses = new Set();
    }

    if (!projectId || !validationStore.autoRun || validationStore.loading || validationStore.result || validationStore.error) {
      return;
    }

    if (autoRunStartedForProject === projectId) {
      return;
    }

    autoRunStartedForProject = projectId;
    void validationStore.refresh();
  });

  function isNavigable(item: ValidationItem) {
    return getValidationItemPath(item) !== null;
  }

  function primaryIssue(item: ValidationItem) {
    return item.issues[0] ?? null;
  }

  function attentionItems() {
    return validationStore.result?.items.filter((item) => item.status !== 'passed') ?? [];
  }

  function filteredAttentionItems() {
    const items = attentionItems();
    return items.filter((item) => !excludedStatuses.has(item.status as AttentionStatus));
  }

  function statusCount(status: AttentionStatus) {
    return validationStore.result?.summary.statusCounts[status] ?? attentionItems().filter((item) => item.status === status).length;
  }

  function isStatusExcluded(status: AttentionStatus) {
    return excludedStatuses.has(status);
  }

  function toggleStatus(status: AttentionStatus) {
    if (!validationStore.result) {
      return;
    }

    const next = new Set(excludedStatuses);
    if (next.has(status)) {
      next.delete(status);
    } else {
      next.add(status);
    }
    excludedStatuses = next;
  }

  function statusFilterClass(status: AttentionStatus, count: number) {
    const excluded = isStatusExcluded(status);
    const disabled = !validationStore.result;

    if (disabled || excluded) {
      return 'border-border/70 bg-secondary/40 text-muted-foreground opacity-60';
    }

    switch (status) {
      case 'failed':
        return 'border-danger/30 bg-danger/10 text-danger hover:bg-danger/15';
      case 'warning':
        return 'border-warning/30 bg-warning/10 text-warning hover:bg-warning/15';
      case 'info':
        return 'border-info/30 bg-info/10 text-info hover:bg-info/15';
    }
  }

  function filterTitle(status: AttentionStatus, count: number) {
    const visual = getValidationStatusVisual(status);
    return `${visual.label}: ${count}`;
  }

  function statusFilterTitle(status: AttentionStatus, count: number) {
    const label = filterTitle(status, count);
    if (!validationStore.result) {
      return `${label} — ${t(m.validation_start)}`;
    }
    return isStatusExcluded(status) ? `${label} — show` : `${label} — hide`;
  }

  function openValidationSettings() {
    tabStore.openSettings({ initialSection: 'validation' });
  }

  function entityKindForItem(type: ValidationItem['type']): EntityKind {
    switch (type) {
      case 'spec':
        return 'spec';
      case 'change':
        return 'active-change';
      case 'project':
        return 'project';
      case 'unknown':
        return 'unknown';
    }
  }

  function handleSelect(item: ValidationItem, event: MouseEvent) {
    const opened = validationStore.openItem(item, {
      confirmed: !uiPreferencesStore.previewTabsEnabled || event.ctrlKey,
    });

    if (opened) {
      onItemSelected();
    }
  }

  function contextMenuItems(item: ValidationItem): MenuItem[] {
    const items: MenuItem[] = [];

    if (isNavigable(item)) {
      items.push({
        label: t(m.context_menu_open_in_new_tab),
        icon: FileText,
        onSelect: () => {
          validationStore.openItem(item, { confirmed: true });
          onItemSelected();
        },
      });
    }

    if (item.name) {
      items.push({
        label: t(m.context_menu_copy_name),
        icon: Clipboard,
        onSelect: () => copyToClipboard(item.name, t(m.copy_label_validation_item_name)),
      });
    }

    if (item.type === 'spec' && item.name) {
      items.push({
        label: t(m.context_menu_search_related_changes),
        icon: Search,
        onSelect: () => {
          searchStore.open(item.name);
          onItemSelected();
        },
      });
    }

    return items;
  }
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <div class="shrink-0 border-b border-border bg-card px-3 py-3">
    <div class={`flex min-w-0 items-center gap-2 ${validationStore.result ? 'mb-3' : ''}`}>
      <FlaskConical class="h-4 w-4 shrink-0 text-muted-foreground" />
      <div class="min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {t(m.validation_panel_title)}
      </div>
      {#if validationStore.result}
        <button
          type="button"
          class="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          disabled={validationStore.loading}
          aria-label={t(m.validation_run)}
          title={t(m.validation_panel_description)}
          onclick={() => validationStore.refresh()}
        >
          {#if validationStore.loading}
            <LoaderCircle class="h-3.5 w-3.5 animate-spin" />
          {:else}
            <RotateCcw class="h-3.5 w-3.5" />
          {/if}
        </button>
      {/if}
      <button
        type="button"
        class="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`${FIXED_LABELS.common.settings}: ${t(m.validation_panel_title)}`}
        title={t(m.settings_validation_description)}
        onclick={openValidationSettings}
      >
        <Settings class="h-3.5 w-3.5" />
      </button>
    </div>

    {#if validationStore.result}
    <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
      <div class="flex flex-wrap items-center gap-1.5" aria-label={t(m.validation_summary)}>
          {#each FILTER_STATUSES as status}
            {@const visual = getValidationStatusVisual(status)}
            {@const count = statusCount(status)}
            <button
              type="button"
              role="checkbox"
              class={`inline-flex h-6 min-w-0 items-center gap-1 rounded-md border px-1.5 text-[11px] font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed ${statusFilterClass(status, count)}`}
              aria-label={filterTitle(status, count)}
              aria-checked={!isStatusExcluded(status)}
              disabled={!validationStore.result}
              title={statusFilterTitle(status, count)}
              onclick={() => toggleStatus(status)}
            >
              <visual.icon class="h-3 w-3 shrink-0" />
              <span>{count}</span>
            </button>
          {/each}
        </div>

        {#if validationStore.latestRunAt}
          <div class="min-h-6 content-center text-right text-[11px] leading-5 text-muted-foreground">
            {t(m.validation_last_run)}: {formatDate(validationStore.latestRunAt)}
          </div>
        {/if}
    </div>
    {/if}

    {#if validationStore.error}
      <div class="mt-3 text-xs text-muted-foreground">
        <span class="text-danger">{validationStore.error}</span>
      </div>
    {/if}
  </div>

  <ScrollArea.Root class="min-h-0 flex-1" viewportClass="h-full">
    {#if !validationStore.result}
      <div class="p-3">
        <div class="rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-center">
          <div class="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {#if validationStore.loading}
              <LoaderCircle class="h-5 w-5 animate-spin" />
            {:else}
              <FlaskConical class="h-5 w-5" />
            {/if}
          </div>
          <div class="text-sm font-medium text-foreground">{t(m.validation_start)}</div>
          <div class="mt-2 text-xs leading-relaxed text-muted-foreground">{t(m.validation_panel_description)}</div>
          <button
            type="button"
            class="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            disabled={validationStore.loading}
            aria-label={t(m.validation_run)}
            title={t(m.validation_panel_description)}
            onclick={() => validationStore.refresh()}
          >
            {#if validationStore.loading}
              <LoaderCircle class="h-3.5 w-3.5 animate-spin" />
              {t(m.validation_running)}
            {:else}
              <FlaskConical class="h-3.5 w-3.5" />
              {t(m.validation_run)}
            {/if}
          </button>
        </div>
      </div>
    {:else}
      {#if attentionItems().length === 0}
        <div class="p-3">
          <Callout variant="success">
            <div class="flex items-center gap-2 font-medium">
              <CircleCheckBig class="h-4 w-4" />
              {t(m.validation_passed)}
            </div>
            <div class="mt-1 text-xs text-success/90">{t(m.validation_no_failed_items)}</div>
          </Callout>
        </div>
      {:else if filteredAttentionItems().length === 0}
        <div class="p-3 text-xs text-muted-foreground">
          {t(m.validation_no_matching_filters)}
        </div>
      {:else}
        <div>
          {#each filteredAttentionItems() as item}
            {@const issue = primaryIssue(item)}
            {@const itemPath = getValidationItemPath(item)}
            <ExplorerListItemButton
              items={contextMenuItems(item)}
              kind={entityKindForItem(item.type)}
              name={item.name}
              active={itemPath !== null && tabStore.activeTab?.path === itemPath}
              interactive={isNavigable(item)}
              onclick={(event) => handleSelect(item, event)}
            >
              <div class="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                <StatusIndicator state={item.status} format="badge" class="shrink-0" />
                <span class="shrink-0">{t(m.validation_issue_count, { count: item.issueCount })}</span>
              </div>

              {#if issue}
                <div class="text-xs leading-relaxed text-muted-foreground" title={issue.message}>
                  {truncateText(issue.message, 180)}
                </div>
              {/if}

              {#if !isNavigable(item)}
                <div class="text-[11px] text-muted-foreground">{t(m.validation_non_navigable)}</div>
              {/if}
            </ExplorerListItemButton>
          {/each}
        </div>
      {/if}
    {/if}
  </ScrollArea.Root>
</div>
