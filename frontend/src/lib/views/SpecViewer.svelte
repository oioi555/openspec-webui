<script lang="ts">
  import { tick } from 'svelte';
  import { Calendar, Search, Clipboard, Quote } from '@lucide/svelte';
  import { ErrorBanner } from '$lib/components/shared/error-banner';
  import { TypeIndicator } from '$lib/components/shared/type-indicator';
  import { LoadingState } from '$lib/components/shared/loading-state';
  import { SurfaceCard } from '$lib/components/shared/surface';
  import ValidationViewerStatus from '$lib/components/shared/ValidationViewerStatus.svelte';
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
  import type { SearchNavigationState } from '$lib/state/search.svelte.ts';
  import { searchStore, SEARCH_MIN_QUERY_LENGTH } from '$lib/state/search.svelte.ts';
  import { tabStore } from '$lib/state/tabs.svelte.ts';
  import { uiPreferencesStore } from '$lib/state/uiPreferences.svelte.ts';
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
  let contentRef = $state<HTMLDivElement | null>(null);
  let tabId = $derived(`spec:${specName}`);
  let highlightQuery = $derived(
    uiPreferencesStore.searchHighlightsEnabled && searchStore.query.length >= SEARCH_MIN_QUERY_LENGTH
      ? searchStore.query
      : undefined,
  );

  interface SpecViewerState {
    searchNavigation?: SearchNavigationState;
  }

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
    searchStore.open(specName);
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

  $effect(() => {
    if (!spec || loading) {
      return;
    }

    const viewerState = tabStore.getViewerState<SpecViewerState>(tabId);
    const searchNavigation = viewerState?.searchNavigation;
    if (!searchNavigation?.requestKey) {
      return;
    }

    if (viewerState) {
      const { searchNavigation: _ignored, ...rest } = viewerState;
      if (Object.keys(rest).length > 0) {
        tabStore.setViewerState(tabId, rest);
      } else {
        tabStore.clearViewerState(tabId);
      }
    }

    if (!highlightQuery) {
      return;
    }

    void tick().then(() => {
      const firstHighlight = contentRef?.querySelector<HTMLElement>('mark.search-highlight');
      firstHighlight?.scrollIntoView({ behavior: 'auto', block: 'center' });
    });
  });
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <div class="min-w-0 flex-1">
      <h1 class="flex items-center gap-2 text-2xl font-bold text-foreground">
        <TypeIndicator kind="spec" format="icon-box" size="lg" />
        {specName}
        <Button
          variant="ghost"
          size="icon"
          class="rounded-md w-7 h-7 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground border border-border/50"
          aria-label={FIXED_LABELS.search.relatedChanges}
          onclick={searchRelatedChanges}
        >
          <Search class="h-3.5 w-3.5" />
        </Button>
      </h1>
      <div class="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground">
        {#if spec?.lastModified}
          {@const lastModifiedLabel = formatDate(spec.lastModified)}
          <span class="inline-flex min-w-0 max-w-full items-center gap-1" title={lastModifiedLabel}>
            <Calendar class="h-3.5 w-3.5 shrink-0" />
            <span class="truncate whitespace-nowrap">{lastModifiedLabel}</span>
          </span>
        {:else}
          {FIXED_LABELS.viewer.specification}
        {/if}
      </div>
    </div>
  </div>

  <ValidationViewerStatus itemType="spec" itemName={specName} />

  {#if loading}
    <LoadingState />
  {:else if error}
    <ErrorBanner {error} />
  {:else if spec}
    <!-- Content -->
    <ContextMenu.Root onOpenChange={handleMenuOpenChange}>
      <SurfaceCard shadow="lg" class="p-6">
        <div bind:this={contentRef}>
          <MarkdownRenderer content={spec.specContent} highlightQuery={highlightQuery} />
        </div>
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
