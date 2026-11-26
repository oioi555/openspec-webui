<script lang="ts">
  import { renderMarkdown, highlightDeltas, highlightSearchMatches } from '$lib/markdown';
  import { buildEditorUrl, type MarkdownLinkContext } from '$lib/markdownLinks';
  import { handleMarkdownLinkClick, type MarkdownLinkData } from '$lib/markdownLinkActions';
  import { activeChanges, archivedChanges, specs } from '$lib/state/appData.svelte.ts';
  import type { SearchNavigationState } from '$lib/state/search.svelte.ts';
  import { tabStore } from '$lib/state/tabs.svelte.ts';
  import { uiPreferencesStore } from '$lib/state/uiPreferences.svelte.ts';
  import { copyToClipboard } from '$lib/utils';
  import { t } from '$lib/i18n';
  import * as m from '$lib/paraglide/messages.js';

  interface Props {
    content: string;
    highlightDiff?: boolean;
    highlightQuery?: string;
    /** Absolute path of the rendered document; enables relative link resolution. */
    sourcePath?: string | null;
  }

  let { content, highlightDiff = false, highlightQuery = '', sourcePath = null }: Props = $props();

  let root = $state<HTMLDivElement | null>(null);

  let linkContext = $derived<MarkdownLinkContext | null>(
    sourcePath
      ? {
          sourcePath,
          specs: specs.value,
          changes: [...activeChanges.value, ...archivedChanges.value],
        }
      : null,
  );

  let baseHtml = $derived(
    renderMarkdown(content, {
      links: linkContext,
      openFilesWith: uiPreferencesStore.openFilesWith,
      customEditorTemplate: uiPreferencesStore.customEditorTemplate,
    }),
  );
  let decoratedHtml = $derived(highlightDiff ? highlightDeltas(baseHtml) : baseHtml);
  let html = $derived(highlightQuery ? highlightSearchMatches(decoratedHtml, highlightQuery) : decoratedHtml);

  function openChangeFile(changeName: string, route: string, filePath: string) {
    if (filePath) {
      const tabId = `change:${changeName}`;
      const current = tabStore.getViewerState<Record<string, unknown>>(tabId) ?? {};
      const searchNavigation: SearchNavigationState = { requestKey: Date.now(), changeFilePath: filePath };
      tabStore.setViewerState(tabId, { ...current, searchNavigation });
    }

    tabStore.open(route);
  }

  function openFile(path: string, line: number | null) {
    const url = buildEditorUrl(
      uiPreferencesStore.openFilesWith,
      path,
      line,
      uiPreferencesStore.customEditorTemplate,
    );

    if (url) {
      window.location.href = url;
      return;
    }

    void copyToClipboard(path, t(m.markdown_link_path_label));
  }

  function scrollToId(id: string) {
    const target = root?.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return Boolean(target);
  }

  function handleClick(event: MouseEvent) {
    const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-md-link]');
    if (!anchor || !root?.contains(anchor)) {
      return;
    }

    const handled = handleMarkdownLinkClick(anchor.dataset as MarkdownLinkData, event, {
      openRoute: (route) => tabStore.open(route),
      openChangeFile,
      scrollToId,
      openFile,
    });

    if (handled) {
      event.preventDefault();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="markdown-body prose max-w-none" bind:this={root} onclick={handleClick}>
  {@html html}
</div>
