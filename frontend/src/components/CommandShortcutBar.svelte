<script lang="ts">
  import { Clipboard } from '@lucide/svelte';
  import { CommandChip } from '$lib/components/ui/command-chip';
  import type { WorkflowCommand } from '../lib/commandTypes';
  import { buildCommand } from '../lib/commandShortcuts';
  import { addToast } from '../stores/index.svelte.ts';
  import { commandPreferencesStore } from '../stores/commandPreferences.svelte.ts';

  interface Props {
    commands?: WorkflowCommand[];
    changeName?: string | null;
  }

  let { commands = [], changeName = null }: Props = $props();

  function commandText(command: WorkflowCommand) {
    return buildCommand(command, commandPreferencesStore.aiTool, changeName ?? undefined);
  }

  async function copyCommand(command: WorkflowCommand) {
    const text = commandText(command);

    try {
      await navigator.clipboard.writeText(text);
      addToast('Copied to clipboard!', 'success');
    } catch {
      addToast('Failed to copy', 'error');
    }
  }
</script>

{#if commands.length > 0}
  <div class="flex max-w-full flex-wrap items-center gap-1.5">
    {#each commands as command}
      <CommandChip
        label={command}
        icon={Clipboard}
        title={`Copy ${commandText(command)}`}
        onclick={() => copyCommand(command)}
      />
    {/each}
  </div>
{/if}
