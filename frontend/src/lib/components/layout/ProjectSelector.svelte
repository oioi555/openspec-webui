<script lang="ts">
  import { Folder, FolderPlus, LoaderCircle, Trash2, CircleCheck } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { DialogHeader as SharedDialogHeader } from '$lib/components/shared/dialog-header';
  import { toast } from 'svelte-sonner';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';
  import { projectStore } from '$lib/state/projects.svelte.ts';
  import { layoutStore } from '$lib/state/layout.svelte.ts';
  import { FIXED_LABELS } from '$lib/uiText';

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();

  let loading = $derived(projectStore.loading);
  let error = $derived(projectStore.error);
  let projects = $derived(projectStore.projects);
  let activeProjectId = $derived(projectStore.activeProjectId);

  let confirmRemoveId = $state<string | null>(null);
  let switchingProjectId = $state<string | null>(null);

  async function handleSwitch(id: string) {
    if (id === activeProjectId || loading || switchingProjectId) return;

    switchingProjectId = id;
    try {
      await projectStore.bindProject(id);
      onClose();
    } catch {
      toast.error(error ?? t(m.error_failed_to_switch_project));
    } finally {
      switchingProjectId = null;
    }
  }

  async function handleRemove(id: string) {
    if (loading) return;
    try {
      await projectStore.removeProject(id);
      confirmRemoveId = null;
    } catch {
      // Error handled
    }
  }

  function openAddProject() {
    onClose();
    layoutStore.openOverlay('add-project');
  }
</script>

<Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
  <Dialog.Overlay />
  <Dialog.Content class="max-h-[60vh] max-w-xl gap-0 p-0">
    <SharedDialogHeader
      icon={Folder}
      title={FIXED_LABELS.projectSelector.title}
      description={t(m.project_selector_description)}
      onClose={onClose}
    />

    <div class="flex flex-col gap-4 px-6 py-4">
      {#if projects.length > 0}
        <div class="flex flex-col gap-2">
          <h3 class="text-sm font-medium text-muted-foreground">{FIXED_LABELS.projectSelector.yourProjects}</h3>
          <div class="max-h-80 overflow-y-auto rounded-lg border border-border">
            {#each projects as project}
              <div
                class="group flex items-center justify-between gap-3 border-b border-border/50 p-3 last:border-0 hover:bg-muted/50 transition-colors"
              >
                <button
                  type="button"
                  class="flex flex-1 items-start gap-3 text-left overflow-hidden"
                  onclick={() => handleSwitch(project.id)}
                  disabled={loading || Boolean(switchingProjectId)}
                >
                  <div class="mt-0.5 shrink-0 text-muted-foreground">
                    {#if switchingProjectId === project.id}
                      <LoaderCircle class="h-5 w-5 animate-spin text-primary" />
                    {:else}
                      <Folder class="h-5 w-5" />
                    {/if}
                  </div>
                  <div class="flex flex-col min-w-0 flex-1">
                    <span class="font-medium truncate text-sm flex items-center gap-2">
                      {project.label}
                      {#if switchingProjectId === project.id}
                        <span class="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {FIXED_LABELS.projectSelector.switching}
                        </span>
                      {/if}
                      {#if project.id === activeProjectId}
                        <span class="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          <CircleCheck class="mr-1 h-3 w-3" />
                          {FIXED_LABELS.common.active}
                        </span>
                      {/if}
                    </span>
                    <span class="truncate text-xs text-muted-foreground" title={project.path}>
                      {project.path}
                    </span>
                  </div>
                </button>

                <div class="flex shrink-0 items-center">
                  {#if confirmRemoveId === project.id}
                    <div class="flex items-center gap-2 bg-destructive/10 rounded-md p-1 border border-destructive/20">
                      <span class="text-xs text-destructive font-medium px-2">{FIXED_LABELS.projectSelector.removeConfirm}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-7 px-2 text-xs hover:bg-destructive hover:text-destructive-foreground"
                        onclick={() => handleRemove(project.id)}
                        disabled={loading || Boolean(switchingProjectId)}
                      >
                        {FIXED_LABELS.common.yes}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-7 px-2 text-xs"
                        onclick={() => confirmRemoveId = null}
                        disabled={loading || Boolean(switchingProjectId)}
                      >
                        {FIXED_LABELS.common.cancel}
                      </Button>
                    </div>
                  {:else}
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                      onclick={() => confirmRemoveId = project.id}
                      disabled={loading || Boolean(switchingProjectId)}
                      title={FIXED_LABELS.projectSelector.removeProject}
                    >
                      <Trash2 class="h-4 w-4" />
                      <span class="sr-only">{FIXED_LABELS.common.remove}</span>
                    </Button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="py-6 text-center text-sm text-muted-foreground">
          {t(m.project_selector_no_projects)}
        </div>
      {/if}

      <Button
        variant="outline"
        class="w-full"
        onclick={openAddProject}
        disabled={loading}
      >
        <FolderPlus class="mr-2 h-4 w-4" />
        {FIXED_LABELS.projectSelector.addNewProject}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
