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
    class="fixed z-50 bg-surface border border-input-border rounded-lg shadow-xl p-4 w-96"
    style="left: {Math.max(16, Math.min(position.x - 192, window.innerWidth - 400))}px; top: {Math.min(position.y, window.innerHeight - 300)}px;"
    onkeydown={handleKeydown}
    role="dialog"
    aria-labelledby="suggestion-dialog-title"
    tabindex="-1"
  >
    <!-- Original text preview -->
    <div class="mb-3">
      <span id="suggestion-dialog-title" class="block text-xs font-medium text-on-surface-muted mb-1">Original text:</span>
      <div class="text-sm text-on-surface bg-surface-alt/50 rounded p-2 max-h-24 overflow-y-auto">
        {truncateText(originalText, 200)}
      </div>
    </div>

    <!-- Suggestion input -->
    <div class="mb-3">
      <label for="suggestion-input" class="block text-xs font-medium text-on-surface-muted mb-1">
        Your suggestion:
      </label>
      <textarea
        id="suggestion-input"
        bind:this={textareaElement}
        bind:value={suggestionText}
        class="w-full h-24 bg-surface-alt border border-input-border rounded-md p-2 text-sm text-on-bg
               focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent
               resize-none"
        placeholder="Describe your suggested change..."
      ></textarea>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2">
      <button
        onclick={handleCancel}
        class="px-3 py-1.5 text-sm text-on-surface-muted hover:text-on-surface transition-colors"
      >
        Cancel
      </button>
      <button
        onclick={handleAdd}
        disabled={!suggestionText.trim()}
        class="px-3 py-1.5 text-sm bg-brand text-on-brand rounded-md
               hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed
               transition-colors"
      >
        {existingSuggestion ? 'Update' : 'Add'} Suggestion
      </button>
    </div>

    <!-- Keyboard hint -->
    <div class="mt-2 text-xs text-on-surface-muted text-center">
      Press <kbd class="px-1 py-0.5 bg-input-bg rounded text-on-surface-muted">Cmd+Enter</kbd> to add,
      <kbd class="px-1 py-0.5 bg-input-bg rounded text-on-surface-muted">Esc</kbd> to cancel
    </div>
  </div>
{/if}
