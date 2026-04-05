<script lang="ts">
  import { tick } from 'svelte';
  import { renderMarkdown, renderMarkdownWithBlocks, highlightDeltas } from '../lib/markdown';
  import { suggestionStore, blockSuggestionMap } from '../stores/suggestions.svelte.ts';

  interface Props {
    content: string;
    highlightDiff?: boolean;
    suggestionModeEnabled?: boolean;
  }

  let { content, highlightDiff = false, suggestionModeEnabled = false }: Props = $props();

  let containerElement = $state<HTMLDivElement | null>(null);

  let baseHtml = $derived(
    suggestionModeEnabled
    ? renderMarkdownWithBlocks(content)
    : renderMarkdown(content)
  );
  let html = $derived(highlightDiff ? highlightDeltas(baseHtml) : baseHtml);
  let suggestionMap = $derived(blockSuggestionMap.value);
  let selectedBlockId = $derived(suggestionStore.selectedBlockId);

  function handleBlockClick(event: MouseEvent) {
    if (!suggestionModeEnabled) {
      return;
    }

    const target = event.target as HTMLElement;
    const block = target.closest('.suggestion-block') as HTMLElement | null;

    if (block) {
      event.preventDefault();
      event.stopPropagation();

      const blockId = block.getAttribute('data-block-id');
      if (blockId) {
        const rect = block.getBoundingClientRect();
        suggestionStore.selectBlock(blockId, {
          x: rect.left + rect.width / 2,
          y: rect.bottom + 8,
        });
      }
    }
  }

  function updateBlockClasses() {
    if (!containerElement) {
      return;
    }

    const blocks = containerElement.querySelectorAll('.suggestion-block');
    blocks.forEach((block) => {
      const blockId = block.getAttribute('data-block-id');
      if (!blockId) {
        return;
      }

      if (blockId === selectedBlockId) {
        block.classList.add('selected');
      } else {
        block.classList.remove('selected');
      }

      if (suggestionMap.has(blockId)) {
        block.classList.add('has-suggestion');
      } else {
        block.classList.remove('has-suggestion');
      }
    });
  }

  $effect(() => {
    const renderedHtml = html;
    const currentSelectedBlockId = selectedBlockId;
    const currentSuggestionMap = suggestionMap;

    if (!containerElement || !suggestionModeEnabled) {
      return;
    }

    void renderedHtml;
    void currentSelectedBlockId;
    void currentSuggestionMap;

    let cancelled = false;

    void tick().then(() => {
      if (!cancelled) {
        updateBlockClasses();
      }
    });

    return () => {
      cancelled = true;
    };
  });
</script>

<div
  class="markdown-body"
  class:suggestion-mode={suggestionModeEnabled}
  bind:this={containerElement}
  onclick={handleBlockClick}
  role={suggestionModeEnabled ? "application" : undefined}
  aria-label={suggestionModeEnabled ? "Click on a text block to add a suggestion" : undefined}
>
  {@html html}
</div>
