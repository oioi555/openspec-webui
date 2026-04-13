<script lang="ts">
  import { FolderPlus, Loader2, Folder, Trash2, CheckCircle2, AlertCircle } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { toast } from 'svelte-sonner';
  import { projectStore } from '../../stores/projects.svelte.ts';
  import { layoutStore } from '../../stores/layout.svelte.ts';

  let path = $state('');
  let loading = $derived(projectStore.loading);
  let error = $derived(projectStore.error);
  let projects = $derived(projectStore.projects);
  let activeProjectId = $derived(projectStore.activeProjectId);

  let confirmRemoveId = $state<string | null>(null);
  let switchingProjectId = $state<string | null>(null);

  async function handleAdd(e: Event) {
    e.preventDefault();
    if (!path.trim() || loading) return;
    
    try {
      await projectStore.addProject(path.trim());
      path = '';
    } catch (e) {
      // Error handled by store
    }
  }

  async function handleSwitch(id: string) {
    if (id === activeProjectId || loading || switchingProjectId) return;

    switchingProjectId = id;
    try {
      await projectStore.switchProject(id);
      layoutStore.closeOverlay();
    } catch (e) {
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
    } catch (e) {
      // Error handled
    }
  }
</script>

<Dialog.Header>
  <Dialog.Title>Project Selector</Dialog.Title>
  <Dialog.Description>Select a project to work on or add a new one.</Dialog.Description>
</Dialog.Header>

<div class="flex flex-col gap-6 py-4">
  {#if projects.length > 0}
    <div class="flex flex-col gap-2">
      <h3 class="text-sm font-medium text-muted-foreground">Available Projects</h3>
      <div class="max-h-75 overflow-y-auto rounded-lg border border-border">
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
  {/if}

  <div class="flex flex-col gap-2">
    <h3 class="text-sm font-medium text-muted-foreground">Add New Project</h3>
    <form class="flex flex-col gap-3" onsubmit={handleAdd}>
      <div class="flex gap-2">
        <input 
          bind:value={path}
          type="text"
          placeholder="/absolute/path/to/project" 
          disabled={loading || Boolean(switchingProjectId)}
          class="flex h-10 w-full flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button type="submit" disabled={!path.trim() || loading || Boolean(switchingProjectId)}>
          {#if loading && !switchingProjectId}
            <Loader2 class="h-4 w-4 animate-spin" />
          {:else}
            <FolderPlus class="h-4 w-4" />
          {/if}
          <span class="sr-only">Add</span>
        </Button>
      </div>
      
      {#if error}
        <div class="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <AlertCircle class="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      {/if}
    </form>
  </div>
</div>

<Dialog.Footer>
  <Button variant="outline" onclick={() => layoutStore.closeOverlay()}>Close</Button>
</Dialog.Footer>
