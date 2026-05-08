<script lang="ts">
  import { AlertTriangle, CheckCircle2, Clipboard, FileText, FlaskConical, LoaderCircle, Search } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { ItemContextMenu } from '$lib/components/shared/item-context-menu';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';
  import { projectStore } from '$lib/state/projects.svelte.ts';
  import { searchStore } from '$lib/state/search.svelte.ts';
  import { validationStore } from '$lib/state/validation.svelte.ts';
  import { uiPreferencesStore } from '$lib/state/uiPreferences.svelte.ts';
  import type { MenuItem } from '$lib/components/shared/item-context-menu';
  import type { ValidationItem } from '$lib/types/api';
  import { copyToClipboard, formatDate, truncateText } from '$lib/utils';

  interface Props {
    onItemSelected?: () => void;
  }

  let { onItemSelected = () => {} }: Props = $props();
  let autoRunStartedForProject: string | null = null;

  $effect(() => {
    const projectId = projectStore.activeProjectId;
    const projectChanged = validationStore.syncProject();

    if (projectChanged) {
      autoRunStartedForProject = null;
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
    return item.type === 'spec' || item.type === 'change';
  }

  function severityVariant(level: ValidationItem['issues'][number]['level']) {
    if (level === 'WARNING') {
      return 'warning';
    }

    if (level === 'INFO') {
      return 'secondary';
    }

    return 'destructive';
  }

  function statusVariant(status: 'passed' | 'failed') {
    return status === 'passed' ? 'success' : 'destructive';
  }

  function statusLabel(status: 'passed' | 'failed') {
    return status === 'passed' ? t(m.validation_passed) : t(m.validation_failed);
  }

  function primaryIssue(item: ValidationItem) {
    return item.issues[0] ?? null;
  }

  function itemTypeLabel(type: ValidationItem['type']) {
    switch (type) {
      case 'spec':
        return t(m.validation_type_spec);
      case 'change':
        return t(m.validation_type_change);
      case 'project':
        return t(m.validation_type_project);
      case 'unknown':
        return t(m.validation_type_unknown);
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
    <div class="mb-3 flex min-w-0 items-center gap-2">
      <FlaskConical class="h-4 w-4 shrink-0 text-muted-foreground" />
      <div class="min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {t(m.validation_panel_title)}
      </div>
      {#if validationStore.result}
        <Badge variant={statusVariant(validationStore.result.status)} class="shrink-0 text-[11px] font-medium">
          {statusLabel(validationStore.result.status)}
        </Badge>
      {/if}
    </div>

    <p class="mb-3 text-xs leading-relaxed text-muted-foreground">{t(m.validation_panel_description)}</p>

    <div class="space-y-2">
      <Button onclick={() => validationStore.refresh()} disabled={validationStore.loading} size="sm">
        {#if validationStore.loading}
          <LoaderCircle class="h-3.5 w-3.5 animate-spin" />
          {t(m.validation_running)}
        {:else}
          {t(m.validation_run)}
        {/if}
      </Button>

      {#if validationStore.latestRunAt}
        <div class="text-xs text-muted-foreground">
          {t(m.validation_last_run)}: {formatDate(validationStore.latestRunAt)}
        </div>
      {/if}
    </div>

    <div class="mt-3 text-xs text-muted-foreground">
      {#if validationStore.loading && !validationStore.result}
        {t(m.validation_loading)}
      {:else if validationStore.error}
        <span class="text-danger">{validationStore.error}</span>
      {:else if !validationStore.result}
        {t(m.validation_start)}
      {/if}
    </div>
  </div>

  <ScrollArea.Root class="min-h-0 flex-1" viewportClass="h-full">
    <div class="space-y-3 p-3">
      {#if validationStore.result}
        <div class="rounded-lg border border-border/70 bg-secondary/30 p-3">
          <div class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span>{t(m.validation_summary)}</span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="success">{t(m.validation_passed_count, { count: validationStore.result.summary.passed })}</Badge>
            <Badge variant={validationStore.result.summary.failed > 0 ? 'destructive' : 'secondary'}>
              {t(m.validation_failed_count, { count: validationStore.result.summary.failed })}
            </Badge>
            <Badge variant="outline">{t(m.validation_total_count, { count: validationStore.result.summary.totalItems })}</Badge>
          </div>
        </div>

        {#if validationStore.result.status === 'passed'}
          <div class="rounded-lg border border-success/20 bg-success-bg/60 p-4 text-sm text-success">
            <div class="flex items-center gap-2 font-medium">
              <CheckCircle2 class="h-4 w-4" />
              {t(m.validation_passed)}
            </div>
            <div class="mt-1 text-xs text-success/90">{t(m.validation_no_failed_items)}</div>
          </div>
        {:else if validationStore.result.failedItems.length > 0}
          <div>
            <div class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <AlertTriangle class="h-3.5 w-3.5" />
              <span>{t(m.validation_failed_items)}</span>
              <Badge variant="destructive" class="min-w-5 justify-center px-2 py-0.5 text-[11px] font-medium">
                {validationStore.result.failedItems.length}
              </Badge>
            </div>

            <div class="overflow-hidden rounded-lg border border-border/70 bg-card">
              {#each validationStore.result.failedItems as item}
                {@const issue = primaryIssue(item)}
                <ItemContextMenu items={contextMenuItems(item)}>
                  <button
                    type="button"
                    class={`flex w-full flex-col gap-2 border-b border-border/50 px-3 py-3 text-left transition-colors last:border-b-0 ${isNavigable(item) ? 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground' : 'cursor-default text-muted-foreground'}`}
                    onclick={(event) => handleSelect(item, event)}
                  >
                    <div class="flex min-w-0 flex-wrap items-center gap-2">
                      <Badge variant="outline" class="shrink-0 text-[11px] font-medium">
                        {itemTypeLabel(item.type)}
                      </Badge>
                      {#if issue}
                        <Badge variant={severityVariant(issue.level)} class="shrink-0 text-[11px] font-medium">
                          {issue.level}
                        </Badge>
                      {/if}
                      <span class="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={item.name}>{item.name}</span>
                      <span class="text-xs text-muted-foreground">{t(m.validation_issue_count, { count: item.issueCount })}</span>
                    </div>

                    {#if issue}
                      <div class="text-xs leading-relaxed text-muted-foreground" title={issue.message}>
                        {truncateText(issue.message, 180)}
                      </div>
                    {/if}

                    {#if !isNavigable(item)}
                      <div class="text-[11px] text-muted-foreground">{t(m.validation_non_navigable)}</div>
                    {/if}
                  </button>
                </ItemContextMenu>
              {/each}
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </ScrollArea.Root>
</div>
