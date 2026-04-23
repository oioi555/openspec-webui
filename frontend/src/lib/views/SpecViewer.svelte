<script lang="ts">
  import { FileText, Calendar, Search, Clipboard, Quote } from '@lucide/svelte';
  import { ErrorBanner } from '$lib/components/shared/error-banner';
  import { IconBox } from '$lib/components/shared/icon-box';
  import { LoadingState } from '$lib/components/shared/loading-state';
  import { SurfaceCard } from '$lib/components/shared/surface';
  import { Button } from '$lib/components/ui/button';
  import * as ContextMenu from '$lib/components/ui/context-menu';
  import { toast } from 'svelte-sonner';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';
  import { getSpec } from '$lib/api';
  import {
    buildCopySelectionResult,
    buildQuotedCopySelectionResult,
    getSpecViewerContextLabel,
  } from '$lib/contextCopy';
  import { specsRefreshTrigger } from '$lib/state/appData.svelte.ts';
  import { layoutStore } from '$lib/state/layout.svelte.ts';
  import type { Spec } from '$lib/types/api';
  import MarkdownRenderer from '$lib/components/shared/MarkdownRenderer.svelte';
  import { formatDate } from '$lib/utils';
  import { FIXED_LABELS } from '$lib/uiText';
  interface Props {
    specName: string;
  }

  let { specName }: Props = $props();

  let spec = $state<Spec | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  let previousSpecName: string | null = null;
  let previousRefreshTrigger = -1;
  let hasSelection = $state(false);

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(m.common_copied({ label }));
    } catch {
      toast.error(m.common_failed_to_copy());
    }
  }

  function handleCopy() {
    const result = buildCopySelectionResult(window.getSelection()?.toString());
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    copyToClipboard(result.text, m.copy_label_text());
  }

  function handleQuoteCopy() {
    const result = buildQuotedCopySelectionResult({
      sourceName: specName,
      contextLabel: getSpecViewerContextLabel(),
      selection: window.getSelection()?.toString(),
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    copyToClipboard(result.text, m.copy_label_quoted_text());
  }

  function handleMenuOpenChange(open: boolean) {
    if (open) {
      hasSelection = (window.getSelection()?.toString().length ?? 0) > 0;
    }
  }

  async function loadSpec(preserveState = false) {
    if (!preserveState) {
      loading = true;
    }

    error = null;

    try {
      spec = await getSpec(specName);
    } catch (e) {
      error = e instanceof Error ? e.message : t(m.error_failed_to_load_spec);
    } finally {
      loading = false;
    }
  }

  function searchRelatedChanges() {
    layoutStore.openOverlay('search', { initialQuery: specName });
  }

  $effect(() => {
    const refreshTrigger = specsRefreshTrigger.value;

    if (!specName) {
      return;
    }

    const isSameSpec = previousSpecName === specName;
    const preserveState = isSameSpec && refreshTrigger > previousRefreshTrigger;

    previousSpecName = specName;
    previousRefreshTrigger = refreshTrigger;

    void loadSpec(preserveState);
  });
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <div class="min-w-0 flex-1">
      <h1 class="flex items-center gap-2 text-2xl font-bold text-foreground">
        <IconBox icon={FileText} variant="success" />
        {specName}
        <Button
          variant="ghost"
          size="icon"
          class="size-7 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={FIXED_LABELS.search.relatedChanges}
          onclick={searchRelatedChanges}
        >
          <Search class="h-4 w-4" />
        </Button>
      </h1>
      <p class="text-muted-foreground">
        {#if spec?.lastModified}
          <span class="flex items-center gap-1"><Calendar class="h-3.5 w-3.5" />{formatDate(spec.lastModified)}</span>
        {:else}
          {FIXED_LABELS.viewer.specification}
        {/if}
      </p>
    </div>
  </div>

  {#if loading}
    <LoadingState />
  {:else if error}
    <ErrorBanner {error} />
  {:else if spec}
    <!-- Content -->
    <ContextMenu.Root onOpenChange={handleMenuOpenChange}>
      <SurfaceCard shadow="lg" class="p-6">
        <MarkdownRenderer content={spec.specContent} />
      </SurfaceCard>
      <ContextMenu.Content>
        <ContextMenu.Item disabled={!hasSelection} onSelect={handleCopy}>
          <Clipboard class="h-4 w-4" />
          {t(m.common_copy)}
        </ContextMenu.Item>
        <ContextMenu.Item disabled={!hasSelection} onSelect={handleQuoteCopy}>
          <Quote class="h-4 w-4" />
          {t(m.common_quote_copy)}
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/if}
</div>
