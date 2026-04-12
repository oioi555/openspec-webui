<script lang="ts">
  import { FileText, Calendar} from '@lucide/svelte';
  import { ErrorBanner } from '$lib/components/ui/error-banner';
  import { IconBox } from '$lib/components/ui/icon-box';
  import { LoadingState } from '$lib/components/ui/loading-state';
  import { UnderlineTabs } from '$lib/components/ui/underline-tabs';
  import { getSpec, type Spec } from '../lib/api';
  import { specsRefreshTrigger } from '../stores/index.svelte.ts';
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
    <div>
      <h1 class="flex items-center gap-2 text-2xl font-bold text-foreground">
        <IconBox icon={FileText} variant="success" />
        {specName}
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
    <div class="rounded-lg border border-border bg-card p-6 shadow-lg">
      {#if activeTab === 'spec'}
        <MarkdownRenderer content={spec.specContent} />
      {:else if spec.designContent}
        <MarkdownRenderer content={spec.designContent} />
      {/if}
    </div>
  {/if}
</div>
