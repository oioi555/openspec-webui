<script lang="ts">
  import { Folder, FolderPen } from '@lucide/svelte';
  import {
    ActiveChangesExplorerSection,
    ArchiveExplorerSection,
    SpecsExplorerSection,
  } from '$lib/components/shared/explorer-section';
  import { InteractiveCard } from '$lib/components/shared/surface';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import { getWorkspaceCommands } from '$lib/commandShortcuts';
  import { activeChanges, archivedChanges, project, specs } from '$lib/state/appData.svelte.ts';
  import { commandPreferencesStore } from '$lib/state/commandPreferences.svelte.ts';
  import { layoutStore } from '$lib/state/layout.svelte.ts';
  import CommandShortcutBar from '$lib/components/shared/CommandShortcutBar.svelte';
  import { FIXED_LABELS } from '$lib/uiText';

  interface Props {
    temporary?: boolean;
    onItemSelected?: () => void;
    onRequestClose?: () => void;
  }

  let {
    temporary = false,
    onItemSelected = () => {},
    onRequestClose = () => {},
  }: Props = $props();

  function commandPreferencesSnapshot() {
    return {
      format: commandPreferencesStore.format,
      commandVisibility: commandPreferencesStore.commandVisibility,
      availability: commandPreferencesStore.availability,
    };
  }

  let workspaceCommands = $derived(getWorkspaceCommands(activeChanges.value, commandPreferencesSnapshot()));

  function openProjectSelector() {
    layoutStore.openOverlay('project-selector');
  }

</script>

<aside class="flex h-full min-h-0 flex-col bg-card">

  <ScrollArea.Root class="min-h-0 flex-1" viewportClass="h-full">
    <div class="space-y-4 p-3">
      {#snippet activeChangesExtra()}
        {#if workspaceCommands.length > 0}
          <CommandShortcutBar commands={workspaceCommands} />
        {/if}
      {/snippet}

      <ActiveChangesExplorerSection
        changes={activeChanges.value}
        {onItemSelected}
        headerExtra={activeChangesExtra}
      />

      <ArchiveExplorerSection
        changes={archivedChanges.value}
        {onItemSelected}
      />

      <SpecsExplorerSection
        specs={specs.value}
        {onItemSelected}
      />
    </div>
  </ScrollArea.Root>
  <div class={`gap-3 border-t border-border px-3 py-2 ${!temporary ? 'bg-secondary/70' : ''}`}>
    <div class="flex min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Folder class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span class="truncate">{FIXED_LABELS.common.currentProject}</span>
    </div>
    <InteractiveCard
      tone="card"
      class="mt-2 gap-1 rounded-md px-3 py-2 cursor-pointer"
      onclick={openProjectSelector}
      role="button"
      tabindex="0"
      aria-label={FIXED_LABELS.activityBar.openProjectSelector}
      title={FIXED_LABELS.activityBar.openProjectSelector}
    >
      <div class="flex min-w-0 items-center">
        <span class="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{project.value?.name ?? FIXED_LABELS.appName}</span>
        <FolderPen class="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </InteractiveCard>
  </div>

</aside>
