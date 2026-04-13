<script lang="ts">
  import { FileArchive, FolderPlus, Loader2 } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { projectStore } from '../stores/projects.svelte.ts';

  let path = $state('');
  let loading = $derived(projectStore.loading);
  let error = $derived(projectStore.error);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!path.trim() || loading) return;
    
    try {
      await projectStore.addProject(path.trim());
      path = '';
    } catch (e) {
      // Error is handled by store and displayed via {error}
    }
  }
</script>

<div class="flex h-full w-full items-center justify-center bg-background p-4 text-center">
  <div class="flex max-w-md flex-col items-center gap-6">
    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <FileArchive class="h-8 w-8" />
    </div>

    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-bold tracking-tight">No Active Project</h2>
      <p class="text-muted-foreground">
        OpenSpec requires a project to store specifications and changes.
        Enter the absolute path to a project directory containing an <code>openspec/</code> folder.
      </p>
    </div>

    <form class="flex w-full flex-col gap-3" onsubmit={handleSubmit}>
      <div class="flex w-full gap-2">
        <input 
          bind:value={path}
          type="text"
          placeholder="/absolute/path/to/project" 
          disabled={loading}
          class="flex h-10 w-full flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button type="submit" disabled={!path.trim() || loading}>
          {#if loading}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Adding...
          {:else}
            <FolderPlus class="mr-2 h-4 w-4" />
            Add Project
          {/if}
        </Button>
      </div>
      
      {#if error}
        <div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive text-left">
          {error}
        </div>
      {/if}
    </form>
  </div>
</div>
