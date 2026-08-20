<script lang="ts">
  import { ExternalLink, Info, Network, RotateCcw, Search, X } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Tabs from '$lib/components/ui/tabs';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';
  import {
    filterOfficialToolDefinitions,
    filterSharedSkillsCompatibility,
  } from '$lib/toolCompatibilityReference';
  import type {
    OpenSpecToolDeliveryDefinition,
    SharedSkillsAccessMode,
    SharedSkillsCompatibility,
    SharedSkillsEvidenceKind,
    SharedSkillsScope,
    ToolCompatibilityReferenceResponse,
  } from '$lib/types/api';

  type ReferenceView = 'official' | 'shared';

  interface Props {
    open: boolean;
    reference: ToolCompatibilityReferenceResponse | null;
    loading?: boolean;
    error?: string | null;
    onClose: () => void;
    onRetry?: () => void;
  }

  let {
    open,
    reference,
    loading = false,
    error = null,
    onClose,
    onRetry = () => {},
  }: Props = $props();

  let view = $state<ReferenceView>('official');
  let query = $state('');

  let officialDefinitions = $derived(
    filterOfficialToolDefinitions(reference?.officialDefinitions ?? [], query)
  );
  let compatibilityRecords = $derived(
    filterSharedSkillsCompatibility(reference?.sharedCompatibility ?? [], query)
  );

  function accessModeLabel(mode: SharedSkillsAccessMode): string {
    switch (mode) {
      case 'native-project': return t(m.tool_reference_mode_native_project);
      case 'native-global': return t(m.tool_reference_mode_native_global);
      case 'configurable': return t(m.tool_reference_mode_configurable);
      case 'import': return t(m.tool_reference_mode_import);
      case 'format-only': return t(m.tool_reference_mode_format_only);
      case 'unverified': return t(m.tool_reference_mode_unverified);
    }
  }

  function accessModeVariant(mode: SharedSkillsAccessMode): 'success' | 'info' | 'warning' | 'secondary' | 'outline' {
    switch (mode) {
      case 'native-project': return 'success';
      case 'native-global': return 'info';
      case 'configurable':
      case 'import': return 'warning';
      case 'format-only': return 'secondary';
      case 'unverified': return 'outline';
    }
  }

  function accessModeDetail(mode: SharedSkillsAccessMode): string {
    switch (mode) {
      case 'native-project': return t(m.tool_reference_mode_detail_native_project);
      case 'native-global': return t(m.tool_reference_mode_detail_native_global);
      case 'configurable': return t(m.tool_reference_mode_detail_configurable);
      case 'import': return t(m.tool_reference_mode_detail_import);
      case 'format-only': return t(m.tool_reference_mode_detail_format_only);
      case 'unverified': return t(m.tool_reference_mode_detail_unverified);
    }
  }

  function scopeLabel(scope: SharedSkillsScope): string {
    return scope === 'project'
      ? t(m.tool_reference_scope_project)
      : t(m.tool_reference_scope_global);
  }

  function scopesLabel(scopes: SharedSkillsScope[]): string {
    return scopes.length > 0
      ? scopes.map(scopeLabel).join(', ')
      : t(m.tool_reference_scope_none);
  }

  function evidenceLabel(kind: SharedSkillsEvidenceKind): string {
    switch (kind) {
      case 'vendor-docs': return t(m.tool_reference_evidence_vendor_docs);
      case 'standard-listing': return t(m.tool_reference_evidence_standard_listing);
      case 'research-summary': return t(m.tool_reference_evidence_research_summary);
      case 'runtime-observed': return t(m.tool_reference_evidence_runtime_observed);
    }
  }

  function isExternalSource(source: string): boolean {
    return /^https?:\/\//.test(source);
  }
</script>

{#snippet deliveryDetails(delivery: OpenSpecToolDeliveryDefinition | null)}
  {#if delivery}
    <code class="block break-all text-xs text-foreground">{delivery.path}</code>
    <div class="mt-1 text-xs text-muted-foreground">
      {t(m.tool_reference_invocation)}:
      {#if delivery.invocation}
        <code class="break-all text-primary">{delivery.invocation}</code>
      {:else}
        {t(m.tool_reference_not_documented)}
      {/if}
    </div>
  {:else}
    <span class="text-sm text-muted-foreground">{t(m.tool_reference_not_defined)}</span>
  {/if}
{/snippet}

<Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
  <Dialog.Overlay class="left-12" ariaLabel={t(m.tool_reference_close)} />
  <Dialog.Content
    aria-label={t(m.tool_reference_title)}
    containerClass="left-12"
    class="h-[min(90vh,56rem)] max-w-6xl gap-0 overflow-hidden p-0"
  >
    <div class="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
      <div class="min-w-0 flex items-start gap-3">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Network class="size-5" />
        </div>
        <div class="min-w-0">
          <Dialog.Title>{t(m.tool_reference_title)}</Dialog.Title>
          <Dialog.Description class="mt-1">{t(m.tool_reference_description)}</Dialog.Description>
        </div>
      </div>
      <Button variant="ghost" size="icon" class="size-9" aria-label={t(m.tool_reference_close)} onclick={onClose}>
        <X class="size-4" />
      </Button>
    </div>

    <div class="flex min-h-0 flex-1 flex-col">
      <Tabs.Root
        value={view}
        onValueChange={(value) => view = value as ReferenceView}
        class="flex min-h-0 flex-1 flex-col"
      >
        <div class="shrink-0 space-y-3 border-b border-border px-5 py-4 sm:px-6">
          <Tabs.List class="grid h-auto w-full grid-cols-2 sm:w-auto">
            <Tabs.Trigger value="official" class="h-auto min-h-8 whitespace-normal text-center">{t(m.tool_reference_view_official)}</Tabs.Trigger>
            <Tabs.Trigger value="shared" class="h-auto min-h-8 whitespace-normal text-center">{t(m.tool_reference_view_shared)}</Tabs.Trigger>
          </Tabs.List>

          <div class="flex items-center gap-2">
            <label class="relative min-w-0 flex-1">
              <span class="sr-only">{t(m.tool_reference_search_label)}</span>
              <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                oninput={(event) => query = event.currentTarget.value}
                placeholder={t(m.tool_reference_search_placeholder)}
                class="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </label>
            {#if query}
              <Button variant="outline" size="icon" class="size-10" aria-label={t(m.tool_reference_search_clear)} onclick={() => query = ''}>
                <RotateCcw class="size-4" />
              </Button>
            {/if}
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {#if loading}
            <p class="py-12 text-center text-sm text-muted-foreground">{t(m.tool_reference_loading)}</p>
          {:else if error}
            <div class="mx-auto flex max-w-lg flex-col items-center gap-3 py-12 text-center">
              <p class="text-sm text-destructive">{t(m.tool_reference_error)}</p>
              <Button variant="outline" onclick={onRetry}>{t(m.tool_reference_retry)}</Button>
            </div>
          {:else if reference}
            <Tabs.Content value="official" class="mt-0 space-y-4">
              <div class="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-sm text-muted-foreground">{t(m.tool_reference_official_intro)}</p>
                <div class="shrink-0 text-xs text-muted-foreground">
                  {t(m.tool_reference_official_source)}:
                  <a class="ml-1 inline-flex items-center gap-1 text-primary underline" href={reference.officialSource.url} target="_blank" rel="noreferrer">
                    OpenSpec {reference.officialSource.version}<ExternalLink class="size-3" />
                  </a>
                  <span class="ml-2">{t(m.tool_reference_verified)} {reference.officialSource.verifiedAt}</span>
                </div>
              </div>

              {#if officialDefinitions.length === 0}
                <p class="py-12 text-center text-sm text-muted-foreground">{t(m.tool_reference_no_results)}</p>
              {:else}
                <div role="table" aria-label={t(m.tool_reference_view_official)} class="space-y-2 md:space-y-0 md:overflow-hidden md:rounded-lg md:border md:border-border">
                  <div role="row" class="hidden grid-cols-[minmax(9rem,0.8fr)_minmax(0,1.3fr)_minmax(0,1.3fr)] gap-4 border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                    <div role="columnheader">{t(m.tool_reference_tool)}</div>
                    <div role="columnheader">{t(m.tool_reference_commands)}</div>
                    <div role="columnheader">{t(m.tool_reference_skills)}</div>
                  </div>
                  {#each officialDefinitions as definition (definition.id)}
                    <div role="row" class="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-[minmax(9rem,0.8fr)_minmax(0,1.3fr)_minmax(0,1.3fr)] md:rounded-none md:border-x-0 md:border-t-0 md:p-4 md:last:border-b-0">
                      <div role="cell" class="min-w-0">
                        <div class="font-medium text-foreground">{definition.name}</div>
                        <Badge variant="outline" class="mt-1 font-mono">{definition.id}</Badge>
                      </div>
                      <div role="cell" class="min-w-0">
                        <div class="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:hidden">{t(m.tool_reference_commands)}</div>
                        {@render deliveryDetails(definition.commands)}
                      </div>
                      <div role="cell" class="min-w-0">
                        <div class="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:hidden">{t(m.tool_reference_skills)}</div>
                        {@render deliveryDetails(definition.skills)}
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </Tabs.Content>

            <Tabs.Content value="shared" class="mt-0 space-y-4">
              <p class="text-sm text-muted-foreground">{t(m.tool_reference_shared_intro)}</p>

              <div class="overflow-hidden rounded-lg border border-border bg-card">
                <div class="hidden grid-cols-[minmax(7rem,0.7fr)_minmax(9rem,1fr)_minmax(8rem,1fr)] gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                  <div>{t(m.tool_reference_open_spec_targets)}</div>
                  <div>{t(m.tool_reference_shared_path)}</div>
                  <div>{t(m.tool_reference_invocation_style)}</div>
                </div>
                <div class="grid gap-2 border-b border-border px-4 py-3 md:grid-cols-[minmax(7rem,0.7fr)_minmax(9rem,1fr)_minmax(8rem,1fr)] md:items-center md:gap-3">
                  <div class="flex flex-wrap gap-1"><Badge variant="secondary">agents</Badge><Badge variant="secondary">zed</Badge></div>
                  <code class="break-all text-sm text-primary">.agents/skills</code>
                  <code class="text-sm text-foreground">/openspec-*</code>
                </div>
                <div class="grid gap-2 px-4 py-3 md:grid-cols-[minmax(7rem,0.7fr)_minmax(9rem,1fr)_minmax(8rem,1fr)] md:items-center md:gap-3">
                  <div><Badge variant="outline">codex</Badge></div>
                  <code class="break-all text-sm text-primary">.agents/skills</code>
                  <code class="text-sm text-foreground">$openspec-*</code>
                </div>
              </div>

              <div class="flex gap-2 rounded-md border border-warning-border bg-warning-bg px-3 py-2 text-sm text-warning" role="note">
                <Info class="mt-0.5 size-4 shrink-0" />
                <p><strong>{t(m.tool_reference_codex_rule_title)}</strong> {t(m.tool_reference_codex_rule)}</p>
              </div>

              {#if compatibilityRecords.length === 0}
                <p class="py-12 text-center text-sm text-muted-foreground">{t(m.tool_reference_no_results)}</p>
              {:else}
                <div role="table" aria-label={t(m.tool_reference_view_shared)} class="space-y-2 md:space-y-0 md:overflow-hidden md:rounded-lg md:border md:border-border">
                  <div role="row" class="hidden grid-cols-[minmax(10rem,0.9fr)_minmax(9rem,0.75fr)_minmax(0,1.7fr)] gap-4 border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                    <div role="columnheader">{t(m.tool_reference_client)}</div>
                    <div role="columnheader">{t(m.tool_reference_access_mode)}</div>
                    <div role="columnheader">{t(m.tool_reference_evidence)}</div>
                  </div>
                  {#each compatibilityRecords as record (record.clientId)}
                    <div role="row" class="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-[minmax(10rem,0.9fr)_minmax(9rem,0.75fr)_minmax(0,1.7fr)] md:rounded-none md:border-x-0 md:border-t-0 md:p-4 md:last:border-b-0">
                      <div role="cell" class="min-w-0">
                        <div class="font-medium text-foreground">{record.name}</div>
                        {#if record.openSpecToolId}
                          <Badge variant="outline" class="mt-1 font-mono">{record.openSpecToolId}</Badge>
                        {:else}
                          <Badge variant="secondary" class="mt-1">{t(m.tool_reference_external_client)}</Badge>
                        {/if}
                      </div>
                      <div role="cell" class="min-w-0">
                        <div class="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:hidden">{t(m.tool_reference_access_mode)}</div>
                          <Badge variant={accessModeVariant(record.accessMode)}>{accessModeLabel(record.accessMode)}</Badge>
                          <p class="mt-2 text-xs text-muted-foreground">{accessModeDetail(record.accessMode)}</p>
                          <div class="mt-2 text-xs text-muted-foreground">
                          {t(m.tool_reference_scopes)}: {scopesLabel(record.scopes)}
                        </div>
                      </div>
                      <div role="cell" class="min-w-0 space-y-1 text-xs text-muted-foreground">
                        <div class="font-medium text-foreground">{evidenceLabel(record.evidenceKind)}</div>
                        <div>{t(m.tool_reference_researched)} {record.researchedAt}</div>
                        {#if record.minVersion}
                          <div>{t(m.tool_reference_version)}: {record.minVersion}</div>
                        {/if}
                        {#if isExternalSource(record.source)}
                          <a class="inline-flex max-w-full items-center gap-1 break-all text-primary underline" href={record.source} target="_blank" rel="noreferrer">
                            {t(m.tool_reference_source)}<ExternalLink class="size-3 shrink-0" />
                          </a>
                        {:else}
                          <div class="break-words">{t(m.tool_reference_source)}: {record.source}</div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}

              <p class="text-xs text-muted-foreground">{t(m.tool_reference_shared_disclaimer)}</p>
            </Tabs.Content>
          {/if}
        </div>
      </Tabs.Root>
    </div>
  </Dialog.Content>
</Dialog.Root>
