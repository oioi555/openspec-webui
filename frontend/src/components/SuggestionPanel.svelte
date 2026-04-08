<script lang="ts">
  import { FileUp, Pencil, SquarePen, Trash2, X } from '@lucide/svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { suggestionStore, type Suggestion } from '../stores/suggestions.svelte.ts';
  import { generatePrompt } from '../lib/promptGenerator';
  import { addToast } from '../stores/index.svelte.ts';
  import type { Change } from '../lib/api';

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

<div class="flex h-full w-full flex-col">
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b border-border">
    <h2 class="text-lg font-semibold text-foreground">Suggestions</h2>
    <button
      onclick={handleExit}
      class="rounded p-1 transition-colors hover:bg-accent"
      title="Exit suggestion mode"
    >
      <X class="h-5 w-5 text-muted-foreground" />
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
      <div class="py-8 text-center text-muted-foreground">
        <SquarePen class="mx-auto mb-3 h-12 w-12 opacity-50" />
        <p>No suggestions yet</p>
        <p class="text-xs mt-1">Click on a text block to add one</p>
      </div>
    {:else}
      {#each suggestions as suggestion, index}
        <div class="rounded-lg border border-border bg-secondary/50 p-3">
          <div class="flex items-start justify-between mb-2">
            <span class="text-xs font-medium text-muted-foreground">Suggestion {index + 1}</span>
            <div class="flex gap-1">
              <button
                onclick={() => handleEdit(suggestion)}
                class="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                title="Edit suggestion"
              >
                <Pencil class="h-4 w-4" />
              </button>
              <button
                onclick={() => handleRemove(suggestion.id)}
                class="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-danger"
                title="Remove suggestion"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
          <div class="mb-1 text-xs text-muted-foreground">Original:</div>
          <div class="mb-2 rounded bg-card p-2 text-sm text-muted-foreground line-clamp-2">
            {truncateText(suggestion.originalText, 80)}
          </div>
          <div class="mb-1 text-xs text-muted-foreground">Suggested:</div>
          <div class="rounded bg-card p-2 text-sm text-card-foreground line-clamp-3">
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
      class="w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground
             hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50
             transition-colors flex items-center justify-center gap-2"
    >
      <FileUp class="h-5 w-5" />
      Generate Instructions
    </button>
    <p class="mt-2 text-center text-xs text-muted-foreground">
      {suggestions.length} suggestion{suggestions.length === 1 ? '' : 's'}
    </p>
  </div>
</div>

<Dialog.Root open={showPromptModal} onOpenChange={(open) => !open && handleCloseModal()}>
  <Dialog.Overlay />
  <Dialog.Content class="max-w-3xl p-0">
    <div class="flex items-center justify-between border-b border-border p-4">
      <Dialog.Title>Generated Instructions</Dialog.Title>
      <button
        onclick={handleCloseModal}
        class="rounded p-1 transition-colors hover:bg-accent"
        title="Close modal"
      >
        <X class="h-5 w-5 text-muted-foreground" />
      </button>
    </div>

    <div class="max-h-[80vh] overflow-y-auto p-4">
      <pre class="whitespace-pre-wrap rounded-lg bg-secondary p-4 font-mono text-sm text-card-foreground">{generatedPrompt}</pre>
    </div>

    <Dialog.Footer class="border-t border-border p-4">
      <button
        onclick={handleCloseModal}
        class="px-4 py-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        Cancel
      </button>
      <button
        onclick={handleCopyPrompt}
        class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <FileUp class="h-5 w-5" />
        Copy to Clipboard
      </button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

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
