<script lang="ts">
  import { Clipboard } from '@lucide/svelte';
  import type { WorkflowCommand } from '../lib/commandTypes';
  import { buildCommand } from '../lib/commandShortcuts';
  import { addToast } from '../stores/index.svelte.ts';
  import { commandPreferencesStore } from '../stores/commandPreferences.svelte.ts';

  interface Props {
    commands?: WorkflowCommand[];
    changeName?: string | null;
  }

  let { commands = [], changeName = null }: Props = $props();

  async function copyCommand(command: WorkflowCommand) {
    const text = buildCommand(command, commandPreferencesStore.aiTool, changeName ?? undefined);

    try {
      await navigator.clipboard.writeText(text);
      addToast('Copied to clipboard!', 'success');
    } catch {
      addToast('Failed to copy', 'error');
    }
  }
</script>

{#if commands.length > 0}
  <div class="flex flex-wrap gap-2">
    {#each commands as command}
      <button
        type="button"
        class="flex items-center-safe gap-2 px-3 p-1.5 rounded-lg transition-colors
              bg-success-bg text-success hover:bg-success-border"
        title={`Copy ${buildCommand(command, commandPreferencesStore.aiTool, changeName ?? undefined)}`}
        onclick={() => copyCommand(command)}
      >
        <Clipboard class="h-4 w-4 text-success" />
        <span class="text-sm">{command}</span>
      </button>
    {/each}
  </div>
{/if}
