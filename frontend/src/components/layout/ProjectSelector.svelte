<script lang="ts">
  import { Folder, FolderPlus, Loader2, Trash2, CheckCircle2 } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { DialogHeader as SharedDialogHeader } from '$lib/components/ui/dialog-header';
  import { toast } from 'svelte-sonner';
  import { projectStore } from '../../stores/projects.svelte.ts';
  import { layoutStore } from '../../stores/layout.svelte.ts';

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
      toast.error(error ?? 'Failed to switch project');
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
  <Dialog.Content class="max-w-md gap-0 p-0">
    <SharedDialogHeader
      icon={Folder}
      title="Project Selector"
      description="Switch to a different project or add a new one."
      onClose={onClose}
    />

    <div class="flex flex-col gap-4 px-6 py-4">
      {#if projects.length > 0}
        <div class="flex flex-col gap-2">
          <h3 class="text-sm font-medium text-muted-foreground">Your Projects</h3>
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
                      <Loader2 class="h-5 w-5 animate-spin text-primary" />
                    {:else}
                      <Folder class="h-5 w-5" />
                    {/if}
                  </div>
                  <div class="flex flex-col min-w-0 flex-1">
                    <span class="font-medium truncate text-sm flex items-center gap-2">
                      {project.label}
                      {#if switchingProjectId === project.id}
                        <span class="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          Switching...
                        </span>
                      {/if}
                      {#if project.id === activeProjectId}
                        <span class="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          <CheckCircle2 class="mr-1 h-3 w-3" />
                          Active
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
                      <span class="text-xs text-destructive font-medium px-2">Remove?</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-7 px-2 text-xs hover:bg-destructive hover:text-destructive-foreground"
                        onclick={() => handleRemove(project.id)}
                        disabled={loading || Boolean(switchingProjectId)}
                      >
                        Yes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-7 px-2 text-xs"
                        onclick={() => confirmRemoveId = null}
                         disabled={loading || Boolean(switchingProjectId)}
                       >
                        Cancel
                      </Button>
                    </div>
                  {:else}
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                      onclick={() => confirmRemoveId = project.id}
                       disabled={loading || Boolean(switchingProjectId)}
                       title="Remove project"
                     >
                      <Trash2 class="h-4 w-4" />
                      <span class="sr-only">Remove</span>
                    </Button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="py-6 text-center text-sm text-muted-foreground">
          No projects added yet.
        </div>
      {/if}

      <Button
        variant="outline"
        class="w-full"
        onclick={openAddProject}
        disabled={loading}
      >
        <FolderPlus class="mr-2 h-4 w-4" />
        Add New Project
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
