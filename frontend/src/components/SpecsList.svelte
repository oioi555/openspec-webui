<script lang="ts">
  import { specs, navigateTo } from '../stores/index.svelte.ts';
  import Icon from './Icon.svelte';
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-on-bg">Specifications</h1>
    <p class="text-on-surface-muted mt-1">Current truth - what IS built</p>
  </div>

  <div class="bg-surface rounded-lg shadow-lg border border-border">
    <div class="divide-y divide-border">
      {#if specs.value.length === 0}
        <div class="px-6 py-8 text-center text-on-surface-muted">
          No specifications found
        </div>
      {:else}
        {#each specs.value as spec}
          <button
            class="w-full px-6 py-4 hover:bg-surface/50 text-left flex items-center justify-between"
            onclick={() => navigateTo(`/specs/${spec.name}`)}
          >
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success-bg">
                <Icon name="document" class="h-5 w-5 text-success" />
              </div>
              <div>
                <div class="font-medium text-on-bg">{spec.name}</div>
                <div class="text-sm text-on-surface-muted">
                  {spec.hasDesign ? 'spec + design' : 'spec only'}
                </div>
              </div>
            </div>
            <Icon name="chevron-right" class="h-5 w-5 text-on-surface-muted" />
          </button>
        {/each}
      {/if}
    </div>
  </div>
</div>
