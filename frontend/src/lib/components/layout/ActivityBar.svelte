<script lang="ts">
  import { Archive, FileText, FlaskConical, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Search, Settings } from '@lucide/svelte';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { decodeName } from '$lib/utils';
  import { archivedChanges, project } from '$lib/state/appData.svelte.ts';
  import { projectStore } from '$lib/state/projects.svelte.ts';
  import { layoutStore, type ActivityPreset } from '$lib/state/layout.svelte.ts';
  import { searchStore } from '$lib/state/search.svelte.ts';
  import { tabStore } from '$lib/state/tabs.svelte.ts';
  import { uiPreferencesStore } from '$lib/state/uiPreferences.svelte.ts';
  import { validationStore } from '$lib/state/validation.svelte.ts';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';
  import { FIXED_LABELS } from '$lib/uiText';
  import {
    isActivityBarExplorerOpen,
    shouldToggleCurrentPreset,
    type ActivityBarActiveSection,
  } from './activityBarController';

  function sectionFromPath(path: string): ActivityPreset {
    if (path === '/specs' || path.startsWith('/specs/')) {
      return 'specs';
    }

    if (path === '/changes') {
      return 'archive';
    }

    if (path.startsWith('/changes/')) {
      const changeName = decodeName(path.slice('/changes/'.length));
      return archivedChanges.value.some((change) => change.name === changeName) ? 'archive' : 'home';
    }

    return 'home';
  }

  let lastSyncedContext = $state('');

  $effect(() => {
    const path = tabStore.activeTab.path;
    const archivedNames = archivedChanges.value.map((change) => change.name).join('\u0000');
    const syncContext = `${path}::${archivedNames}`;

    if (syncContext === lastSyncedContext) {
      return;
    }

    lastSyncedContext = syncContext;
    layoutStore.syncActivityPreset(sectionFromPath(path));
  });

  let activeSection = $derived.by((): ActivityBarActiveSection => {
    if (tabStore.activeTab.type === 'settings') {
      return 'settings';
    }

    return layoutStore.activityPreset;
  });

  function openPreset(preset: ActivityPreset) {
    layoutStore.closeOverlay();

    if (shouldToggleCurrentPreset({
      preset,
      activeSection,
      hasActiveProject: Boolean(projectStore.activeProjectId),
      responsiveMode: layoutStore.responsiveMode,
      explorerCollapsed: layoutStore.explorerCollapsed,
      narrowDrawerOpen: layoutStore.narrowDrawerOpen,
    })) {
      if (layoutStore.responsiveMode === 'narrow') {
        layoutStore.toggleNarrowDrawer();
      } else {
        layoutStore.toggleExplorerCollapsed();
      }

      return;
    }

    layoutStore.setActivityPreset(preset);

    if (preset === 'home') {
      tabStore.focus('/');
    }
  }

  function openSearch() {
    if (!projectStore.activeProjectId) {
      return;
    }

    layoutStore.closeOverlay();

    if (shouldToggleCurrentPreset({
      preset: 'search',
      activeSection,
      hasActiveProject: Boolean(projectStore.activeProjectId),
      responsiveMode: layoutStore.responsiveMode,
      explorerCollapsed: layoutStore.explorerCollapsed,
      narrowDrawerOpen: layoutStore.narrowDrawerOpen,
    })) {
      if (layoutStore.responsiveMode === 'narrow') {
        layoutStore.toggleNarrowDrawer();
      } else {
        layoutStore.toggleExplorerCollapsed();
      }

      return;
    }

    searchStore.open();
  }

  function openValidate() {
    if (!projectStore.activeProjectId) {
      return;
    }

    layoutStore.closeOverlay();

    if (shouldToggleCurrentPreset({
      preset: 'validate',
      activeSection,
      hasActiveProject: Boolean(projectStore.activeProjectId),
      responsiveMode: layoutStore.responsiveMode,
      explorerCollapsed: layoutStore.explorerCollapsed,
      narrowDrawerOpen: layoutStore.narrowDrawerOpen,
    })) {
      if (layoutStore.responsiveMode === 'narrow') {
        layoutStore.toggleNarrowDrawer();
      } else {
        layoutStore.toggleExplorerCollapsed();
      }

      return;
    }

    layoutStore.setActivityPreset('validate');
  }

  function buttonClass(section: string) {
    return activeSection === section
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary';
  }

  function toggleExplorer() {
    if (!projectStore.activeProjectId) {
      return;
    }

    layoutStore.closeOverlay();

    if (layoutStore.responsiveMode === 'narrow') {
      layoutStore.toggleNarrowDrawer();
      return;
    }

    layoutStore.toggleExplorerCollapsed();
  }

  let explorerOpen = $derived(
    isActivityBarExplorerOpen({
      hasActiveProject: Boolean(projectStore.activeProjectId),
      responsiveMode: layoutStore.responsiveMode,
      explorerCollapsed: layoutStore.explorerCollapsed,
      narrowDrawerOpen: layoutStore.narrowDrawerOpen,
    })
  );

  let topControlLabel = $derived(
    projectStore.activeProjectId
      ? explorerOpen
        ? FIXED_LABELS.activityBar.collapseExplorer
        : FIXED_LABELS.activityBar.expandExplorer
      : FIXED_LABELS.appName
  );

  let searchHighlightActive = $derived(
    uiPreferencesStore.searchHighlightsEnabled && searchStore.query.length >= 2,
  );
</script>

<aside class="relative z-60 flex h-full w-12 shrink-0 flex-col items-center border-r border-border bg-secondary/70 py-2">
  <div class="mt-1 flex flex-col gap-3">
    <Tooltip.Root>
      <Tooltip.Trigger
        class={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${buttonClass('home')}`}
        aria-label={FIXED_LABELS.common.dashboard}
        onclick={() => openPreset('home')}
      >
        <LayoutDashboard class="h-5 w-5" />
      </Tooltip.Trigger>
      <Tooltip.Content side="right">{FIXED_LABELS.common.dashboard}</Tooltip.Content>
    </Tooltip.Root>

    <Tooltip.Root>
      <Tooltip.Trigger
        class={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${buttonClass('archive')}`}
        aria-label={FIXED_LABELS.common.archive}
        onclick={() => openPreset('archive')}
      >
        <Archive class="h-5 w-5" />
      </Tooltip.Trigger>
      <Tooltip.Content side="right">{FIXED_LABELS.common.archive}</Tooltip.Content>
    </Tooltip.Root>

    <Tooltip.Root>
      <Tooltip.Trigger
        class={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${buttonClass('specs')}`}
        aria-label={FIXED_LABELS.common.specs}
        onclick={() => openPreset('specs')}
      >
        <FileText class="h-5 w-5" />
      </Tooltip.Trigger>
      <Tooltip.Content side="right">{FIXED_LABELS.common.specs}</Tooltip.Content>
    </Tooltip.Root>

    <div class="px-2">
      <hr class="border-foreground/30" />
    </div>
    
    <Tooltip.Root>
      <Tooltip.Trigger
        class={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${buttonClass('search')}`}
        aria-label={FIXED_LABELS.common.search}
        onclick={openSearch}
      >
        <Search class="h-5 w-5" />
        {#if searchHighlightActive}
          <span class="absolute right-1 top-1 inline-flex size-2 rounded-full border border-warning-border bg-warning-bg" aria-hidden="true"></span>
        {/if}
      </Tooltip.Trigger>
      <Tooltip.Content side="right">{FIXED_LABELS.common.search}</Tooltip.Content>
    </Tooltip.Root>

    <Tooltip.Root>
      <Tooltip.Trigger
        class={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${buttonClass('validate')}`}
        aria-label={t(m.validation_activity_label)}
        onclick={openValidate}
      >
        <FlaskConical class="h-5 w-5" />
        {#if validationStore.failedCount > 0}
          <span class="absolute bottom-1 right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white">
            {Math.min(validationStore.failedCount, 99)}
          </span>
        {/if}
      </Tooltip.Trigger>
      <Tooltip.Content side="right">{t(m.validation_activity_label)}</Tooltip.Content>
    </Tooltip.Root>
  </div>

  <div class="mt-auto flex flex-col gap-3">
    <Tooltip.Root>
      <Tooltip.Trigger
        class={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${buttonClass('settings')}`}
        aria-label={FIXED_LABELS.common.settings}
        onclick={() => tabStore.openSettings()}
      >
        <Settings class="h-5 w-5" />
      </Tooltip.Trigger>
      <Tooltip.Content side="right">{FIXED_LABELS.common.settings}</Tooltip.Content>
    </Tooltip.Root>

    <Tooltip.Root>
      <Tooltip.Trigger
        class={`flex h-10 w-10 items-center justify-center rounded-lg bg-transparent transition-colors ${projectStore.activeProjectId ? `${explorerOpen ? 'text-foreground' : 'text-muted-foreground'} hover:text-foreground` : 'text-muted-foreground/70'}`}
        aria-label={topControlLabel}
        aria-disabled={!projectStore.activeProjectId}
        onclick={toggleExplorer}
      >
        {#if projectStore.activeProjectId}
          {#if explorerOpen}
            <PanelLeftClose class="h-5 w-5" />
          {:else}
            <PanelLeftOpen class="h-5 w-5" />
          {/if}
        {:else}
          <img src="/app-icon.svg" alt="" aria-hidden="true" class="h-6 w-6 rounded-sm" />
        {/if}
        <span class="sr-only">{project.value?.name ?? FIXED_LABELS.appName}</span>
      </Tooltip.Trigger>
      <Tooltip.Content side="right">
        <span>{topControlLabel}</span>
      </Tooltip.Content>
    </Tooltip.Root>
  </div>
</aside>
