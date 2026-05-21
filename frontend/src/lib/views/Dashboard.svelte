<script lang="ts">
  import { tick } from 'svelte';
  import { Bookmark, ChevronDown, ChevronRight, LayoutDashboard, Calendar, CircleCheckBig, FileText, FolderPen, History, SquarePen, FlaskConical } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Callout } from '$lib/components/shared/callout';
  import { InteractiveCard, InsetPanel, SectionHeader, SurfaceCard } from '$lib/components/shared/surface';
  import { ExplorerSortControl, type ExplorerSortMode, compareBySortMode, timestampValue } from '$lib/components/shared/explorer-section';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import { EmptyState } from '$lib/components/shared/empty-state';
  import { IconBox } from '$lib/components/shared/icon-box';
  import { ItemContextMenu } from '$lib/components/shared/item-context-menu';
  import { TypeIndicator } from '$lib/components/shared/type-indicator';
  import { createItemContextMenuItems, type ItemContextMenuKind } from '$lib/itemContextMenu';
  import { activeChanges, archivedChanges, project, specs, stats } from '$lib/state/appData.svelte.ts';
  import { commandPreferencesStore } from '$lib/state/commandPreferences.svelte.ts';
  import { getChangeCommands, getWorkspaceCommands } from '$lib/commandShortcuts';
  import { getPlanningContextNotice, isInvalidPlanningContext, isParsedPlanningContext } from '$lib/projectPlanningContext';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';
  import { localeStore } from '$lib/state/locale.svelte.ts';
  import { layoutStore } from '$lib/state/layout.svelte.ts';
  import { searchStore } from '$lib/state/search.svelte.ts';
  import { tabStore } from '$lib/state/tabs.svelte.ts';
  import { validationStore } from '$lib/state/validation.svelte.ts';
  import { StatusIndicator } from '$lib/components/shared/status-indicator';
  import MarkdownRenderer from '$lib/components/shared/MarkdownRenderer.svelte';
  import VersionBadge from '$lib/components/shared/VersionBadge.svelte';
  import { Progress } from '$lib/components/ui/progress';
  import CommandShortcutBar from '$lib/components/shared/CommandShortcutBar.svelte';
  import { formatChangeName, formatDate } from '$lib/utils';
  import { FIXED_LABELS, getChangeTaskCountLabel, getOtherFileCountLabel, getSpecDeltaCountLabel, getWorkflowSchemaFallbackLabel } from '$lib/uiText';
  import { getTaskProgressIconVariant } from '$lib/visualSemantics';
  import { deriveValidationListIconState, deriveValidationTargetSummary } from '$lib/state/validationCore';

  type TimestampedChange = {
    name: string;
    isArchived?: boolean;
    lastModified?: string | null;
    specDeltaCount: number;
    otherFileCount: number;
    hasProposal?: boolean;
    hasDesign?: boolean;
    taskProgress: {
      done: number;
      total: number;
      percentage: number;
    };
  };

  type TimestampedSpec = {
    name: string;
    lastModified?: string | null;
  };

  type RecentActivityItem = {
    id: string;
    kind: ItemContextMenuKind;
    name: string;
    title: string;
    date: string | null;
    timestamp: number;
    specDeltaCount?: number;
    taskProgress?: { done: number; total: number };
    open: () => void;
  };

  const formatDashboardDate = formatDate;
  let legacyProjectDocOpen = $state(false);
  let activeChangesSortMode = $state<ExplorerSortMode>('date');
  let recentActivitySortMode = $state<ExplorerSortMode>('date');

  function commandPreferencesSnapshot() {
    return {
      format: commandPreferencesStore.format,
      commandVisibility: commandPreferencesStore.commandVisibility,
      availability: commandPreferencesStore.availability,
    };
  }

  let workspaceCommands = $derived(getWorkspaceCommands(activeChanges.value, commandPreferencesSnapshot()));

  function changeUpdatedAt(change: TimestampedChange) {
    return change.lastModified ?? null;
  }

  function changeArchivedOrUpdatedAt(change: TimestampedChange) {
    return change.lastModified ?? null;
  }

  function specUpdatedAt(spec: TimestampedSpec) {
    return spec.lastModified ?? null;
  }

  let overallTaskProgress = $derived.by(() => {
    if (stats.value?.overallTaskProgress) {
      return stats.value.overallTaskProgress;
    }

    const allChanges = [...activeChanges.value, ...archivedChanges.value];
    const done = allChanges.reduce((sum, change) => sum + change.taskProgress.done, 0);
    const total = allChanges.reduce((sum, change) => sum + change.taskProgress.total, 0);
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

    return { done, total, percentage };
  });

  let recentActivity = $derived.by((): RecentActivityItem[] => {
    const activeItems = activeChanges.value
      .filter((change) => timestampValue(changeUpdatedAt(change)) > 0)
      .map((change) => ({
        id: `active:${change.name}`,
        kind: 'active-change' as const,
        name: change.name,
        title: change.name,
        date: changeUpdatedAt(change),
        timestamp: timestampValue(changeUpdatedAt(change)),
        specDeltaCount: change.specDeltaCount,
        taskProgress: { done: change.taskProgress.done, total: change.taskProgress.total },
        open: () => openActiveChange(change.name),
      }));

    const archivedItems = archivedChanges.value
      .filter((change) => timestampValue(changeArchivedOrUpdatedAt(change)) > 0)
      .map((change) => ({
        id: `archived:${change.name}`,
        kind: 'archived-change' as const,
        name: change.name,
        title: formatChangeName(change.name),
        date: changeArchivedOrUpdatedAt(change),
        timestamp: timestampValue(changeArchivedOrUpdatedAt(change)),
        specDeltaCount: change.specDeltaCount,
        taskProgress: { done: change.taskProgress.done, total: change.taskProgress.total },
        open: () => openArchivedChange(change.name),
      }));

    const specItems = specs.value
      .filter((spec) => timestampValue(specUpdatedAt(spec)) > 0)
      .map((spec) => ({
        id: `spec:${spec.name}`,
        kind: 'spec' as const,
        name: spec.name,
        title: spec.name,
        date: specUpdatedAt(spec),
        timestamp: timestampValue(specUpdatedAt(spec)),
        open: () => openSpec(spec.name),
      }));

    return [...activeItems, ...archivedItems, ...specItems]
      .sort((left, right) => right.timestamp - left.timestamp)
      .slice(0, 12);
  });

  let sortedActiveChanges = $derived.by(() => {
    return [...activeChanges.value].sort(compareBySortMode<TimestampedChange>(activeChangesSortMode));
  });

  let sortedRecentActivity = $derived.by(() => {
    if (recentActivitySortMode === 'name') {
      return [...recentActivity].sort((left, right) => {
        const nameDiff = left.title.localeCompare(right.title);
        return nameDiff !== 0 ? nameDiff : right.timestamp - left.timestamp;
      });
    }
    return recentActivity;
  });

  function openActiveChange(name: string) {
    layoutStore.focusSection('active-changes');
    tabStore.open(`/changes/${encodeURIComponent(name)}`);
  }

  function openArchivedChange(name: string) {
    layoutStore.focusSection('archive');
    tabStore.open(`/changes/${encodeURIComponent(name)}`);
  }

  function openSpec(name: string) {
    layoutStore.focusSection('specs');
    tabStore.open(`/specs/${encodeURIComponent(name)}`);
  }

  function searchForSpec(specName: string) {
    searchStore.open(specName);
  }

  function openHomeSurface() {
    layoutStore.setActivityPreset('home');
  }

  function openValidationPanel() {
    layoutStore.setActivityPreset('validate');
  }

  function focusSpecsSection() {
    layoutStore.setActivityPreset('specs');
  }

  function focusArchiveSection() {
    layoutStore.setActivityPreset('archive');
  }

  async function openDocumentation() {
    await tick();
    document.getElementById('project-documentation')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function changeCommandsFor(change: TimestampedChange) {
    const changeContext = {
      isArchived: change.isArchived ?? false,
      taskProgress: change.taskProgress,
    } as Parameters<typeof getChangeCommands>[0];

    return getChangeCommands(changeContext, commandPreferencesSnapshot());
  }

  function validationStatusForActiveChange(name: string) {
    return deriveValidationListIconState(
      'active-change',
      deriveValidationTargetSummary(validationStore, { type: 'change', name }).state,
    );
  }

  function validationStatusForRecentActivity(item: RecentActivityItem) {
    if (item.kind === 'active-change') {
      return deriveValidationListIconState(
        'active-change',
        deriveValidationTargetSummary(validationStore, { type: 'change', name: item.name }).state,
      );
    }

    if (item.kind === 'spec') {
      return deriveValidationListIconState(
        'spec',
        deriveValidationTargetSummary(validationStore, { type: 'spec', name: item.name }).state,
      );
    }

    return null;
  }

  let planningContext = $derived(project.value?.planningContext ?? null);
  let parsedPlanningContext = $derived.by(() =>
    isParsedPlanningContext(planningContext) ? planningContext : null
  );
  let invalidPlanningContext = $derived.by(() =>
    isInvalidPlanningContext(planningContext) ? planningContext : null
  );
  let legacyProjectDoc = $derived(project.value?.legacyProjectDoc ?? null);
  let migrationState = $derived(project.value?.migrationState ?? 'config-only');
  let hasArtifactRules = $derived((parsedPlanningContext?.artifactRules.length ?? 0) > 0);
  let planningContextNotice = $derived(
    project.value
      ? getPlanningContextNotice(
          { migrationState, planningContext: project.value.planningContext },
          localeStore.version,
        )
      : { variant: null, title: '' }
  );

  function getProjectSelectorAriaLabel() {
    return FIXED_LABELS.dashboard.openProjectSelector;
  }

</script>

<svelte:head>
  <title>{project.value?.name ?? FIXED_LABELS.appName} • {FIXED_LABELS.appName}</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <div class="flex items-start justify-between gap-4">
      <h1 class="flex items-center gap-2 text-2xl font-bold text-foreground">
        <IconBox icon={LayoutDashboard} variant="info" size="lg"/>
        {project.value?.name ?? FIXED_LABELS.appName}
        <Button
          variant="ghost"
          size="icon"
          class="ml-auto size-7 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={getProjectSelectorAriaLabel()}
          title={getProjectSelectorAriaLabel()}
          onclick={() => layoutStore.openOverlay('project-selector')}
        >
          <FolderPen class="h-4 w-4" />
        </Button>
      </h1>
      <VersionBadge />
    </div>

    <div>
      {#if project.value?.description}
        <p class="mt-1 text-muted-foreground">{project.value.description}</p>
      {/if}
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
    <InteractiveCard tone="card" class="overflow-hidden p-0">
      <button type="button" class="w-full p-4 text-left" onclick={openHomeSurface}>
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-sm font-medium text-muted-foreground">{FIXED_LABELS.dashboard.activeChanges}</div>
            <div class="mt-2 text-3xl font-semibold text-foreground">{stats.value?.activeChanges ?? activeChanges.value.length}</div>
            <div class="mt-1 text-sm text-muted-foreground">{t(m.dashboard_active_changes_summary)}</div>
          </div>
          <TypeIndicator kind="active-change" format="icon-box" size="lg"/>
        </div>
      </button>
    </InteractiveCard>

    <InteractiveCard tone="card" class="overflow-hidden p-0">
      <button type="button" class="w-full p-4 text-left" onclick={focusArchiveSection}>
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-sm font-medium text-muted-foreground">{FIXED_LABELS.common.archive}</div>
            <div class="mt-2 text-3xl font-semibold text-foreground">{stats.value?.archivedChanges ?? archivedChanges.value.length}</div>
            <div class="mt-1 text-sm text-muted-foreground">{t(m.dashboard_archive_summary)}</div>
          </div>
          <TypeIndicator kind="archived-change" format="icon-box" size="lg" />
        </div>
      </button>
    </InteractiveCard>

    <InteractiveCard tone="card" class="overflow-hidden p-0">
      <button type="button" class="w-full p-4 text-left" onclick={focusSpecsSection}>
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-sm font-medium text-muted-foreground">{FIXED_LABELS.common.specs}</div>
            <div class="mt-2 text-3xl font-semibold text-foreground">{stats.value?.totalSpecs ?? specs.value.length}</div>
            <div class="mt-1 text-sm text-muted-foreground">{t(m.dashboard_specs_summary)}</div>
          </div>
          <TypeIndicator kind="spec" format="icon-box" size="lg" />
        </div>
      </button>
    </InteractiveCard>

    <InteractiveCard tone="card" class="overflow-hidden p-0">
      <button type="button" class="w-full p-4 text-left" onclick={openValidationPanel}>
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-muted-foreground">{FIXED_LABELS.validation.title}</div>
            <div class="mt-2 flex items-end gap-2">
              <span class="truncate text-2xl font-semibold text-foreground">{validationStore.dashboardSummary.primaryValue}</span>
            </div>
            <div class="mt-1 text-sm text-muted-foreground">{validationStore.dashboardSummary.description}</div>
          </div>
          <IconBox icon={FlaskConical} variant={validationStore.dashboardSummary.iconVariant} size="lg" />
        </div>
      </button>
    </InteractiveCard>

    <InteractiveCard tone="card" class="overflow-hidden p-0">
      <button type="button" class="w-full p-4 text-left" onclick={openHomeSurface}>
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-muted-foreground">{FIXED_LABELS.dashboard.tasks}</div>
            <div class="mt-2 flex items-end gap-2">
              <span class="text-3xl font-semibold text-foreground">{overallTaskProgress.percentage}%</span>
              <span class="pb-1 text-sm text-muted-foreground">{overallTaskProgress.done}/{overallTaskProgress.total}</span>
            </div>
            <div class="mt-3"><Progress value={overallTaskProgress.percentage} /></div>
          </div>
          <IconBox icon={CircleCheckBig} variant={getTaskProgressIconVariant(overallTaskProgress.done, overallTaskProgress.total)} size="lg" />
        </div>
      </button>
    </InteractiveCard>
  </div>

  <!-- Active Changes -->
  <SurfaceCard shadow="sm">
    <SectionHeader>
      <div class="space-y-2">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <h2 class="flex items-center gap-2 text-lg font-semibold text-foreground">
            <SquarePen class="h-5 w-5 text-muted-foreground" />
            {FIXED_LABELS.dashboard.activeChanges}
          </h2>

          {#if workspaceCommands.length > 0}
            <div class="flex max-w-full justify-end lg:max-w-lg">
              <CommandShortcutBar commands={workspaceCommands} />
            </div>
          {/if}
        </div>

        <div class="flex items-center justify-between gap-3">
          <p class="text-sm text-muted-foreground">{t(m.dashboard_active_changes_description)}</p>
          <ExplorerSortControl value={activeChangesSortMode} onValueChange={(value) => (activeChangesSortMode = value)} ariaLabel={`${FIXED_LABELS.dashboard.activeChanges} ${FIXED_LABELS.explorer.sortBy}`} />
        </div>
      </div>
    </SectionHeader>

    {#if activeChanges.value.length === 0}
      <div class="p-4">
        <EmptyState message={t(m.dashboard_no_active_changes)} icon={SquarePen} />
      </div>
    {:else}
      <div class="flex flex-col gap-2 p-4">
        {#each sortedActiveChanges as change}
          {@const changeCommands = changeCommandsFor(change)}
          {@const validationStatus = validationStatusForActiveChange(change.name)}
          <ItemContextMenu
            items={createItemContextMenuItems({
              kind: 'active-change',
              name: change.name,
              onOpenInNewTab: () => openActiveChange(change.name),
            })}
          >
            <InteractiveCard tone="inset" radius="sm" class="overflow-hidden bg-background/60 shadow-none p-0">
              <button
                type="button"
                class="group w-full px-4 py-3 text-left"
                onclick={() => openActiveChange(change.name)}
              >
                <div class="flex items-start gap-3">
                  <div class="flex min-w-0 flex-1 items-center gap-3">
                    <TypeIndicator kind="active-change" format="icon-box" size="md" />
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <div class="truncate font-medium text-foreground">{change.name}</div>
                        {#if change.hasProposal}
                          <Badge variant="outline">{FIXED_LABELS.dashboard.proposal}</Badge>
                        {/if}
                        {#if change.hasDesign}
                          <Badge variant="outline">{FIXED_LABELS.common.design}</Badge>
                        {/if}
                        {#if change.otherFileCount > 0}
                          <Badge variant="outline">{getOtherFileCountLabel(change.otherFileCount)}</Badge>
                        {/if}
                        {#if validationStatus}
                          <StatusIndicator state={validationStatus} format="minimal" showLabel={false} class="shrink-0" />
                        {/if}
                      </div>
                      <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                        {#if changeUpdatedAt(change)}
                          {@const updatedAtLabel = formatDashboardDate(changeUpdatedAt(change))}
                          <span class="inline-flex min-w-0 max-w-full items-center gap-1" title={updatedAtLabel}>
                            <Calendar class="h-3.5 w-3.5 shrink-0" />
                            <span class="truncate whitespace-nowrap">{updatedAtLabel}</span>
                          </span>
                        {/if}
                        <span class="flex items-center gap-1"><FileText class="h-3.5 w-3.5" />{getSpecDeltaCountLabel(change.specDeltaCount)}</span>
                        <span class="flex items-center gap-1"><CircleCheckBig class="h-3.5 w-3.5" />{getChangeTaskCountLabel(change.taskProgress.done, change.taskProgress.total)}</span>
                      </div>
                    </div>

                  </div>

                  <div class="flex min-w-45 shrink-0 items-center justify-end">
                    <div class="w-36 min-w-0 shrink-0">
                      <div class="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{FIXED_LABELS.common.progress}</span>
                        <span>{change.taskProgress.percentage}%</span>
                      </div>
                      <Progress value={change.taskProgress.percentage} />
                    </div>
                  </div>
                </div>
              </button>

              {#if changeCommands.length > 0}
                <div
                  class="cursor-pointer border-t border-border/40 bg-secondary/20 px-5 py-2.5"
                  role="button"
                  tabindex="0"
                  onclick={() => openActiveChange(change.name)}
                  onkeydown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openActiveChange(change.name);
                    }
                  }}
                >
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div class="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{FIXED_LABELS.common.nextStep}</div>
                    <div class="flex max-w-full sm:justify-end">
                      <CommandShortcutBar commands={changeCommands} changeName={change.name} />
                    </div>
                  </div>
                </div>
              {/if}
            </InteractiveCard>
          </ItemContextMenu>
        {/each}
      </div>
    {/if}
  </SurfaceCard>

  {#if recentActivity.length > 0}
    <SurfaceCard shadow="sm">
      <SectionHeader compact={true}>
        <div class="space-y-2">
          <h2 class="flex items-center gap-2 text-lg font-semibold text-foreground">
            <History class="h-5 w-5 text-muted-foreground" />
            {FIXED_LABELS.dashboard.recentActivity}
          </h2>
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm text-muted-foreground">{t(m.dashboard_recent_activity_description)}</p>
            <ExplorerSortControl value={recentActivitySortMode} onValueChange={(value) => (recentActivitySortMode = value)} ariaLabel={`${FIXED_LABELS.dashboard.recentActivity} ${FIXED_LABELS.explorer.sortBy}`} />
          </div>
        </div>
      </SectionHeader>
      <div class="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {#each sortedRecentActivity as item}
          {@const validationStatus = validationStatusForRecentActivity(item)}
          <ItemContextMenu
            items={createItemContextMenuItems(
              item.kind === 'spec'
                ? {
                    kind: 'spec',
                    name: item.name,
                    onOpenInNewTab: item.open,
                    onSearchRelatedChanges: () => searchForSpec(item.name),
                  }
                : {
                    kind: item.kind,
                    name: item.name,
                    onOpenInNewTab: item.open,
                  },
            )}
          >
            <InteractiveCard tone="inset" radius="sm" class="overflow-hidden shadow-none p-0 {item.kind === 'archived-change' ? 'bg-muted/20' : ''}">
              <button
                type="button"
                class="group flex w-full items-center gap-3 px-4 py-3 text-left"
                onclick={item.open}
              >
                <TypeIndicator kind={item.kind} format="icon-box" size="md" />
                <div class="min-w-0 flex-1">
                  <div class="truncate font-medium text-foreground" title={item.title}>{item.title}</div>
                  <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {#if item.date}
                      {@const itemDateLabel = formatDashboardDate(item.date)}
                      <span class="inline-flex min-w-0 max-w-full items-center gap-1" title={itemDateLabel}>
                        <Calendar class="h-3 w-3 shrink-0" />
                        <span class="truncate whitespace-nowrap">{itemDateLabel}</span>
                      </span>
                    {/if}
                    {#if item.specDeltaCount != null}
                      <span class="flex items-center gap-1"><FileText class="h-3 w-3" />{item.specDeltaCount}</span>
                    {/if}
                    {#if item.taskProgress}
                      <span class="flex items-center gap-1"><CircleCheckBig class="h-3 w-3" />{item.taskProgress.done}/{item.taskProgress.total}</span>
                    {/if}
                  </div>
                </div>
                {#if validationStatus}
                  <StatusIndicator state={validationStatus} format="minimal" showLabel={false} class="ml-auto shrink-0" />
                {/if}
              </button>
            </InteractiveCard>
          </ItemContextMenu>
        {/each}
      </div>
    </SurfaceCard>
  {/if}

  <!-- Planning Context -->
  {#if planningContext}
    <SurfaceCard id="project-documentation" shadow="sm">
      <SectionHeader>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <h2 class="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Bookmark class="h-5 w-5 text-muted-foreground" />
            {FIXED_LABELS.dashboard.planningContext}
          </h2>
          <Button variant="ghost" size="sm" onclick={openDocumentation}>
            <Bookmark class="h-4 w-4" />
            {FIXED_LABELS.dashboard.focusSection}
          </Button>
        </div>
      </SectionHeader>
      <div class="space-y-6 px-6 py-4">
        <div class="space-y-2">
          <p class="text-sm text-muted-foreground">
            {t(m.dashboard_planning_uses, { path: planningContext.source.path })}
          </p>

          {#if planningContextNotice.variant === 'error'}
            <Callout variant={planningContextNotice.variant}>
              <p class="font-medium">{planningContextNotice.title}</p>
              <p class="mt-1 text-sm">
                {t(m.dashboard_invalid_config_description)}
              </p>
            </Callout>
          {:else if planningContextNotice.variant === 'warning'}
            <Callout variant={planningContextNotice.variant}>
              <p class="font-medium">{planningContextNotice.title}</p>
              <p class="mt-1 text-sm">
                {t(m.dashboard_migration_needed_description)}
              </p>
            </Callout>
          {:else if planningContextNotice.variant === 'info'}
            <Callout variant={planningContextNotice.variant}>
              <p>{t(m.dashboard_legacy_present_description)}</p>
            </Callout>
          {/if}
        </div>

        {#if parsedPlanningContext}
          <section class="space-y-3">
            <div>
              <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">{FIXED_LABELS.dashboard.aiContext}</h3>
              <p class="mt-1 text-sm text-muted-foreground">{t(m.dashboard_ai_context_description)}</p>
            </div>

            {#if parsedPlanningContext.aiContext}
              <InsetPanel>
                <MarkdownRenderer content={parsedPlanningContext.aiContext} />
              </InsetPanel>
            {:else}
              <InsetPanel dashed class="text-sm text-muted-foreground">
                {t(m.dashboard_no_ai_context)}
              </InsetPanel>
            {/if}
          </section>

          <section class="space-y-3">
            <div>
              <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">{FIXED_LABELS.dashboard.artifactRules}</h3>
              <p class="mt-1 text-sm text-muted-foreground">{t(m.dashboard_artifact_rules_description)}</p>
            </div>

            {#if hasArtifactRules}
              <div class="space-y-3">
                {#each parsedPlanningContext.artifactRules as ruleSection}
                  <InsetPanel>
                    <div class="flex items-center gap-2">
                      <Badge variant="outline">{ruleSection.artifactId}</Badge>
                      <span class="text-sm font-medium text-foreground">{ruleSection.title}</span>
                    </div>

                    <div class="mt-3 space-y-3">
                      {#each ruleSection.items as item}
                        <div>
                          <div class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</div>
                          <div class="mt-1 rounded-md bg-secondary/50 px-3 py-2 text-sm whitespace-pre-wrap text-foreground">{item.value}</div>
                        </div>
                      {/each}
                    </div>
                  </InsetPanel>
                {/each}
              </div>
            {:else}
              <InsetPanel dashed class="text-sm text-muted-foreground">
                {t(m.dashboard_no_artifact_rules)}
              </InsetPanel>
            {/if}
          </section>

          <section class="space-y-3">
            <div>
              <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">{FIXED_LABELS.dashboard.workflowSchema}</h3>
              <p class="mt-1 text-sm text-muted-foreground">{t(m.dashboard_workflow_schema_description)}</p>
            </div>

            <InsetPanel class="py-3">
              <span class="font-medium text-foreground">{parsedPlanningContext.workflowSchema || getWorkflowSchemaFallbackLabel()}</span>
            </InsetPanel>
          </section>
        {:else if invalidPlanningContext}
          <section class="space-y-3">
            <div>
              <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">{FIXED_LABELS.dashboard.parseErrors}</h3>
            </div>

            <InsetPanel class="space-y-3">
              {#each invalidPlanningContext.parseErrors as parseError}
                <div class="rounded-md bg-danger-bg/50 px-3 py-2 text-sm whitespace-pre-wrap text-foreground">
                  {parseError}
                </div>
              {/each}
            </InsetPanel>
          </section>

          <section class="space-y-3">
            <div>
              <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">{FIXED_LABELS.dashboard.rawConfig}</h3>
            </div>

            <InsetPanel>
              <pre class="overflow-x-auto text-sm whitespace-pre-wrap text-foreground"><code>{invalidPlanningContext.rawConfig}</code></pre>
            </InsetPanel>
          </section>
        {/if}

        {#if legacyProjectDoc}
          <section class="space-y-3">
            <InsetPanel class="overflow-hidden px-0 py-0">
              <Collapsible.Root
                open={legacyProjectDocOpen}
                onOpenChange={(open) => {
                  legacyProjectDocOpen = open;
                }}
              >
                <div class="border-b border-border/70 px-4 py-3">
                  <Collapsible.Trigger class="flex w-full items-center justify-between px-0 py-0 text-left">
                    <span class="flex items-center gap-2">
                      <span class="text-sm font-semibold text-foreground">{FIXED_LABELS.dashboard.legacyProjectDoc}</span>
                      <Badge variant="outline">{FIXED_LABELS.dashboard.badges.legacy}</Badge>
                    </span>
                    {#if legacyProjectDocOpen}
                      <ChevronDown class="h-4 w-4 text-muted-foreground" />
                    {:else}
                      <ChevronRight class="h-4 w-4 text-muted-foreground" />
                    {/if}
                  </Collapsible.Trigger>
                </div>

                <Collapsible.Content>
                  <div class="space-y-3 px-4 py-4">
                    <p class="text-sm text-muted-foreground">
                      {t(m.dashboard_legacy_doc_description)}
                    </p>
                    <MarkdownRenderer content={legacyProjectDoc.content} />
                  </div>
                </Collapsible.Content>
              </Collapsible.Root>
            </InsetPanel>
          </section>
        {/if}
      </div>
    </SurfaceCard>
  {/if}
</div>
