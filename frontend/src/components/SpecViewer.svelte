<script lang="ts">
  import { FileText, Calendar, Search, Clipboard, Quote } from '@lucide/svelte';
  import { ErrorBanner } from '$lib/components/ui/error-banner';
  import { IconBox } from '$lib/components/ui/icon-box';
  import { LoadingState } from '$lib/components/ui/loading-state';
  import { UnderlineTabs } from '$lib/components/ui/underline-tabs';
  import { Button } from '$lib/components/ui/button';
  import * as ContextMenu from '$lib/components/ui/context-menu';
  import { toast } from 'svelte-sonner';
  import { getSpec, type Spec } from '../lib/api';
  import {
    buildCopySelectionResult,
    buildQuotedCopySelectionResult,
    getSpecViewerContextLabel,
  } from '../lib/contextCopy';
  import { specsRefreshTrigger } from '../stores/index.svelte.ts';
  import { layoutStore } from '../stores/layout.svelte.ts';
  import MarkdownRenderer from './MarkdownRenderer.svelte';
  import { formatDate } from '../lib/utils';
  interface Props {
    specName: string;
  }

  let { specName }: Props = $props();

  let spec = $state<Spec | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let activeTab = $state<'spec' | 'design'>('spec');

  let previousSpecName: string | null = null;
  let previousRefreshTrigger = -1;
  let hasSelection = $state(false);

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Failed to copy');
    }
  }

  function handleCopy() {
    const result = buildCopySelectionResult(window.getSelection()?.toString());
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    copyToClipboard(result.text, 'Text');
  }

  function handleQuoteCopy() {
    const result = buildQuotedCopySelectionResult({
      sourceName: specName,
      contextLabel: getSpecViewerContextLabel(activeTab),
      selection: window.getSelection()?.toString(),
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    copyToClipboard(result.text, 'Quoted text');
  }

  function handleMenuOpenChange(open: boolean) {
    if (open) {
      hasSelection = (window.getSelection()?.toString().length ?? 0) > 0;
    }
  }

  function handleTabSelect(id: string) {
    if (id === 'spec' || id === 'design') {
      activeTab = id;
    }
  }

  async function loadSpec(preserveState = false) {
    if (!preserveState) {
      loading = true;
    }

    error = null;

    try {
      spec = await getSpec(specName);
      if (activeTab === 'design' && !spec.designContent) {
        activeTab = 'spec';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load spec';
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

    if (!isSameSpec) {
      activeTab = 'spec';
    }

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
          aria-label="Search changes related to this spec"
          onclick={searchRelatedChanges}
        >
          <Search class="h-4 w-4" />
        </Button>
      </h1>
      <p class="text-muted-foreground">
        {#if spec?.lastModified}
          <span class="flex items-center gap-1"><Calendar class="h-3.5 w-3.5" />{formatDate(spec.lastModified)}</span>
        {:else}
          Specification
        {/if}
      </p>
    </div>
  </div>

  {#if loading}
    <LoadingState />
  {:else if error}
    <ErrorBanner {error} />
  {:else if spec}
    <!-- Tabs -->
    {#if spec.designContent}
      <UnderlineTabs
        tabs={[{ id: 'spec', label: 'Specification' }, { id: 'design', label: 'Design' }]}
        activeId={activeTab}
        onSelect={handleTabSelect}
      />
    {/if}

    <!-- Content -->
    <ContextMenu.Root onOpenChange={handleMenuOpenChange}>
      <div class="rounded-lg border border-border bg-card p-6 shadow-lg">
        {#if activeTab === 'spec'}
          <MarkdownRenderer content={spec.specContent} />
        {:else if spec.designContent}
          <MarkdownRenderer content={spec.designContent} />
        {/if}
      </div>
      <ContextMenu.Content>
        <ContextMenu.Item disabled={!hasSelection} onSelect={handleCopy}>
          <Clipboard class="h-4 w-4" />
          Copy
        </ContextMenu.Item>
        <ContextMenu.Item disabled={!hasSelection} onSelect={handleQuoteCopy}>
          <Quote class="h-4 w-4" />
          Quote Copy
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  {/if}
</div>
