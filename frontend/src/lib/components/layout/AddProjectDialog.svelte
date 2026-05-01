<script lang="ts">
  import { Folder, FolderOpen, FolderPlus, LoaderCircle, CircleAlert, ChevronDown, ChevronUp, ChevronRight } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import * as Dialog from '$lib/components/ui/dialog';
  import { DialogHeader as SharedDialogHeader } from '$lib/components/shared/dialog-header';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';
  import { browseDirectory } from '$lib/api';
  import { OPENSPEC_INSTALL_DOCS_URL, OPENSPEC_SETUP_DOCS_URL } from '$lib/openspecDocs';
  import {
    shouldShowProjectInitGuidance,
  } from '$lib/projectOnboarding';
  import { layoutStore } from '$lib/state/layout.svelte.ts';
  import { projectStore } from '$lib/state/projects.svelte.ts';
  import type { BrowseResult } from '$lib/types/api';
  import { FIXED_LABELS } from '$lib/uiText';

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();

  let manualPath = $state('');
  let manualEntryOpen = $state(false);
  let loading = $derived(projectStore.loading);
  let error = $derived(projectStore.error);
  let addProjectErrorCause = $state<unknown>(null);
  let showInvalidProjectGuidance = $derived(shouldShowProjectInitGuidance(addProjectErrorCause, error));

  // Directory browser state
  let browseResult = $state<BrowseResult | null>(null);
  let browseLoading = $state(false);
  let browseError = $state('');
  // Breadcrumb trail for navigation history
  let history = $state<string[]>([]);

  async function loadBrowse(dirPath?: string) {
    browseLoading = true;
    browseError = '';
    try {
      browseResult = await browseDirectory(dirPath);
    } catch {
      browseError = m.add_project_browse_failed();
      browseResult = null;
    } finally {
      browseLoading = false;
    }
  }

  function navigateTo(dirPath: string) {
    history.push(browseResult?.path ?? '');
    loadBrowse(dirPath);
  }

  function goUp() {
    if (browseResult?.parent) {
      history.push(browseResult.path);
      loadBrowse(browseResult.parent);
    }
  }

  function goBack() {
    if (history.length > 0) {
      const prev = history.pop()!;
      loadBrowse(prev);
    }
  }

  async function handleSelectAndAdd() {
    if (!browseResult?.path || loading) return;

    try {
      await projectStore.addProject(browseResult.path);
      addProjectErrorCause = null;
      onClose();
    } catch (cause) {
      addProjectErrorCause = cause;
      // Error handled by store
    }
  }

  async function handleManualAdd(e: Event) {
    e.preventDefault();
    if (!manualPath.trim() || loading) return;

    try {
      await projectStore.addProject(manualPath.trim());
      addProjectErrorCause = null;
      manualPath = '';
      onClose();
    } catch (cause) {
      addProjectErrorCause = cause;
      // Error handled by store
    }
  }

  // Load initial browse when dialog opens
  $effect(() => {
    if (open) {
      history = [];
      manualEntryOpen = false;
      manualPath = '';
      addProjectErrorCause = null;
      projectStore.clearError();
      loadBrowse();
    }
  });
</script>

<Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
  <Dialog.Overlay />
  <Dialog.Content class="max-w-2xl gap-0 p-0">
    <SharedDialogHeader
      icon={FolderPlus}
      title={FIXED_LABELS.addProject.title}
      description={t(m.add_project_description)}
      onClose={onClose}
    />

    <div class="flex flex-col gap-4 px-6 py-4">
      <div class="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <p>{t(m.add_project_init_hint)}</p>
        <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span>{t(m.docs_intro)}</span>
          <a
            class="font-medium text-primary underline underline-offset-4 transition-opacity hover:opacity-85"
            href={OPENSPEC_INSTALL_DOCS_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t(m.docs_install_label)}
          </a>
          <span aria-hidden="true">·</span>
          <a
            class="font-medium text-primary underline underline-offset-4 transition-opacity hover:opacity-85"
            href={OPENSPEC_SETUP_DOCS_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t(m.docs_setup_label)}
          </a>
        </div>
      </div>

      <!-- Path bar with navigation -->
      <div class="flex items-center gap-1 rounded-lg border border-border bg-muted/30 px-2 py-2">
        <Button
          variant="ghost"
          size="icon"
          class="size-7 shrink-0"
          onclick={goBack}
          disabled={history.length === 0 || browseLoading}
          title={FIXED_LABELS.addProject.goBack}
        >
          <ChevronRight class="h-4 w-4 rotate-180" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-7 shrink-0"
          onclick={goUp}
          disabled={!browseResult?.parent || browseLoading}
          title={FIXED_LABELS.addProject.goParent}
        >
          <ChevronUp class="h-4 w-4" />
        </Button>
        <input
          type="text"
          value={browseResult?.path ?? ''}
          placeholder="/"
          class="min-w-0 flex-1 bg-transparent px-2 text-sm font-mono text-foreground outline-none placeholder:text-muted-foreground"
          onkeydown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              navigateTo((e.target as HTMLInputElement).value);
            }
          }}
          onchange={(e) => {
            navigateTo((e.target as HTMLInputElement).value);
          }}
        />
        {#if browseLoading}
          <LoaderCircle class="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        {/if}
      </div>

      <!-- Directory listing -->
      <div class="min-h-70 rounded-lg border border-border">
        {#if browseError}
          <div class="flex items-center gap-2 px-4 py-8 text-sm text-destructive">
            <CircleAlert class="h-4 w-4 shrink-0" />
            {browseError}
          </div>
        {:else if browseResult && browseResult.dirs.length === 0}
          <div class="px-4 py-8 text-center text-sm text-muted-foreground">
            {m.add_project_no_subdirectories()}
          </div>
        {:else if browseResult}
          <div class="max-h-100 overflow-y-auto">
            {#each browseResult.dirs as dir}
              <button
                type="button"
                class="flex w-full items-center gap-3 border-b border-border/30 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-muted/50"
                onclick={() => navigateTo(dir.path)}
                title={dir.path}
              >
                {#if dir.hasOpenSpec}
                  <FolderOpen class="h-5 w-5 shrink-0 text-primary" />
                {:else}
                  <Folder class="h-5 w-5 shrink-0 text-muted-foreground" />
                {/if}
                <span class="truncate text-sm">{dir.name}</span>
                {#if dir.hasOpenSpec}
                  <span class="ml-auto shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    openspec
                  </span>
                {/if}
                <ChevronRight class="ml-1 h-4 w-4 shrink-0 text-muted-foreground/50" />
              </button>
            {/each}
          </div>
        {:else}
          <div class="px-4 py-8 text-center text-sm text-muted-foreground">
            {FIXED_LABELS.common.loading}
          </div>
        {/if}
      </div>

      <!-- Select current directory -->
      <div class="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
        <Folder class="h-5 w-5 shrink-0 text-muted-foreground" />
        <code class="min-w-0 flex-1 truncate text-sm text-foreground">{browseResult?.path ?? ''}</code>
        <Button
          disabled={!browseResult?.path || loading}
          onclick={handleSelectAndAdd}
        >
          {#if loading}
            <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
          {:else}
            <FolderPlus class="mr-2 h-4 w-4" />
          {/if}
          {FIXED_LABELS.addProject.addThisDirectory}
        </Button>
      </div>

      <!-- Manual path fallback -->
      <Collapsible.Root
        open={manualEntryOpen}
        onOpenChange={(nextOpen) => {
          manualEntryOpen = nextOpen;
        }}
        class="rounded-lg border border-border/70 bg-muted/10"
      >
        <div class="px-3 py-2">
          <Collapsible.Trigger class="w-full justify-between px-0 py-0 text-xs font-medium text-muted-foreground hover:text-foreground">
            <span>{FIXED_LABELS.addProject.manualEntry}</span>
            {#if manualEntryOpen}
              <ChevronDown class="h-4 w-4" />
            {:else}
              <ChevronRight class="h-4 w-4" />
            {/if}
          </Collapsible.Trigger>
        </div>

        <Collapsible.Content class="border-t border-border/70 px-3 pb-3 pt-2">
          <form class="flex gap-2" onsubmit={handleManualAdd}>
            <input
              bind:value={manualPath}
              type="text"
              placeholder={FIXED_LABELS.addProject.manualPlaceholder}
              disabled={loading}
              class="flex h-9 w-full flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button type="submit" size="sm" disabled={!manualPath.trim() || loading}>
              <FolderPlus class="mr-1.5 h-3.5 w-3.5" />
              {FIXED_LABELS.common.add}
            </Button>
          </form>
        </Collapsible.Content>
      </Collapsible.Root>

      {#if error}
        <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <div class="flex items-center gap-2">
            <CircleAlert class="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>

          {#if showInvalidProjectGuidance}
            <p class="mt-2 text-destructive/90">
              {t(m.add_project_invalid_project_guidance)}
            </p>
          {/if}
        </div>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
