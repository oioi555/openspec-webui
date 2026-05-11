<script lang="ts">
  import { Command, Copy, ExternalLink, FlaskConical, Info, ListChecks, Monitor, Moon, RefreshCw, Settings, Sparkles, Sun, Terminal, Wrench } from '@lucide/svelte';
  import { Callout } from '$lib/components/shared/callout';
  import { OptionCard } from '$lib/components/shared/option-card';
  import { InsetPanel, SectionHeader, SurfaceCard } from '$lib/components/shared/surface';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Select from '$lib/components/ui/select';
  import { t } from '$lib/i18n';
  import {
    OPENSPEC_COMMANDS_DOCS_URL,
    OPENSPEC_OPSX_REFERENCE_DOCS_URL,
    OPENSPEC_SUPPORTED_TOOLS_DOCS_URL,
    OPENSPEC_WORKFLOWS_DOCS_URL,
  } from '$lib/openspecDocs';
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
  import { validationPreferencesStore } from '$lib/state/validationPreferences.svelte.ts';

  type Section = 'general' | 'workflow' | 'commands' | 'validation' | 'versions';

  interface Props {
    initialSection?: Section;
    requestKey?: number;
  }

  let { initialSection = 'general', requestKey = 0 }: Props = $props();

  const SECTION_IDS: Record<Section, string> = {
    general: 'settings-general',
    workflow: 'settings-workflow',
    commands: 'settings-commands',
    validation: 'settings-validation',
    versions: 'settings-versions',
  };

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
      id: 'validation' as const,
      label: FIXED_LABELS.settings.sections.validation,
      icon: FlaskConical
    },
    {
      id: 'versions' as const,
      label: FIXED_LABELS.settings.sections.versions,
      icon: Info
    }
  ]);

  let activeSection = $state<Section>('general');
  let contentEl: HTMLDivElement | undefined = $state();

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

  let validationConcurrencyInput = $state<string>(
    validationPreferencesStore.concurrency !== null
      ? String(validationPreferencesStore.concurrency)
      : ''
  );

  let validationCommandPreview = $derived.by(() => {
    const parts = ['openspec validate --all'];
    if (validationPreferencesStore.strict) {
      parts.push('--strict');
    }
    if (validationPreferencesStore.concurrency !== null) {
      parts.push(`--concurrency ${validationPreferencesStore.concurrency}`);
    }
    parts.push('--json');
    return parts.join(' ');
  });

  function toggleValidationStrict(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    validationPreferencesStore.setStrict(target.checked);
  }

  function toggleValidationAutoRun(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    validationPreferencesStore.setAutoRun(target.checked);
  }

  function handleValidationConcurrencyInput(value: string) {
    validationConcurrencyInput = value;
    const parsed = parseInt(value, 10);
    if (value.trim() === '' || Number.isNaN(parsed) || parsed < 1) {
      validationPreferencesStore.setConcurrency(null);
      return;
    }

    validationPreferencesStore.setConcurrency(parsed);
  }

  let previewWorkspaceCommand = $derived(buildCommand('propose', commandPreferencesStore.format));
  let previewChangeCommand = $derived(buildCommand('apply', commandPreferencesStore.format, 'my-change'));
  let availabilityReady = $derived(commandPreferencesStore.availability.status === 'ready');
  let versionSnapshot = $derived(versionStatusStore.snapshot);

  let checkedAtLabel = $derived.by(() => {
    const iso = versionSnapshot?.checkedAt ?? null;
    if (!iso) return t(m.settings_versions_never_checked);
    return t(m.settings_versions_last_checked, { time: new Date(iso).toLocaleString() });
  });

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

  // Track active section via IntersectionObserver
  $effect(() => {
    if (!contentEl) return;

    const sectionEls = contentEl.querySelectorAll('[data-settings-section]');

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.settingsSection as Section;
            if (id) activeSection = id;
          }
        }
      },
      { root: contentEl, rootMargin: '0px 0px -70% 0px', threshold: 0 }
    );

    for (const el of sectionEls) {
      obs.observe(el);
    }

    return () => obs.disconnect();
  });

  // Scroll to requested section once per request key
  $effect(() => {
    if (!contentEl || !requestKey) return;

    const section = initialSection;
    const target = contentEl.querySelector(`#${SECTION_IDS[section]}`) as HTMLElement | null;
    if (target) {
      activeSection = section;
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        tabStore.setViewerState(tabStore.activeTab.id, { initialSection: section });
      });
    }
  });

  function scrollToSection(sectionId: Section) {
    activeSection = sectionId;
    if (!contentEl) return;
    const target = contentEl.querySelector(`#${SECTION_IDS[sectionId]}`) as HTMLElement | null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
</script>

<div class="flex h-full min-h-0 flex-col lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
  <aside class="shrink-0 overflow-x-auto border-b border-border px-4 py-4 lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-5 lg:py-5">
    <nav class="flex gap-2 lg:flex-col">
      {#each sections as section}
        {@const SectionIcon = section.icon}
        <button
          type="button"
          class={`flex shrink-0 items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${activeSection === section.id
            ? 'border-primary bg-primary/10 text-foreground'
            : 'border-transparent bg-secondary/50 text-card-foreground hover:border-primary/20 hover:bg-primary/5 hover:text-foreground'}`}
          aria-current={activeSection === section.id ? 'page' : undefined}
          onclick={() => scrollToSection(section.id)}
        >
          <SectionIcon class="mt-0.5 h-5 w-5 shrink-0" />
          <div class="min-w-0 flex-1">
            <div class="whitespace-nowrap font-medium">{section.label}</div>
          </div>
        </button>
      {/each}
    </nav>
  </aside>

  <div bind:this={contentEl} class="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 lg:px-6">
    <!-- general section -->
    <SurfaceCard id="settings-general" data-settings-section="general">
      <SectionHeader>
        <h2 class="text-lg font-semibold text-foreground">{FIXED_LABELS.settings.sections.general}</h2>
      </SectionHeader>

      <div class="space-y-6 p-4">
        <div>
          <h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{FIXED_LABELS.settings.headings.theme}</h2>
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

        <div class="space-y-3">
          <div>
            <h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{getLocaleHeadingLabel()}</h2>
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

        <div>
          <h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{FIXED_LABELS.settings.headings.explorer}</h2>
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
      </div>
    </SurfaceCard>

    <!-- workflow section -->
    <SurfaceCard id="settings-workflow" data-settings-section="workflow">
      <SectionHeader>
        <h2 class="text-lg font-semibold text-foreground">{FIXED_LABELS.settings.sections.workflow}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{t(m.settings_workflow_description)}</p>
      </SectionHeader>

      <div class="space-y-3 p-4">
        <p class="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <Info class="h-5 w-5 text-info" />
          {t(m.docs_intro)}
          <a href={OPENSPEC_OPSX_REFERENCE_DOCS_URL} target="_blank" class="underline hover:text-foreground">{FIXED_LABELS.settings.docs.opsxReference}</a> ·
          <a href={OPENSPEC_SUPPORTED_TOOLS_DOCS_URL} target="_blank" class="underline hover:text-foreground">{FIXED_LABELS.settings.docs.supportedTools}</a>
        </p>
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
      </div>
    </SurfaceCard>

    <!-- commands section -->
    <SurfaceCard id="settings-commands" data-settings-section="commands">
      <SectionHeader>
        <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-foreground">{FIXED_LABELS.settings.sections.commands}</h2>
          <p class="mt-1 text-sm text-muted-foreground">{t(m.settings_commands_description)}</p>
          <p class="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Info class="h-5 w-5 text-info" />
            {t(m.docs_intro)}
            <a href={OPENSPEC_COMMANDS_DOCS_URL} target="_blank" class="underline hover:text-foreground">{FIXED_LABELS.settings.docs.commands}</a> ·
            <a href={OPENSPEC_WORKFLOWS_DOCS_URL} target="_blank" class="underline hover:text-foreground">{FIXED_LABELS.settings.docs.workflows}</a>
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
      </SectionHeader>

      <div class="space-y-4 p-4">
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
      </div>
    </SurfaceCard>

    <!-- validation section -->
    <SurfaceCard id="settings-validation" data-settings-section="validation">
      <SectionHeader>
        <h2 class="text-lg font-semibold text-foreground">{FIXED_LABELS.settings.sections.validation}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{t(m.settings_validation_description)}</p>
      </SectionHeader>

      <div class="space-y-4 p-4">
        <div class="divide-y divide-border overflow-hidden rounded-lg border border-border bg-secondary/50">
          <label class="flex items-start justify-between gap-4 px-4 py-3 text-sm text-card-foreground">
            <div>
              <div class="font-medium text-foreground">{t(m.validation_strict)}</div>
              <div class="mt-1 text-xs text-muted-foreground">{t(m.settings_validation_strict_description)}</div>
            </div>

            <input
              type="checkbox"
              checked={validationPreferencesStore.strict}
              aria-label={t(m.validation_strict)}
              onchange={toggleValidationStrict}
            />
          </label>

          <label class="flex items-start justify-between gap-4 px-4 py-3 text-sm text-card-foreground">
            <div>
              <div class="font-medium text-foreground">{t(m.validation_auto_run)}</div>
              <div class="mt-1 text-xs text-muted-foreground">{t(m.settings_validation_auto_run_description)}</div>
            </div>

            <input
              type="checkbox"
              checked={validationPreferencesStore.autoRun}
              aria-label={t(m.validation_auto_run)}
              onchange={toggleValidationAutoRun}
            />
          </label>

          <label class="grid gap-3 px-4 py-3 text-sm text-card-foreground sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-start">
            <div>
              <div class="font-medium text-foreground">{t(m.validation_concurrency)}</div>
              <div class="mt-1 text-xs text-muted-foreground">{t(m.settings_validation_concurrency_description)}</div>
            </div>

            <input
              type="number"
              min="1"
              value={validationConcurrencyInput}
              aria-label={t(m.validation_concurrency)}
              oninput={(event) => handleValidationConcurrencyInput((event.currentTarget as HTMLInputElement).value)}
              placeholder="—"
              class="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
            />
          </label>
        </div>

        <Callout variant="info">
          <div class="space-y-1 text-sm">
            <div class="font-medium text-foreground">{t(m.settings_validation_command_preview)}</div>
            <code class="block overflow-x-auto rounded bg-background px-3 py-2 text-xs text-primary">{validationCommandPreview}</code>
          </div>
        </Callout>
      </div>
    </SurfaceCard>

    <!-- versions section -->
    <SurfaceCard id="settings-versions" data-settings-section="versions">
      <SectionHeader>
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-foreground">{FIXED_LABELS.settings.sections.versions}</h2>
            <p class="mt-1 text-sm text-muted-foreground">{t(m.settings_versions_description)}</p>
          </div>
          <div class="flex shrink-0 items-center gap-2 pt-0.5">
            <span class="text-xs text-muted-foreground">{checkedAtLabel}</span>
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-muted-foreground hover:text-foreground"
              disabled={versionStatusStore.loading}
              aria-label={t(m.settings_versions_refresh_aria)}
              onclick={() => versionStatusStore.manualRefresh()}
            >
              <RefreshCw class={`h-4 w-4 ${versionStatusStore.loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </SectionHeader>

      <div class="space-y-4 p-4">
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
              <InsetPanel class="space-y-3">
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
              </InsetPanel>
            {/each}
          </div>

          <InsetPanel class="space-y-3">
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
          </InsetPanel>
        {/if}
      </div>
    </SurfaceCard>
  </div>
</div>
