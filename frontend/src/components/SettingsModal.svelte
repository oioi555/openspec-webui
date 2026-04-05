<script lang="ts">
  import type { ExpandedCommand, AiTool } from '../lib/commandTypes';
  import { EXPANDED_COMMANDS, EXPANDED_COMMAND_LABELS } from '../lib/commandTypes';
  import { buildCommand, isExpandedCommandAvailable } from '../lib/commandShortcuts';
  import { commandPreferencesStore } from '../stores/commandPreferences.svelte.ts';
  import { themeStore, type Theme } from '../stores/theme.svelte.ts';
  import Modal from './Modal.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    open?: boolean;
    onClose?: () => void;
  }

  let { open = false, onClose = () => {} }: Props = $props();

  type Section = 'general' | 'ai-tool' | 'expanded-commands';

  const sections: Array<{
    id: Section;
    label: string;
    icon: 'gear' | 'command-line' | 'list-check';
  }> = [
    {
      id: 'general',
      label: 'General',
      icon: 'gear'
    },
    {
      id: 'ai-tool',
      label: 'AI Tool',
      icon: 'command-line'
    },
    {
      id: 'expanded-commands',
      label: 'Commands',
      icon: 'list-check'
    }
  ];

  let activeSection = $state<Section>('general');

  function setAiTool(aiTool: AiTool) {
    commandPreferencesStore.setAiTool(aiTool);
  }

  function setTheme(theme: Theme) {
    themeStore.setTheme(theme);
  }

  function toggleCommand(command: ExpandedCommand, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    commandPreferencesStore.setExpandedVisibility(command, target.checked);
  }

  $effect(() => {
    if (open) {
      activeSection = 'general';
    }
  });

  let previewCommand = $derived(buildCommand('propose', commandPreferencesStore.aiTool));
  let availabilityReady = $derived(commandPreferencesStore.availability.status === 'ready');
</script>

<Modal
  {open}
  title="Settings"
  titleIcon="gear"
  size="lg"
  fixedHeight={true}
  bodyClass="min-h-0 overflow-hidden"
  {onClose}
>
  <div class="flex h-full min-h-0 flex-col gap-6 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
    <aside class="shrink-0 overflow-y-auto border-b border-border pb-4 lg:min-h-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
      <div class="grid auto-rows-fr grid-cols-3 gap-2 lg:grid-cols-1">
        {#each sections as section}
          <button
            type="button"
            class={`flex h-full w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${activeSection === section.id
              ? 'border-brand bg-info-bg text-on-bg'
              : 'border-transparent bg-surface-alt/50 text-on-surface hover:border-border hover:bg-surface'}`}
            aria-current={activeSection === section.id ? 'page' : undefined}
            onclick={() => (activeSection = section.id)}
          >
            <Icon name={section.icon} class="mt-0.5 h-5 w-5 shrink-0" />
            <div class="min-w-0 flex-1">
              <div class="font-medium">{section.label}</div>
            </div>
          </button>
        {/each}
      </div>
    </aside>

    <div class="min-h-0 min-w-0 overflow-y-auto pr-2">
      {#if activeSection === 'general'}
        <section class="space-y-3">
          <div>
            <h3 class="text-sm font-semibold uppercase tracking-wide text-on-surface-muted">Theme</h3>
            <p class="mt-1 text-sm text-on-surface-muted">Choose the color theme for the interface.</p>
          </div>

          <div class="grid gap-3 md:grid-cols-3">
            <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface-alt/50 p-4 text-sm text-on-surface">
              <input
                type="radio"
                name="theme"
                class="mt-1"
                checked={themeStore.value === 'light'}
                onchange={() => setTheme('light')}
              />
              <div>
                <div class="font-medium text-on-bg">Light</div>
                <div class="mt-1 text-on-surface-muted">Light background with dark text.</div>
              </div>
            </label>

            <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface-alt/50 p-4 text-sm text-on-surface">
              <input
                type="radio"
                name="theme"
                class="mt-1"
                checked={themeStore.value === 'dark'}
                onchange={() => setTheme('dark')}
              />
              <div>
                <div class="font-medium text-on-bg">Dark</div>
                <div class="mt-1 text-on-surface-muted">Dark background with light text.</div>
              </div>
            </label>

            <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface-alt/50 p-4 text-sm text-on-surface">
              <input
                type="radio"
                name="theme"
                class="mt-1"
                checked={themeStore.value === 'system'}
                onchange={() => setTheme('system')}
              />
              <div>
                <div class="font-medium text-on-bg">System</div>
                <div class="mt-1 text-on-surface-muted">Follow your operating system setting.</div>
              </div>
            </label>
          </div>
        </section>
      {:else if activeSection === 'ai-tool'}
        <section class="space-y-3">
          <div>
            <h3 class="text-sm font-semibold uppercase tracking-wide text-on-surface-muted">AI Tool</h3>
            <p class="mt-1 text-sm text-on-surface-muted">The selected tool controls whether copied commands use `/opsx-*` or `/opsx:*` syntax.</p>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface-alt/50 p-4 text-sm text-on-surface">
              <input
                type="radio"
                name="ai-tool"
                class="mt-1"
                checked={commandPreferencesStore.aiTool === 'default'}
                onchange={() => setAiTool('default')}
              />
              <div>
                <div class="font-medium text-on-bg">Default</div>
                <div class="mt-1 text-on-surface-muted">Uses workspace-friendly commands like <code class="rounded bg-surface-alt px-1.5 py-0.5 text-xs text-brand-hover">/opsx-propose</code>.</div>
              </div>
            </label>

            <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface-alt/50 p-4 text-sm text-on-surface">
              <input
                type="radio"
                name="ai-tool"
                class="mt-1"
                checked={commandPreferencesStore.aiTool === 'claude-code'}
                onchange={() => setAiTool('claude-code')}
              />
              <div>
                <div class="font-medium text-on-bg">Claude Code</div>
                <div class="mt-1 text-on-surface-muted">Uses Claude-style commands like <code class="rounded bg-surface-alt px-1.5 py-0.5 text-xs text-brand-hover">/opsx:propose</code>.</div>
              </div>
            </label>
          </div>

          <div class="rounded-lg border border-info-border bg-info-bg px-4 py-3 text-sm text-info">
            Preview: <code class="rounded bg-surface-alt px-1.5 py-0.5 text-xs text-brand-hover">{previewCommand}</code>
          </div>
        </section>
      {:else if activeSection === 'expanded-commands'}
        <section class="space-y-3">
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 class="text-sm font-semibold uppercase tracking-wide text-on-surface-muted">Expanded Commands</h3>
              <p class="mt-1 text-sm text-on-surface-muted">Core commands (`propose`, `explore`, `apply`, `archive`) are always shown when their page context applies.</p>
            </div>

            <div class="text-right text-sm text-on-surface-muted">
              {#if commandPreferencesStore.availabilityLoading}
                <div>Checking local OpenSpec workflows...</div>
              {:else if availabilityReady}
                <div>Local profile: <span class="font-medium text-on-surface">{commandPreferencesStore.availability.profile || 'unknown'}</span></div>
              {:else}
                <div class="text-warning">Workflow availability unavailable</div>
              {/if}
            </div>
          </div>

          {#if !availabilityReady}
            <div class="rounded-lg border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning">
              Expanded command availability could not be loaded from the local OpenSpec CLI, so these controls are disabled.
              {#if commandPreferencesStore.availability.error}
                <div class="mt-1 text-xs text-warning">{commandPreferencesStore.availability.error}</div>
              {/if}
            </div>
          {/if}

          <div class="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface-alt/50">
            {#each EXPANDED_COMMANDS as command}
              {@const isAvailable = isExpandedCommandAvailable(command, commandPreferencesStore.availability)}
              <label class="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <div class="font-medium text-on-bg">{EXPANDED_COMMAND_LABELS[command]}</div>
                  <div class="mt-1 text-xs text-on-surface-muted">
                    {#if availabilityReady}
                      {#if isAvailable}
                        Available from the local OpenSpec workflows.
                      {:else}
                        Not available from the local OpenSpec workflows.
                      {/if}
                    {:else}
                      Waiting for workflow availability.
                    {/if}
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={commandPreferencesStore.expandedVisibility[command]}
                  disabled={!availabilityReady || !isAvailable || commandPreferencesStore.availabilityLoading}
                  onchange={(event) => toggleCommand(command, event)}
                />
              </label>
            {/each}
          </div>
        </section>
      {/if}

    </div>
  </div>
</Modal>
