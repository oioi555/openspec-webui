<script lang="ts">
  import { tick } from 'svelte';
  import { suggestionStore, blockSuggestionMap } from '../stores/suggestions.svelte.ts';

  let textareaElement = $state<HTMLTextAreaElement | null>(null);
  let suggestionText = $state('');
  let popoverElement = $state<HTMLDivElement | null>(null);

  let position = $derived(suggestionStore.popoverPosition);
  let selectedBlockId = $derived(suggestionStore.selectedBlockId);
  let existingSuggestion = $derived(
    selectedBlockId ? blockSuggestionMap.value.get(selectedBlockId) : undefined
  );
  let originalText = $derived(getOriginalText(selectedBlockId));

  function getOriginalText(blockId: string | null): string {
    if (!blockId) {
      return '';
    }

    const block = document.querySelector(`[data-block-id="${blockId}"]`);
    return block?.getAttribute('data-block-text') || block?.textContent?.trim() || '';
  }

  function truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  function handleAdd() {
    if (!selectedBlockId || !suggestionText.trim()) {
      return;
    }

    if (existingSuggestion) {
      suggestionStore.updateSuggestion(existingSuggestion.id, suggestionText.trim());
    } else {
      suggestionStore.addSuggestion(selectedBlockId, originalText, suggestionText.trim());
    }
    suggestionText = '';
  }

  function handleCancel() {
    suggestionStore.clearSelection();
    suggestionText = '';
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    } else if (event.key === 'Enter' && event.metaKey) {
      handleAdd();
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (!popoverElement) {
      return;
    }

    if (!popoverElement.contains(event.target as Node)) {
      const target = event.target as HTMLElement;
      if (!target.closest('.suggestion-block')) {
        handleCancel();
      }
    }
  }

  $effect(() => {
    const currentSelectedBlockId = selectedBlockId;
    const currentExistingSuggestion = existingSuggestion;

    if (!currentSelectedBlockId || !textareaElement) {
      return;
    }

    suggestionText = currentExistingSuggestion?.suggestedChange ?? '';

    void tick().then(() => {
      textareaElement?.focus();
    });
  });

  $effect(() => {
    document.addEventListener('click', handleClickOutside, true);

    return () => {
    document.removeEventListener('click', handleClickOutside, true);
    };
  });
</script>

{#if selectedBlockId && position}
  <div
    bind:this={popoverElement}
    class="fixed z-50 w-96 rounded-lg border border-input bg-card p-4 shadow-xl"
    style="left: {Math.max(16, Math.min(position.x - 192, window.innerWidth - 400))}px; top: {Math.min(position.y, window.innerHeight - 300)}px;"
    onkeydown={handleKeydown}
    role="dialog"
    aria-labelledby="suggestion-dialog-title"
    tabindex="-1"
  >
    <!-- Original text preview -->
    <div class="mb-3">
      <span id="suggestion-dialog-title" class="mb-1 block text-xs font-medium text-muted-foreground">Original text:</span>
      <div class="max-h-24 overflow-y-auto rounded bg-secondary/50 p-2 text-sm text-card-foreground">
        {truncateText(originalText, 200)}
      </div>
    </div>

    <!-- Suggestion input -->
    <div class="mb-3">
      <label for="suggestion-input" class="mb-1 block text-xs font-medium text-muted-foreground">
        Your suggestion:
      </label>
      <textarea
        id="suggestion-input"
        bind:this={textareaElement}
        bind:value={suggestionText}
        class="h-24 w-full rounded-md border border-input bg-background p-2 text-sm text-foreground
               focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring
               resize-none"
        placeholder="Describe your suggested change..."
      ></textarea>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2">
      <button
        onclick={handleCancel}
        class="px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Cancel
      </button>
      <button
        onclick={handleAdd}
        disabled={!suggestionText.trim()}
        class="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground
               hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50
               transition-colors"
      >
        {existingSuggestion ? 'Update' : 'Add'} Suggestion
      </button>
    </div>

    <!-- Keyboard hint -->
    <div class="mt-2 text-center text-xs text-muted-foreground">
      Press <kbd class="rounded bg-muted px-1 py-0.5 text-muted-foreground">Cmd+Enter</kbd> to add,
      <kbd class="rounded bg-muted px-1 py-0.5 text-muted-foreground">Esc</kbd> to cancel
    </div>
  </div>
{/if}
