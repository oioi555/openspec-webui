<script lang="ts">
  import { Command, Copy, ExternalLink, Info, ListChecks, Monitor, Moon, Settings, Sparkles, Sun, Terminal, Wrench } from '@lucide/svelte';
  import { Callout } from '$lib/components/shared/callout';
  import { DialogHeader as SharedDialogHeader } from '$lib/components/shared/dialog-header';
  import { OptionCard } from '$lib/components/shared/option-card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Select from '$lib/components/ui/select';
  import { t } from '$lib/i18n';
  import { projectStore } from '$lib/state/projects.svelte.ts';
  import { LOCALE_LABELS, localeStore, type AppLocale } from '$lib/state/locale.svelte.ts';
  import * as m from '$lib/paraglide/messages.js';
  import { FIXED_LABELS, getWorkflowCommandLabel } from '$lib/uiText';
  import { copyToClipboard } from '$lib/utils';
  import { versionStatusStore } from '$lib/state/versionStatus.svelte.ts';
  import { RELEASE_PAGE_URLS, UPDATE_COMMANDS, type VersionedToolId } from '$lib/state/versionStatusCore';
  import type { ToolVersionStatus } from '$lib/types/api';
  import type { CommandFormat, WorkflowCommand } from '$lib/types/commandTypes';
  import {
    CORE_COMMANDS,
    EXPANDED_COMMANDS,
  } from '$lib/types/commandTypes';
  import {
    buildCommand,
    isExpandedCommandAvailable,
  } from '$lib/commandShortcuts';
  import { commandPreferencesStore } from '$lib/state/commandPreferences.svelte.ts';
  import { tabStore } from '$lib/state/tabs.svelte.ts';
  import { themeStore, type Theme } from '$lib/state/theme.svelte.ts';
  import { uiPreferencesStore } from '$lib/state/uiPreferences.svelte.ts';

  interface Props {
    open?: boolean;
    onClose?: () => void;
  }

  let { open = false, onClose = () => {} }: Props = $props();

  type Section = 'general' | 'workflow' | 'commands' | 'versions';

  let sections = $derived([
    {
      id: 'general' as const,
      label: FIXED_LABELS.settings.sections.general,
      icon: Settings
    },
    {
      id: 'workflow' as const,
      label: FIXED_LABELS.settings.sections.workflow,
      icon: Command
    },
    {
      id: 'commands' as const,
      label: FIXED_LABELS.settings.sections.commands,
      icon: ListChecks
    },
    {
      id: 'versions' as const,
      label: FIXED_LABELS.settings.sections.versions,
      icon: Info
    }
  ]);

  let activeSection = $state<Section>('general');

  function setFormat(format: CommandFormat) {
    commandPreferencesStore.setFormat(format);
  }

  function setTheme(theme: Theme) {
    themeStore.setTheme(theme);
  }

  function setLocale(locale: AppLocale) {
    void localeStore.setLocale(locale);
  }

  function togglePreviewTabs(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    uiPreferencesStore.setPreviewTabsEnabled(target.checked);

    if (!target.checked) {
      tabStore.confirmAllPreviewTabs();
    }
  }

  function toggleCommand(command: WorkflowCommand, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    commandPreferencesStore.setCommandVisibility(command, target.checked);
  }

  $effect(() => {
    if (open) {
      activeSection = 'general';
    }
  });

  let previewWorkspaceCommand = $derived(buildCommand('propose', commandPreferencesStore.format));
  let previewChangeCommand = $derived(buildCommand('apply', commandPreferencesStore.format, 'my-change'));
  let availabilityReady = $derived(commandPreferencesStore.availability.status === 'ready');
  let versionSnapshot = $derived(versionStatusStore.snapshot);
  function getLocaleHeadingLabel() {
    return FIXED_LABELS.settings.headings.language;
  }

  function getVersionStatusLabel(status: ToolVersionStatus) {
    if (status.notInstalled) {
      return FIXED_LABELS.settings.versions.notInstalled;
    }

    switch (status.status) {
      case 'up-to-date':
        return FIXED_LABELS.settings.versions.upToDate;
      case 'update-available':
        return FIXED_LABELS.settings.versions.updateAvailable;
      case 'unavailable':
        return FIXED_LABELS.settings.versions.unavailable;
      case 'unknown':
      default:
        return FIXED_LABELS.settings.versions.unknown;
    }
  }

  function getVersionStatusVariant(status: ToolVersionStatus): 'success' | 'warning' | 'secondary' {
    if (status.status === 'up-to-date') {
      return 'success';
    }

    if (status.status === 'update-available') {
      return 'warning';
    }

    return 'secondary';
  }

  function getReleasePageUrl(toolId: VersionedToolId) {
    return RELEASE_PAGE_URLS[toolId];
  }

  function getUpdateCommand(toolId: VersionedToolId) {
    return UPDATE_COMMANDS[toolId];
  }

  async function handleCopyCommand(command: string, label: string) {
    await copyToClipboard(command, label);
  }
</script>

<Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
  <Dialog.Overlay />
  <Dialog.Content class="max-w-3xl gap-0 p-0 xl:max-w-4xl">
    <SharedDialogHeader
      icon={Settings}
      title={FIXED_LABELS.settings.title}
      description={t(m.settings_description)}
      onClose={onClose}
    />

    <div class="flex h-[60vh] min-h-0 flex-col gap-6 overflow-hidden lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside class="shrink-0 overflow-y-auto border-b border-border px-6 pb-4 pt-5 lg:min-h-0 lg:border-b-0 lg:border-r lg:px-5 lg:pb-5 lg:pt-5">
        <div class="grid auto-rows-fr grid-cols-3 gap-2 lg:grid-cols-1">
          {#each sections as section}
            {@const SectionIcon = section.icon}
          <button
            type="button"
              class={`flex h-full w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${activeSection === section.id
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-transparent bg-secondary/50 text-card-foreground hover:border-primary/20 hover:bg-primary/5 hover:text-foreground'}`}
            aria-current={activeSection === section.id ? 'page' : undefined}
            onclick={() => (activeSection = section.id)}
          >
            <SectionIcon class="mt-0.5 h-5 w-5 shrink-0" />
            <div class="min-w-0 flex-1">
              <div class="font-medium">{section.label}</div>
            </div>
          </button>
          {/each}
        </div>
      </aside>
      
      <div class="min-h-0 min-w-0 overflow-y-auto px-6 pb-6 pt-5 lg:pr-8">
        <!-- general tab -->
        {#if activeSection === 'general'}
          <section class="space-y-3">
            <div>
              <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{FIXED_LABELS.settings.headings.theme}</h3>
              <p class="mt-1 text-sm text-muted-foreground">{t(m.settings_theme_description)}</p>
            </div>

            <div class="grid gap-3 md:grid-cols-3">
              <OptionCard
                icon={Sun}
                label={FIXED_LABELS.settings.themeOptions.light}
                selected={themeStore.value === 'light'}
                name="theme"
                value="light"
                onchange={() => setTheme('light')}
              >
                {#snippet description()}
                  {t(m.settings_theme_light_description)}
                {/snippet}
              </OptionCard>

              <OptionCard
                icon={Moon}
                label={FIXED_LABELS.settings.themeOptions.dark}
                selected={themeStore.value === 'dark'}
                name="theme"
                value="dark"
                onchange={() => setTheme('dark')}
              >
                {#snippet description()}
                  {t(m.settings_theme_dark_description)}
                {/snippet}
              </OptionCard>

              <OptionCard
                icon={Monitor}
                label={FIXED_LABELS.settings.themeOptions.system}
                selected={themeStore.value === 'system'}
                name="theme"
                value="system"
                onchange={() => setTheme('system')}
              >
                {#snippet description()}
                  {t(m.settings_theme_system_description)}
                {/snippet}
              </OptionCard>
            </div>

            <div class="space-y-3 pt-6">
              <div>
                <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{getLocaleHeadingLabel()}</h3>
              </div>
              <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-start">
                <p class="text-sm text-muted-foreground pt-1.5">{t(m.settings_language_description)}</p>
                <Select.Root value={localeStore.value} onValueChange={(v) => setLocale(v as AppLocale)}>
                  <Select.Trigger
                    class="sm:justify-self-end w-full"
                    aria-label={getLocaleHeadingLabel()}
                  >
                    {LOCALE_LABELS[localeStore.value]}
                  </Select.Trigger>
                  <Select.Content>
                    {#each localeStore.supportedLocales as locale}
                      <Select.Item value={locale}>
                        {LOCALE_LABELS[locale]}
                      </Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>
            </div>

            <div class="pt-4">
              <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{FIXED_LABELS.settings.headings.explorer}</h3>
              <p class="mt-1 text-sm text-muted-foreground">{t(m.settings_explorer_description)}</p>
            </div>

            <label class="flex items-start justify-between gap-4 rounded-lg border border-border bg-secondary/50 p-4 text-sm text-card-foreground">
              <div>
                <div class="font-medium text-foreground">{FIXED_LABELS.settings.enablePreviewTabs}</div>
                <div class="mt-1 text-muted-foreground">{t(m.settings_enable_preview_tabs_description)}</div>
              </div>

              <input
                type="checkbox"
                checked={uiPreferencesStore.previewTabsEnabled}
                aria-label={FIXED_LABELS.settings.enablePreviewTabs}
                onchange={togglePreviewTabs}
              />
            </label>
          </section>
        
        <!-- workflow tab -->
        {:else if activeSection === 'workflow'}
          <section class="space-y-3">
            <div>
              <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{FIXED_LABELS.settings.headings.workflow}</h3>
              <p class="mt-1 text-sm text-muted-foreground">{t(m.settings_workflow_description)}</p>
              <p class="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Info class="h-5 w-5 text-info" />
                {t(m.settings_docs_intro)}
                <a href="https://github.com/Fission-AI/OpenSpec/blob/main/docs/opsx.md" target="_blank" class="underline hover:text-foreground">{FIXED_LABELS.settings.docs.opsxReference}</a> ·
                <a href="https://github.com/Fission-AI/OpenSpec/blob/main/docs/supported-tools.md" target="_blank" class="underline hover:text-foreground">{FIXED_LABELS.settings.docs.supportedTools}</a>
              </p>
            </div>

            <div class="grid gap-3 md:grid-cols-3">
              <OptionCard
                icon={Terminal}
                label={FIXED_LABELS.settings.workflowFormats.standard}
                selected={commandPreferencesStore.format === 'standard'}
                name="workflow"
                value="standard"
                onchange={() => setFormat('standard')}
              >
                {#snippet description()}
                  <code class="rounded bg-background px-1.5 py-0.5 text-xs text-primary">/opsx-propose</code>
                {/snippet}
              </OptionCard>

              <OptionCard
                icon={Sparkles}
                label={FIXED_LABELS.settings.workflowFormats.claudeCode}
                selected={commandPreferencesStore.format === 'claude-code'}
                name="workflow"
                value="claude-code"
                onchange={() => setFormat('claude-code')}
              >
                {#snippet description()}
                  <code class="rounded bg-background px-1.5 py-0.5 text-xs text-primary">/opsx:propose</code>
                {/snippet}
              </OptionCard>

              <OptionCard
                icon={Wrench}
                label={FIXED_LABELS.settings.workflowFormats.skill}
                selected={commandPreferencesStore.format === 'skill'}
                name="workflow"
                value="skill"
                onchange={() => setFormat('skill')}
              >
                {#snippet description()}
                  <code class="rounded bg-background px-1.5 py-0.5 text-xs text-primary">/openspec-propose</code>
                {/snippet}
              </OptionCard>
            </div>

            <Callout variant="info">
              <div class="space-y-1 text-sm">
                <div>
                  {FIXED_LABELS.settings.workspaceCommand}: <code class="rounded bg-background px-1.5 py-0.5 text-xs text-primary">{previewWorkspaceCommand}</code>
                </div>
                <div>
                  {FIXED_LABELS.settings.changeCommand}: <code class="rounded bg-background px-1.5 py-0.5 text-xs text-primary">{previewChangeCommand}</code>
                </div>
              </div>
            </Callout>
          </section>
        
        <!-- commands tab -->
        {:else if activeSection === 'commands'}
          <section class="space-y-3">
            <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{FIXED_LABELS.settings.headings.commands}</h3>
                <p class="mt-1 text-sm text-muted-foreground">{t(m.settings_commands_description)}</p>
                <p class="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Info class="h-5 w-5 text-info" />
                  {t(m.settings_docs_intro)}
                  <a href="https://github.com/Fission-AI/OpenSpec/blob/main/docs/commands.md" target="_blank" class="underline hover:text-foreground">{FIXED_LABELS.settings.docs.commands}</a> ·
                  <a href="https://github.com/Fission-AI/OpenSpec/blob/main/docs/workflows.md" target="_blank" class="underline hover:text-foreground">{FIXED_LABELS.settings.docs.workflows}</a>
                </p>
              </div>

              <div class="text-right text-sm text-muted-foreground">
                {#if commandPreferencesStore.availabilityLoading}
                  <div>{t(m.settings_commands_checking)}</div>
                {:else if availabilityReady}
                  <div>{t(m.settings_commands_profile, { profile: commandPreferencesStore.availability.profile || t(m.settings_profile_unknown) })}</div>
                {:else}
                  <div class="text-warning">{t(m.settings_commands_unavailable)}</div>
                {/if}
              </div>
            </div>

            <div class="space-y-2">
              <div>
                <h4 class="text-sm font-semibold text-foreground">{FIXED_LABELS.settings.headings.coreCommands}</h4>
                <p class="mt-1 text-sm text-muted-foreground">{t(m.settings_core_commands_description)}</p>
              </div>

              <div class="divide-y divide-border overflow-hidden rounded-lg border border-border bg-secondary/50">
                {#each CORE_COMMANDS as command}
                  <label class="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <div>
                      <div class="font-medium text-foreground">{getWorkflowCommandLabel(command)}</div>
                      <div class="mt-1 text-xs text-muted-foreground">
                        {t(m.settings_core_commands_always_available)}
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={commandPreferencesStore.commandVisibility[command]}
                      onchange={(event) => toggleCommand(command, event)}
                    />
                  </label>
                {/each}
              </div>
            </div>

            {#if !availabilityReady}
              <Callout variant="warning">
                {t(m.settings_expanded_commands_disabled)}
                {#if commandPreferencesStore.availability.error}
                  <div class="mt-1 text-xs text-warning">{commandPreferencesStore.availability.error}</div>
                {/if}
              </Callout>
            {/if}

            <div class="space-y-2">
              <div>
                <h4 class="text-sm font-semibold text-foreground">{FIXED_LABELS.settings.headings.expandedCommands}</h4>
                <p class="mt-1 text-sm text-muted-foreground">{t(m.settings_expanded_commands_description)}</p>
              </div>

              <div class="divide-y divide-border overflow-hidden rounded-lg border border-border bg-secondary/50">
                {#each EXPANDED_COMMANDS as command}
                  {@const isAvailable = isExpandedCommandAvailable(command, commandPreferencesStore.availability)}
                  <label class="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <div>
                      <div class="font-medium text-foreground">{getWorkflowCommandLabel(command)}</div>
                      <div class="mt-1 text-xs text-muted-foreground">
                        {#if availabilityReady}
                          {#if isAvailable}
                            {t(m.settings_expanded_available)}
                          {:else}
                            {t(m.settings_expanded_unavailable)}
                          {/if}
                        {:else}
                          {t(m.settings_expanded_waiting)}
                        {/if}
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={commandPreferencesStore.commandVisibility[command]}
                      disabled={!availabilityReady || !isAvailable || commandPreferencesStore.availabilityLoading}
                      onchange={(event) => toggleCommand(command, event)}
                    />
                  </label>
                {/each}
              </div>
            </div>
          </section>
        {:else if activeSection === 'versions'}
          <section class="space-y-6">
            <div>
              <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{FIXED_LABELS.settings.headings.versions}</h3>
              <p class="mt-1 text-sm text-muted-foreground">{t(m.settings_versions_description)}</p>
            </div>

            {#if versionStatusStore.loading && !versionSnapshot}
              <Callout variant="info">{t(m.settings_versions_checking)}</Callout>
            {/if}

            {#if versionStatusStore.error}
              <Callout variant="warning">{versionStatusStore.error}</Callout>
            {/if}

            {#if versionSnapshot}
              <div class="space-y-4">
                {#each [
                  {
                    id: 'webui' as const,
                    title: FIXED_LABELS.settings.versions.webui,
                    description: t(m.settings_versions_webui_description),
                    status: versionSnapshot.tools.webui,
                  },
                  {
                    id: 'openspec' as const,
                    title: FIXED_LABELS.settings.versions.openspecCli,
                    description: t(m.settings_versions_openspec_description),
                    status: versionSnapshot.tools.openspec,
                  },
                ] as const as Array<{
                  id: VersionedToolId;
                  title: string;
                  description: string;
                  status: ToolVersionStatus;
                }> as tool}
                  <div class="rounded-lg border border-border bg-secondary/40 p-4 space-y-3">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div class="flex items-center gap-2">
                          <h4 class="font-medium text-foreground">{tool.title}</h4>
                          <Badge variant={getVersionStatusVariant(tool.status)}>{getVersionStatusLabel(tool.status)}</Badge>
                        </div>
                        <p class="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                        {#if tool.status.error}
                          <p class="mt-1 text-xs text-warning">{tool.status.error}</p>
                        {/if}
                      </div>

                      <a
                        href={getReleasePageUrl(tool.id)}
                        target="_blank"
                        rel="noreferrer"
                        class="inline-flex items-center gap-1 text-sm text-muted-foreground underline hover:text-foreground"
                      >
                        {FIXED_LABELS.settings.versions.releases}
                        <ExternalLink class="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <dl class="grid gap-3 sm:grid-cols-3">
                      <div>
                        <dt class="text-xs uppercase tracking-wide text-muted-foreground">{FIXED_LABELS.settings.versions.current}</dt>
                        <dd class="mt-1 text-sm text-foreground">{tool.status.currentVersion ?? '—'}</dd>
                      </div>
                      <div>
                        <dt class="text-xs uppercase tracking-wide text-muted-foreground">{FIXED_LABELS.settings.versions.latest}</dt>
                        <dd class="mt-1 text-sm text-foreground">{tool.status.latestVersion ?? '—'}</dd>
                      </div>
                      <div>
                        <dt class="text-xs uppercase tracking-wide text-muted-foreground">{FIXED_LABELS.settings.versions.status}</dt>
                        <dd class="mt-1 text-sm text-foreground">{getVersionStatusLabel(tool.status)}</dd>
                      </div>
                    </dl>

                    <div>
                      <div class="text-xs uppercase tracking-wide text-muted-foreground">{FIXED_LABELS.settings.versions.updateCommand}</div>
                      <div class="mt-1 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                        <code class="min-w-0 flex-1 overflow-x-auto text-xs text-primary">{getUpdateCommand(tool.id)}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                          aria-label={`${FIXED_LABELS.common.copy} ${tool.title}`}
                          onclick={() => handleCopyCommand(getUpdateCommand(tool.id), tool.title)}
                        >
                          <Copy class="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>

              <div class="rounded-lg border border-border bg-secondary/40 p-4 space-y-3">
                <div>
                  <h4 class="font-medium text-foreground">{FIXED_LABELS.settings.versions.afterUpdatingOpenSpec}</h4>
                  <p class="mt-1 text-sm text-muted-foreground">{t(m.settings_versions_post_update_description)}</p>
                </div>

                <div>
                  <div class="text-xs uppercase tracking-wide text-muted-foreground">{FIXED_LABELS.settings.versions.projectCommand}</div>
                  <div class="mt-1 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                    <code class="min-w-0 flex-1 overflow-x-auto text-xs text-primary">{UPDATE_COMMANDS.project}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={`${FIXED_LABELS.common.copy} ${FIXED_LABELS.settings.versions.projectCommand}`}
                      onclick={() => handleCopyCommand(UPDATE_COMMANDS.project, FIXED_LABELS.settings.versions.projectCommand)}
                    >
                      <Copy class="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <div class="text-xs uppercase tracking-wide text-muted-foreground">{FIXED_LABELS.settings.versions.projectsToUpdate}</div>
                  {#if projectStore.projects.length > 0}
                    <ul class="mt-2 space-y-1 text-sm text-foreground">
                      {#each projectStore.projects as project}
                        <li class="truncate" title={project.path}>{project.path}</li>
                      {/each}
                    </ul>
                  {:else}
                    <p class="mt-2 text-sm text-muted-foreground">{t(m.settings_versions_no_registered_projects)}</p>
                  {/if}
                </div>
              </div>
            {/if}
          </section>
        {/if}
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
