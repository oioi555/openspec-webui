<script lang="ts">
  import { getSpec, type Spec } from '../lib/api';
  import { navigateTo, specsRefreshTrigger } from '../stores/index.svelte.ts';
  import Icon from './Icon.svelte';
  import MarkdownRenderer from './MarkdownRenderer.svelte';

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
    <button
      type="button"
      aria-label="Back to specs list"
      title="Back to specs list"
      class="p-2 hover:bg-surface rounded-lg"
      onclick={() => navigateTo('/specs')}
    >
      <Icon name="chevron-left" class="h-5 w-5 text-on-surface-muted" />
    </button>
    <div>
      <h1 class="text-2xl font-bold text-on-bg">{specName}</h1>
      <p class="text-on-surface-muted">Specification</p>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <div class="text-on-surface-muted">Loading...</div>
    </div>
  {:else if error}
    <div class="rounded-lg border border-danger-border bg-danger-bg p-4">
      <p class="text-danger">{error}</p>
    </div>
  {:else if spec}
    <!-- Tabs -->
    {#if spec.designContent}
      <div class="border-b border-border">
        <nav class="flex space-x-4">
          <button
            class="px-4 py-2 border-b-2 font-medium text-sm transition-colors {activeTab === 'spec'
              ? 'border-brand text-brand'
              : 'border-transparent text-on-surface-muted hover:text-on-surface'}"
            onclick={() => (activeTab = 'spec')}
          >
            Specification
          </button>
          <button
            class="px-4 py-2 border-b-2 font-medium text-sm transition-colors {activeTab === 'design'
              ? 'border-brand text-brand'
              : 'border-transparent text-on-surface-muted hover:text-on-surface'}"
            onclick={() => (activeTab = 'design')}
          >
            Design
          </button>
        </nav>
      </div>
    {/if}

    <!-- Content -->
    <div class="bg-surface rounded-lg shadow-lg border border-border p-6">
      {#if activeTab === 'spec'}
        <MarkdownRenderer content={spec.specContent} />
      {:else if spec.designContent}
        <MarkdownRenderer content={spec.designContent} />
      {/if}
    </div>
  {/if}
</div>
