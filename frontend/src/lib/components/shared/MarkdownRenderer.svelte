<script lang="ts">
  import { renderMarkdown, highlightDeltas, highlightSearchMatches } from '$lib/markdown';

  interface Props {
    content: string;
    highlightDiff?: boolean;
    highlightQuery?: string;
  }

  let { content, highlightDiff = false, highlightQuery = '' }: Props = $props();

  let baseHtml = $derived(renderMarkdown(content));
  let decoratedHtml = $derived(highlightDiff ? highlightDeltas(baseHtml) : baseHtml);
  let html = $derived(highlightQuery ? highlightSearchMatches(decoratedHtml, highlightQuery) : decoratedHtml);
</script>

<div class="markdown-body prose max-w-none">
  {@html html}
</div>
