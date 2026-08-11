<script lang="ts">
  import { Clipboard, ChevronDown } from '@lucide/svelte';
  import { CommandChip } from '$lib/components/shared/command-chip';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import type { WorkflowCommand } from '$lib/types/commandTypes';
  import { getWorkflowLabel } from '$lib/workflowMetadata';
  import { toast } from 'svelte-sonner';
  import * as m from '$lib/paraglide/messages.js';
  import { commandPreferencesStore } from '$lib/state/commandPreferences.svelte.ts';
  import { getCommandShortcutCopyTitle } from '$lib/uiText';
  import {
    buildGroupedToolChoices,
    type ToolChoice,
  } from '$lib/toolChoices';

  interface Props {
    commands?: WorkflowCommand[];
    changeName?: string | null;
  }

  let { commands = [], changeName = null }: Props = $props();

  function getChoices(command: WorkflowCommand): ToolChoice[] {
    const { integrations } = commandPreferencesStore.availability;
    return buildGroupedToolChoices(integrations, command, { changeName: changeName ?? undefined });
  }

  /** Strip the trailing change-name suffix for menu preview display only. */
  function stripChangeName(text: string): string {
    if (!changeName) return text;
    const suffix = ` ${changeName}`;
    return text.endsWith(suffix) ? text.slice(0, -suffix.length) : text;
  }

  async function copyText(text: string) {
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
    {#each commands as command (command)}
      {@const choices = getChoices(command)}
      {@const label = getWorkflowLabel(command)}

      {#if choices.length === 0}
        <!-- Zero candidates: skip this chip entirely -->
      {:else if choices.length === 1}
        <!-- Single group: direct copy on click -->
        <CommandChip
          {label}
          icon={Clipboard}
          title={getCommandShortcutCopyTitle(choices[0].text)}
          onclick={(event) => {
            event.stopPropagation();
            void copyText(choices[0].text);
          }}
        />
      {:else}
        <!-- Multiple groups: dropdown to choose command text -->
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent-border bg-accent-bg px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Clipboard class="h-3.5 w-3.5" />
            <span class="leading-none">{label}</span>
            <ChevronDown class="h-3 w-3 opacity-60" />
          </DropdownMenu.Trigger>

          <DropdownMenu.Content
            side="bottom"
            align="start"
            class="min-w-60 max-w-96"
          >
            <DropdownMenu.Label class="text-xs text-muted-foreground">
              Choose command
            </DropdownMenu.Label>

            {#each choices as choice (choice.key)}
              {@const toolsLabel = choice.tools.join(', ')}
              <DropdownMenu.Item
                onSelect={() => {
                  void copyText(choice.text);
                }}
              >
                <div class="flex w-full items-center justify-between gap-3 overflow-hidden">
                  <span class="min-w-0 truncate text-xs font-medium" title={toolsLabel}>{toolsLabel}</span>
                  <span class="shrink-0 truncate text-[10px] text-muted-foreground">{stripChangeName(choice.text)}</span>
                </div>
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    {/each}
  </div>
{/if}
