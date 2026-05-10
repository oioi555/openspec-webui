import { marked } from 'marked';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Configure marked for better rendering
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Render markdown to HTML
 */
export function renderMarkdown(content: string): string {
  return marked(content) as string;
}

/**
 * Highlight delta operations in markdown content
 * Wraps ADDED/MODIFIED/REMOVED sections with appropriate CSS classes
 */
export function highlightDeltas(html: string): string {
  // Add classes to section headers
  return html
    .replace(
      /<h2>ADDED\s+Requirements?<\/h2>/gi,
      '<h2 class="diff-added">ADDED Requirements</h2>'
    )
    .replace(
      /<h2>MODIFIED\s+Requirements?<\/h2>/gi,
      '<h2 class="diff-modified">MODIFIED Requirements</h2>'
    )
    .replace(
      /<h2>REMOVED\s+Requirements?<\/h2>/gi,
      '<h2 class="diff-removed">REMOVED Requirements</h2>'
    )
    .replace(
      /<h2>RENAMED\s+Requirements?<\/h2>/gi,
      '<h2 class="diff-modified">RENAMED Requirements</h2>'
    );
}

export function highlightSearchMatches(html: string, query: string): string {
  if (!html || !query) {
    return html;
  }

  const matcher = new RegExp(escapeRegExp(query), 'gi');

  return html
    .split(/(<[^>]+>)/g)
    .map((segment) => {
      if (!segment || segment.startsWith('<')) {
        return segment;
      }

      return segment.replace(matcher, (match) => `<mark class="search-highlight">${match}</mark>`);
    })
    .join('');
}
