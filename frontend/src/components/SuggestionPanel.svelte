<script lang="ts">
  import { FileUp, Pencil, SquarePen, Trash2 } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Callout } from '$lib/components/ui/callout';
  import { DialogHeader as SharedDialogHeader } from '$lib/components/ui/dialog-header';
  import * as Dialog from '$lib/components/ui/dialog';
  import { EmptyState } from '$lib/components/ui/empty-state';
  import { truncateText } from '$lib/utils';
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
  <SharedDialogHeader title="Suggestions" onClose={handleExit} class="px-4 py-4" />

  <!-- Instructions -->
  <div class="border-b border-border px-4 py-3">
    <Callout variant="info">
      Click on any text block in the proposal to add a suggestion.
    </Callout>
  </div>

  <!-- Suggestions list -->
  <div class="flex-1 overflow-y-auto p-4 space-y-3">
    {#if suggestions.length === 0}
      <EmptyState
        message="No suggestions yet — click on a text block to add one."
        icon={SquarePen}
        class="py-8"
      />
    {:else}
      {#each suggestions as suggestion, index}
        <div class="rounded-lg border border-border bg-secondary/50 p-3">
          <div class="flex items-start justify-between mb-2">
            <span class="text-xs font-medium text-muted-foreground">Suggestion {index + 1}</span>
            <div class="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                class="size-8 text-muted-foreground"
                onclick={() => handleEdit(suggestion)}
                title="Edit suggestion"
              >
                <Pencil class="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 text-muted-foreground hover:text-danger"
                onclick={() => handleRemove(suggestion.id)}
                title="Remove suggestion"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
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
      <Button
        variant="default"
        class="w-full"
        onclick={handleGeneratePrompt}
        disabled={suggestions.length === 0}
      >
        <FileUp class="h-5 w-5" />
        Generate Instructions
      </Button>
    <p class="mt-2 text-center text-xs text-muted-foreground">
      {suggestions.length} suggestion{suggestions.length === 1 ? '' : 's'}
    </p>
  </div>
</div>

<Dialog.Root open={showPromptModal} onOpenChange={(open) => !open && handleCloseModal()}>
  <Dialog.Overlay />
  <Dialog.Content class="max-w-3xl p-0">
    <SharedDialogHeader title="Generated Instructions" onClose={handleCloseModal} class="px-4 py-4" />

    <div class="max-h-[80vh] overflow-y-auto p-4">
      <pre class="whitespace-pre-wrap rounded-lg bg-secondary p-4 font-mono text-sm text-card-foreground">{generatedPrompt}</pre>
    </div>

    <Dialog.Footer class="border-t border-border p-4">
      <Button variant="ghost" onclick={handleCloseModal}>
        Cancel
      </Button>
      <Button variant="default" onclick={handleCopyPrompt}>
        <FileUp class="h-5 w-5" />
        Copy to Clipboard
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
