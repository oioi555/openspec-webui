<script lang="ts">
  import { suggestionStore, type Suggestion } from '../stores/suggestions.svelte.ts';
  import { generatePrompt } from '../lib/promptGenerator';
  import { addToast } from '../stores/index.svelte.ts';
  import type { Change } from '../lib/api';
  import Icon from './Icon.svelte';

  interface Props {
    changeName: string;
    change: Change | null;
  }

  let { changeName, change }: Props = $props();

  let showPromptModal = $state(false);
  let generatedPrompt = $state('');

  let suggestions = $derived(suggestionStore.suggestions);

  function truncateText(text: string, maxLength: number = 60): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  function handleEdit(suggestion: Suggestion) {
    const block = document.querySelector(`[data-block-id="${suggestion.blockId}"]`);
    if (block) {
      const rect = block.getBoundingClientRect();
      suggestionStore.selectBlock(suggestion.blockId, {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      });
      // Scroll block into view
      block.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function handleRemove(id: string) {
    suggestionStore.removeSuggestion(id);
  }

  function handleGeneratePrompt() {
    if (!change) return;
    generatedPrompt = generatePrompt(changeName, change, suggestions);
    showPromptModal = true;
  }

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      addToast('Instructions copied to clipboard!', 'success');
      showPromptModal = false;
    } catch {
      addToast('Failed to copy prompt', 'error');
    }
  }

  function handleCloseModal() {
    showPromptModal = false;
  }

  function handleExit() {
    suggestionStore.exitSuggestionMode();
  }
</script>

<!-- Side panel -->
<div
  class="fixed top-0 right-0 h-full bg-surface border-l border-border shadow-xl z-40 flex flex-col"
  style="width: var(--suggestion-panel-width);"
>
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b border-border">
    <h2 class="text-lg font-semibold text-on-bg">Suggestions</h2>
    <button
      onclick={handleExit}
      class="p-1 hover:bg-surface rounded transition-colors"
      title="Exit suggestion mode"
    >
      <Icon name="close" class="h-5 w-5 text-on-surface-muted" />
    </button>
  </div>

  <!-- Instructions -->
  <div class="border-b border-border bg-info-bg px-4 py-3">
    <p class="text-sm text-info">
      Click on any text block in the proposal to add a suggestion.
    </p>
  </div>

  <!-- Suggestions list -->
  <div class="flex-1 overflow-y-auto p-4 space-y-3">
    {#if suggestions.length === 0}
      <div class="text-center text-on-surface-muted py-8">
        <Icon name="pencil-square" class="mx-auto mb-3 h-12 w-12 opacity-50" />
        <p>No suggestions yet</p>
        <p class="text-xs mt-1">Click on a text block to add one</p>
      </div>
    {:else}
      {#each suggestions as suggestion, index}
        <div class="bg-surface-alt/50 rounded-lg p-3 border border-border">
          <div class="flex items-start justify-between mb-2">
            <span class="text-xs font-medium text-on-surface-muted">Suggestion {index + 1}</span>
            <div class="flex gap-1">
              <button
                onclick={() => handleEdit(suggestion)}
                class="p-1 hover:bg-surface rounded text-on-surface-muted hover:text-on-surface transition-colors"
                title="Edit suggestion"
              >
                <Icon name="pencil" class="h-4 w-4" />
              </button>
              <button
                onclick={() => handleRemove(suggestion.id)}
                class="rounded p-1 text-on-surface-muted transition-colors hover:bg-surface hover:text-danger"
                title="Remove suggestion"
              >
                <Icon name="trash" class="h-4 w-4" />
              </button>
            </div>
          </div>
          <div class="text-xs text-on-surface-muted mb-1">Original:</div>
          <div class="text-sm text-on-surface-muted bg-surface rounded p-2 mb-2 line-clamp-2">
            {truncateText(suggestion.originalText, 80)}
          </div>
          <div class="text-xs text-on-surface-muted mb-1">Suggested:</div>
          <div class="text-sm text-on-surface bg-surface rounded p-2 line-clamp-3">
            {truncateText(suggestion.suggestedChange, 120)}
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Footer -->
  <div class="p-4 border-t border-border">
      <button
        onclick={handleGeneratePrompt}
      disabled={suggestions.length === 0}
      class="w-full py-2.5 bg-brand text-on-brand rounded-lg font-medium
             hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed
             transition-colors flex items-center justify-center gap-2"
    >
      <Icon name="document-arrow" class="h-5 w-5" />
      Generate Instructions
    </button>
    <p class="text-xs text-on-surface-muted text-center mt-2">
      {suggestions.length} suggestion{suggestions.length === 1 ? '' : 's'}
    </p>
  </div>
</div>

<!-- Prompt Modal -->
{#if showPromptModal}
  <div class="fixed inset-0 bg-overlay z-50 flex items-center justify-center p-4">
    <div class="bg-surface rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
      <!-- Modal header -->
      <div class="flex items-center justify-between p-4 border-b border-border">
        <h3 class="text-lg font-semibold text-on-bg">Generated Instructions</h3>
        <button
          onclick={handleCloseModal}
          class="p-1 hover:bg-surface rounded transition-colors"
          title="Close modal"
        >
          <Icon name="close" class="h-5 w-5 text-on-surface-muted" />
        </button>
      </div>

      <!-- Modal content -->
      <div class="flex-1 overflow-y-auto p-4">
        <pre class="text-sm text-on-surface whitespace-pre-wrap bg-surface-alt rounded-lg p-4 font-mono">{generatedPrompt}</pre>
      </div>

      <!-- Modal footer -->
      <div class="flex justify-end gap-3 p-4 border-t border-border">
        <button
          onclick={handleCloseModal}
          class="px-4 py-2 text-on-surface-muted hover:text-on-surface transition-colors"
        >
          Cancel
        </button>
        <button
          onclick={handleCopyPrompt}
          class="px-4 py-2 bg-brand text-on-brand rounded-lg font-medium
                 hover:bg-brand-hover transition-colors flex items-center gap-2"
        >
          <Icon name="document-arrow" class="h-5 w-5" />
          Copy to Clipboard
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .line-clamp-2 {
    line-clamp: 2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-3 {
    line-clamp: 3;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
