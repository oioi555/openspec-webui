<script lang="ts">
  import { Archive, ChevronsUpDown, FileText, House, Search, Settings } from '@lucide/svelte';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { archivedChanges, project } from '../../stores/index.svelte.ts';
  import { layoutStore, type ActivityPreset } from '../../stores/layout.svelte.ts';
  import { tabStore } from '../../stores/tabs.svelte.ts';

  function decodeName(value: string) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  let activeSection = $derived.by(() => {
    if (layoutStore.overlay === 'search') {
      return 'search';
    }

    if (layoutStore.overlay === 'settings') {
      return 'settings';
    }

    const path = tabStore.activeTab.path;

    if (path === '/specs' || path.startsWith('/specs/')) {
      return 'specs';
    }

    if (path === '/changes') {
      return 'changes';
    }

    if (path.startsWith('/changes/')) {
      const changeName = decodeName(path.slice('/changes/'.length));
      return archivedChanges.value.some((change) => change.name === changeName) ? 'changes' : 'home';
    }

    return 'home';
  });

  function openPreset(preset: ActivityPreset, path: string) {
    layoutStore.closeOverlay();
    layoutStore.setActivityPreset(preset);

    if (layoutStore.responsiveMode !== 'narrow') {
      layoutStore.setExplorerCollapsed(false);
    }

    tabStore.open(path);
  }

  function buttonClass(section: string) {
    return activeSection === section
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground';
  }
</script>

<aside class="flex h-full w-12 shrink-0 flex-col items-center border-r border-border bg-secondary/70 py-2">
  <Tooltip.Root>
    <Tooltip.Trigger
      class="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent"
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
        aria-label="Home"
        onclick={() => openPreset('home', '/')}
      >
        <House class="h-5 w-5" />
      </Tooltip.Trigger>
      <Tooltip.Content side="right">Home</Tooltip.Content>
    </Tooltip.Root>

    <Tooltip.Root>
      <Tooltip.Trigger
        class={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${buttonClass('changes')}`}
        aria-label="Changes"
        onclick={() => openPreset('changes', '/changes')}
      >
        <Archive class="h-5 w-5" />
      </Tooltip.Trigger>
      <Tooltip.Content side="right">Changes</Tooltip.Content>
    </Tooltip.Root>

    <Tooltip.Root>
      <Tooltip.Trigger
        class={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${buttonClass('specs')}`}
        aria-label="Specs"
        onclick={() => openPreset('specs', '/specs')}
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
