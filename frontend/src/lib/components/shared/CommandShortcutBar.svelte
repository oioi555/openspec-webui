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
    buildDetectedToolChoices,
    buildUndetectedToolChoices,
    buildToolChoices,
    type ToolChoice,
  } from '$lib/toolChoices';

  interface Props {
    commands?: WorkflowCommand[];
    changeName?: string | null;
  }

  let { commands = [], changeName = null }: Props = $props();

  /** Track which command's "Other tool" submenu is open. */
  let otherToolOpenFor = $state<WorkflowCommand | null>(null);
  /** Custom text input for "Other tool". */
  let customText = $state('');

  function getDetectedChoices(command: WorkflowCommand): ToolChoice[] {
    const { integrations, toolOptions } = commandPreferencesStore.availability;
    return buildDetectedToolChoices(integrations, toolOptions, command, changeName ?? undefined);
  }

  function getAllChoices(command: WorkflowCommand): ToolChoice[] {
    const { integrations, toolOptions } = commandPreferencesStore.availability;
    return buildToolChoices(toolOptions, integrations, command, changeName ?? undefined);
  }

  function getUndetectedChoices(command: WorkflowCommand): ToolChoice[] {
    const { integrations, toolOptions } = commandPreferencesStore.availability;
    return buildUndetectedToolChoices(integrations, toolOptions, command, changeName ?? undefined);
  }

  /**
   * Resolve choices for a command:
   * - detected > 0 → use detected choices
   * - detected === 0 → use all toolOptions (with fallback catalog)
   *
   * buildToolChoices guarantees at least 6 choices even when the API
   * returns empty toolOptions (stale cache / server error).
   */
  function resolveChoices(command: WorkflowCommand): ToolChoice[] {
    const detected = getDetectedChoices(command);
    if (detected.length > 0) {
      return detected;
    }
    return getAllChoices(command);
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(m.command_shortcuts_copied());
    } catch {
      toast.error(m.common_failed_to_copy());
    }
  }

  /** Stop propagation on interactive elements to prevent dashboard card navigation. */
  function stopPropagation(event: Event) {
    event.stopPropagation();
  }
</script>

{#if commands.length > 0}
  <div class="flex max-w-full flex-wrap items-center gap-1.5">
    {#each commands as command (command)}
      {@const choices = resolveChoices(command)}
      {@const label = getWorkflowLabel(command)}

      {#if choices.length <= 1}
        <!-- Single tool choice (or fallback): direct copy on click -->
        <CommandChip
          {label}
          icon={Clipboard}
          title={choices.length === 1 ? getCommandShortcutCopyTitle(choices[0].text) : `Copy ${label}`}
          onclick={(event) => {
            event.stopPropagation();
            if (choices.length === 1) {
              void copyText(choices[0].text);
            }
          }}
        />
      {:else}
        <!-- Multiple tool choices: "Choose tool" dropdown -->
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
              Choose tool
            </DropdownMenu.Label>

            {#each choices as choice (choice.key)}
              <DropdownMenu.Item
                onSelect={() => {
                  void copyText(choice.text);
                }}
              >
                <div class="flex w-full items-center justify-between gap-3 overflow-hidden">
                  <span class="shrink-0 text-xs font-medium">{choice.tool}</span>
                  <span class="min-w-0 truncate text-[10px] text-muted-foreground">{choice.text}</span>
                </div>
              </DropdownMenu.Item>
            {/each}

            {@const undetected = getUndetectedChoices(command)}
            <!-- "Other tool…" always available for undetected tools and custom commands -->
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              closeOnSelect={false}
              onSelect={() => {
                otherToolOpenFor = otherToolOpenFor === command ? null : command;
              }}
            >
              <span class="text-xs text-muted-foreground">Other tool…</span>
            </DropdownMenu.Item>

            {#if otherToolOpenFor === command}
              {#each undetected as choice (choice.key)}
                <DropdownMenu.Item
                  inset
                  onSelect={() => {
                    void copyText(choice.text);
                  }}
                >
                  <div class="flex w-full items-center justify-between gap-3 overflow-hidden">
                    <span class="shrink-0 text-xs font-medium">{choice.tool}</span>
                    <span class="min-w-0 truncate text-[10px] text-muted-foreground">{choice.text}</span>
                  </div>
                </DropdownMenu.Item>
              {/each}

              <DropdownMenu.Separator />
              <div class="px-2 py-1.5" role="presentation">
                <label class="mb-1 block text-[10px] text-muted-foreground" for="custom-command-input-{command}">
                  Custom command
                </label>
                <div class="flex items-center gap-1.5">
                  <input
                    id="custom-command-input-{command}"
                    type="text"
                    placeholder="/my-tool:propose"
                    value={customText}
                    oninput={(e) => { customText = e.currentTarget.value; }}
                    onkeydown={(e) => {
                      if (e.key === 'Enter' && customText.trim()) {
                        e.preventDefault();
                        e.stopPropagation();
                        void copyText(customText.trim());
                        customText = '';
                        otherToolOpenFor = null;
                      }
                    }}
                    onclick={stopPropagation}
                    onpointerdown={stopPropagation}
                    class="flex h-7 w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    class="inline-flex h-7 shrink-0 items-center rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                    disabled={!customText.trim()}
                    onclick={(e) => {
                      e.stopPropagation();
                      if (customText.trim()) {
                        void copyText(customText.trim());
                        customText = '';
                        otherToolOpenFor = null;
                      }
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            {/if}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    {/each}
  </div>
{/if}
