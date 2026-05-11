<script lang="ts">
  import { Clipboard } from '@lucide/svelte';
  import { CommandChip } from '$lib/components/shared/command-chip';
  import type { WorkflowCommand } from '$lib/types/commandTypes';
  import { buildCommand } from '$lib/commandShortcuts';
  import { toast } from 'svelte-sonner';
  import * as m from '$lib/paraglide/messages.js';
  import { commandPreferencesStore } from '$lib/state/commandPreferences.svelte.ts';
  import { FIXED_LABELS, getCommandShortcutCopyTitle, getWorkflowCommandLabel } from '$lib/uiText';

  interface Props {
    commands?: WorkflowCommand[];
    changeName?: string | null;
  }

  let { commands = [], changeName = null }: Props = $props();

  function commandText(command: WorkflowCommand): string {
    return buildCommand(command, commandPreferencesStore.format, changeName ?? undefined);
  }

  async function copyCommand(command: WorkflowCommand) {
    const text = commandText(command);

    try {
      await navigator.clipboard.writeText(text);
      toast.success(m.command_shortcuts_copied());
    } catch {
      toast.error(m.common_failed_to_copy());
    }
  }
</script>

{#if commands.length > 0}
  <div class="flex max-w-full flex-wrap items-center gap-1.5">
    {#each commands as command}
      {@const text = commandText(command)}
      <CommandChip
        label={getWorkflowCommandLabel(command)}
        icon={Clipboard}
        title={getCommandShortcutCopyTitle(text)}
        onclick={(event) => {
          event.stopPropagation();
          void copyCommand(command);
        }}
      />
    {/each}
  </div>
{/if}
