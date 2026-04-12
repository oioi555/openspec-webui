<script lang="ts">
  import { tick } from 'svelte';
  import { Archive, ArrowRight, Bookmark, BookOpen, Calendar, CheckSquare, Clipboard, FileText, History, House, SquarePen } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { EmptyState } from '$lib/components/ui/empty-state';
  import { IconBox } from '$lib/components/ui/icon-box';
  import { activeChanges, archivedChanges, project, specs, stats } from '../stores/index.svelte.ts';
  import { commandPreferencesStore } from '../stores/commandPreferences.svelte.ts';
  import { buildCommand, getChangeCommands, getWorkspaceCommands } from '../lib/commandShortcuts';
  import type { WorkflowCommand } from '../lib/commandTypes';
  import { layoutStore } from '../stores/layout.svelte.ts';
  import { tabStore } from '../stores/tabs.svelte.ts';
  import MarkdownRenderer from './MarkdownRenderer.svelte';
  import { Progress } from '$lib/components/ui/progress';
  import CommandShortcutBar from './CommandShortcutBar.svelte';
  import { formatChangeName } from '../lib/utils';
  import * as utils from '../lib/utils';
  import { toast } from 'svelte-sonner';

  type TimestampedChange = {
    name: string;
    isArchived?: boolean;
    archivedDate: string | null;
    lastModified?: string | null;
    specDeltaCount: number;
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
    hasDesign: boolean;
    lastModified?: string | null;
  };

  const formatDashboardDate = ((utils as Record<string, unknown>).formatDate ?? (() => '')) as (
    iso: string | null | undefined,
  ) => string;

  let workspaceCommands = $derived(getWorkspaceCommands(activeChanges.value, commandPreferencesStore));

  function timestampValue(value: string | null | undefined) {
    if (!value) {
      return 0;
    }

    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  function changeUpdatedAt(change: TimestampedChange) {
    return change.lastModified ?? null;
  }

  function changeArchivedOrUpdatedAt(change: TimestampedChange) {
    return change.archivedDate ?? change.lastModified ?? null;
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

  let recentActivity = $derived.by(() => {
    const activeItems = activeChanges.value
      .filter((change) => timestampValue(changeUpdatedAt(change)) > 0)
      .map((change) => ({
        id: `active:${change.name}`,
        title: change.name,
        date: changeUpdatedAt(change),
        timestamp: timestampValue(changeUpdatedAt(change)),
        badge: 'Active change',
        meta: `${change.taskProgress.done}/${change.taskProgress.total} tasks • ${change.specDeltaCount} specs`,
        open: () => openActiveChange(change.name),
      }));

    const archivedItems = archivedChanges.value
      .filter((change) => timestampValue(changeArchivedOrUpdatedAt(change)) > 0)
      .map((change) => ({
        id: `archived:${change.name}`,
        title: formatChangeName(change.name),
        date: changeArchivedOrUpdatedAt(change),
        timestamp: timestampValue(changeArchivedOrUpdatedAt(change)),
        badge: 'Archived',
        meta: `${change.taskProgress.done}/${change.taskProgress.total} tasks complete`,
        open: () => openArchivedChange(change.name),
      }));

    const specItems = specs.value
      .filter((spec) => timestampValue(specUpdatedAt(spec)) > 0)
      .map((spec) => ({
        id: `spec:${spec.name}`,
        title: spec.name,
        date: specUpdatedAt(spec),
        timestamp: timestampValue(specUpdatedAt(spec)),
        badge: 'Spec',
        meta: spec.hasDesign ? 'Spec + design' : 'Spec only',
        open: () => openSpec(spec.name),
      }));

    return [...activeItems, ...archivedItems, ...specItems]
      .sort((left, right) => right.timestamp - left.timestamp)
      .slice(0, 6);
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

  function openHomeSurface() {
    layoutStore.setActivityPreset('home');
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

  async function copyCommand(command: WorkflowCommand, changeName?: string) {
    const text = buildCommand(command, commandPreferencesStore.aiTool, changeName);

    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  }

  function changeCommandsFor(change: TimestampedChange) {
    const changeContext = {
      isArchived: change.isArchived ?? false,
      taskProgress: change.taskProgress,
    } as Parameters<typeof getChangeCommands>[0];

    return getChangeCommands(changeContext, commandPreferencesStore);
  }
</script>

<svelte:head>
  <title>Dashboard • OpenSpec WebUI</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <div>
      <h1 class="flex items-center gap-2 text-2xl font-bold text-foreground">
        <IconBox icon={House} variant="info" />
        Dashboard
      </h1>
      {#if project.value?.description}
        <p class="mt-1 text-muted-foreground">{project.value.description}</p>
      {/if}
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <button
      type="button"
      class="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      onclick={openHomeSurface}
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-medium text-muted-foreground">Active Changes</div>
          <div class="mt-2 text-3xl font-semibold text-foreground">{stats.value?.activeChanges ?? activeChanges.value.length}</div>
          <div class="mt-1 text-sm text-muted-foreground">Work currently in progress</div>
        </div>
        <IconBox icon={SquarePen} variant="info" />
      </div>
    </button>

    <button
      type="button"
      class="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      onclick={focusArchiveSection}
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-medium text-muted-foreground">Archive</div>
          <div class="mt-2 text-3xl font-semibold text-foreground">{stats.value?.archivedChanges ?? archivedChanges.value.length}</div>
          <div class="mt-1 text-sm text-muted-foreground">Completed work you can revisit</div>
        </div>
        <IconBox icon={Archive} variant="muted" />
      </div>
    </button>

    <button
      type="button"
      class="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      onclick={focusSpecsSection}
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-medium text-muted-foreground">Specs</div>
          <div class="mt-2 text-3xl font-semibold text-foreground">{stats.value?.totalSpecs ?? specs.value.length}</div>
          <div class="mt-1 text-sm text-muted-foreground">Reference specs and designs</div>
        </div>
        <IconBox icon={FileText} variant="success" />
      </div>
    </button>

    <button
      type="button"
      class="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      onclick={openHomeSurface}
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="text-sm font-medium text-muted-foreground">Tasks</div>
          <div class="mt-2 flex items-end gap-2">
            <span class="text-3xl font-semibold text-foreground">{overallTaskProgress.percentage}%</span>
            <span class="pb-1 text-sm text-muted-foreground">{overallTaskProgress.done}/{overallTaskProgress.total}</span>
          </div>
          <div class="mt-3"><Progress value={overallTaskProgress.percentage} /></div>
        </div>
        <IconBox icon={CheckSquare} variant="warning" />
      </div>
    </button>
  </div>

  <div class="space-y-6">
    <!-- Active Changes -->
    <div class="rounded-lg border border-border bg-card shadow-lg">
      <div class="flex flex-wrap items-start justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <h2 class="flex items-center gap-2 text-lg font-semibold text-foreground">
            <SquarePen class="h-5 w-5 text-muted-foreground" />
            Active Changes
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">Ask your AI to propose a change. Use Next Step commands to continue ongoing work.</p>
        </div>

        {#if workspaceCommands.length > 0}
          <div class="flex max-w-full justify-end lg:max-w-lg">
            <CommandShortcutBar commands={workspaceCommands} />
          </div>
        {/if}
      </div>

      {#if activeChanges.value.length === 0}
        <div class="p-4">
          <EmptyState message="No active changes" icon={SquarePen} />
        </div>
      {:else}
        <div class="space-y-3 p-4">
          {#each activeChanges.value as change}
            {@const changeCommands = changeCommandsFor(change)}
            <div class="rounded-xl border border-border/70 bg-background/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary/40 hover:shadow-md">
              <button
                type="button"
                class="group w-full px-5 py-4 text-left"
                onclick={() => openActiveChange(change.name)}
              >
                <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <IconBox icon={SquarePen} size="sm" variant="info" />
                      <div class="truncate font-medium text-foreground">{change.name}</div>
                      {#if change.hasProposal}
                        <Badge variant="outline">Proposal</Badge>
                      {/if}
                      {#if change.hasDesign}
                        <Badge variant="outline">Design</Badge>
                      {/if}
                    </div>

                    <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                      {#if changeUpdatedAt(change)}
                        <span class="flex items-center gap-1"><Calendar class="h-3.5 w-3.5" />{formatDashboardDate(changeUpdatedAt(change))}</span>
                      {/if}
                      <span class="flex items-center gap-1"><FileText class="h-3.5 w-3.5" />{change.specDeltaCount} spec delta{change.specDeltaCount === 1 ? '' : 's'}</span>
                      <span class="flex items-center gap-1"><CheckSquare class="h-3.5 w-3.5" />{change.taskProgress.done}/{change.taskProgress.total} tasks</span>
                    </div>
                  </div>

                  <div class="flex min-w-45 items-center gap-3 lg:justify-end">
                    <div class="min-w-0 flex-1 lg:w-36 lg:flex-none">
                      <div class="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{change.taskProgress.percentage}%</span>
                      </div>
                      <Progress value={change.taskProgress.percentage} />
                    </div>
                    <ArrowRight class="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>
                </div>
              </button>

              {#if changeCommands.length > 0}
                <div class="border-t border-border/60 px-5 py-3">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div class="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Next Step</div>
                    <div class="flex max-w-full sm:justify-end">
                      <CommandShortcutBar commands={changeCommands} changeName={change.name} />
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    {#if recentActivity.length > 0}
      <div class="rounded-lg border border-border bg-card shadow-sm">
        <div class="border-b border-border px-5 py-4">
          <h2 class="flex items-center gap-2 text-base font-semibold text-foreground">
            <History class="h-5 w-5 text-muted-foreground" />
            Recent Activity
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">Newest change and spec updates across the workspace.</p>
        </div>
        <div class="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {#each recentActivity as item}
            <button
              type="button"
              class="group flex h-full flex-col rounded-xl border border-border/70 bg-background/70 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary/40 hover:shadow-md"
              onclick={item.open}
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-start gap-3">
                   <IconBox
                     icon={item.badge === 'Spec' ? FileText : item.badge === 'Archived' ? Archive : SquarePen}
                     size="sm"
                     variant={item.badge === 'Spec' ? 'success' : item.badge === 'Archived' ? 'muted' : 'info'}
                   />
                  <div class="min-w-0 flex-1">
                    <div class="truncate font-medium text-foreground" title={item.title}>{item.title}</div>
                    <div class="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{item.badge}</Badge>
                      <span class="text-xs text-muted-foreground">{formatDashboardDate(item.date)}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <div class="mt-3 text-sm text-muted-foreground">{item.meta}</div>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Project Info -->
  {#if project.value?.content}
    <div id="project-documentation" class="rounded-lg border border-border bg-card shadow-lg">
      <div class="flex flex-wrap items-start justify-between gap-3 border-b border-border px-6 py-4">
        <h2 class="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Bookmark class="h-5 w-5 text-muted-foreground" />
          Project Documentation
        </h2>
        <Button variant="ghost" size="sm" onclick={openDocumentation}>
          <Bookmark class="h-4 w-4" />
          Focus section
        </Button>
      </div>
      <div class="px-6 py-4">
        <MarkdownRenderer content={project.value.content} />
      </div>
    </div>
  {/if}
</div>
