<script lang="ts">
  import { Archive, ChevronsUpDown, FileText, House, Search, Settings } from '@lucide/svelte';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { decodeName } from '$lib/utils';
  import { archivedChanges, project } from '../../stores/index.svelte.ts';
  import { layoutStore, type ActivityPreset } from '../../stores/layout.svelte.ts';
  import { tabStore } from '../../stores/tabs.svelte.ts';

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

  let activeSection = $derived.by(() => {
    if (layoutStore.overlay === 'search') {
      return 'search';
    }

    if (layoutStore.overlay === 'settings') {
      return 'settings';
    }

    return layoutStore.activityPreset;
  });

  function openPreset(preset: ActivityPreset) {
    const isCurrentSection = activeSection === preset;

    layoutStore.closeOverlay();

    if (isCurrentSection && layoutStore.responsiveMode !== 'narrow' && !layoutStore.explorerCollapsed) {
      layoutStore.toggleExplorerCollapsed();
      return;
    }

    layoutStore.setActivityPreset(preset);

    if (preset === 'home') {
      tabStore.focus('/');
    }
  }

  function buttonClass(section: string) {
    return activeSection === section
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary';
  }
</script>

<aside class="flex h-full w-12 shrink-0 flex-col items-center border-r border-border bg-secondary/70 py-2">
  <Tooltip.Root>
    <Tooltip.Trigger
      class="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-card text-card-foreground shadow-sm transition-colors hover:bg-secondary/80"
      aria-label="Open project selector"
      onclick={() => layoutStore.openOverlay('project-selector')}
    >
      <img src="/app-icon.svg" alt="" aria-hidden="true" class="h-6 w-6 rounded-sm" />
      <span class="sr-only">{project.value?.name ?? 'OpenSpec WebUI'}</span>
    </Tooltip.Trigger>
    <Tooltip.Content side="right">
      <div class="flex items-center gap-2">
        <span>{project.value?.name ?? 'OpenSpec WebUI'}</span>
        <ChevronsUpDown class="h-3.5 w-3.5" />
      </div>
    </Tooltip.Content>
  </Tooltip.Root>

  <div class="mt-4 flex flex-col gap-2">
    <Tooltip.Root>
      <Tooltip.Trigger
        class={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${buttonClass('home')}`}
        aria-label="Dashboard"
        onclick={() => openPreset('home')}
      >
        <House class="h-5 w-5" />
      </Tooltip.Trigger>
      <Tooltip.Content side="right">Dashboard</Tooltip.Content>
    </Tooltip.Root>

    <Tooltip.Root>
      <Tooltip.Trigger
        class={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${buttonClass('archive')}`}
        aria-label="Archive"
        onclick={() => openPreset('archive')}
      >
        <Archive class="h-5 w-5" />
      </Tooltip.Trigger>
      <Tooltip.Content side="right">Archive</Tooltip.Content>
    </Tooltip.Root>

    <Tooltip.Root>
      <Tooltip.Trigger
        class={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${buttonClass('specs')}`}
        aria-label="Specs"
        onclick={() => openPreset('specs')}
      >
        <FileText class="h-5 w-5" />
      </Tooltip.Trigger>
      <Tooltip.Content side="right">Specs</Tooltip.Content>
    </Tooltip.Root>
  </div>

  <div class="mt-auto flex flex-col gap-2">
    <Tooltip.Root>
      <Tooltip.Trigger
        class={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${buttonClass('search')}`}
        aria-label="Search"
        onclick={() => layoutStore.toggleOverlay('search')}
      >
        <Search class="h-5 w-5" />
      </Tooltip.Trigger>
      <Tooltip.Content side="right">Search</Tooltip.Content>
    </Tooltip.Root>

    <Tooltip.Root>
      <Tooltip.Trigger
        class={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${buttonClass('settings')}`}
        aria-label="Settings"
        onclick={() => layoutStore.toggleOverlay('settings')}
      >
        <Settings class="h-5 w-5" />
      </Tooltip.Trigger>
      <Tooltip.Content side="right">Settings</Tooltip.Content>
    </Tooltip.Root>
  </div>
</aside>
