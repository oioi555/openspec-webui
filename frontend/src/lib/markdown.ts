import { Marked, type Tokens } from 'marked';

import {
  buildEditorUrl,
  createSlugger,
  HEADING_ID_PREFIX,
  resolveMarkdownLink,
  type MarkdownLinkContext,
  type OpenFilesWith,
} from './markdownLinks';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function safeEncodeUri(value: string): string {
  try {
    return encodeURI(value).replace(/%25/g, '%');
  } catch {
    return value;
  }
}

export interface RenderMarkdownOptions {
  /** Resolve relative links against this document. Omit to keep raw hrefs. */
  links?: MarkdownLinkContext | null;
  openFilesWith?: OpenFilesWith;
  customEditorTemplate?: string;
  /** Tooltip for links whose target does not exist; `{path}` is replaced. */
  missingFileTitle?: string;
}

function renderAttributes(attributes: Record<string, string | null | undefined>): string {
  return Object.entries(attributes)
    .filter((entry): entry is [string, string] => entry[1] != null)
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
    .join('');
}

function renderLink(token: Tokens.Link, inner: string, options: RenderMarkdownOptions): string {
  const title = token.title ?? null;
  const resolved = resolveMarkdownLink(token.href, options.links);

  switch (resolved.kind) {
    case 'unsafe':
      return `<span class="md-link-disabled">${inner}</span>`;
    case 'external':
      return `<a${renderAttributes({
        href: safeEncodeUri(resolved.href),
        title,
        target: '_blank',
        rel: 'noopener noreferrer',
        'data-md-link': 'external',
      })}>${inner}</a>`;
    case 'anchor':
      return `<a${renderAttributes({
        href: `#${resolved.fragment}`,
        title,
        'data-md-link': 'anchor',
        'data-md-fragment': resolved.fragment,
      })}>${inner}</a>`;
    case 'raw':
      return `<a${renderAttributes({ href: safeEncodeUri(resolved.href), title })}>${inner}</a>`;
    case 'spec':
      return `<a${renderAttributes({
        href: resolved.route,
        title,
        'data-md-link': 'spec',
        'data-md-route': resolved.route,
      })}>${inner}</a>`;
    case 'change':
      return `<a${renderAttributes({
        href: resolved.route,
        title,
        'data-md-link': 'change',
        'data-md-route': resolved.route,
        'data-md-change': resolved.name,
        'data-md-change-file': resolved.filePath,
      })}>${inner}</a>`;
    case 'file': {
      const editorUrl = buildEditorUrl(
        options.openFilesWith ?? 'copy',
        resolved.path,
        resolved.line,
        options.customEditorTemplate,
      );
      const fileUrl = safeEncodeUri(`file://${resolved.path.startsWith('/') ? '' : '/'}${resolved.path}`);
      const missingTitle = (options.missingFileTitle ?? 'File not found: {path}').replace('{path}', resolved.path);
      return `<a${renderAttributes({
        // A missing target never gets an editor URL, so middle-click cannot open one either.
        href: resolved.missing ? fileUrl : editorUrl ?? fileUrl,
        title: resolved.missing ? missingTitle : title ?? resolved.path,
        class: resolved.missing ? 'md-link-missing' : null,
        'data-md-link': 'file',
        'data-md-path': resolved.path,
        'data-md-line': resolved.line == null ? null : String(resolved.line),
        'data-md-missing': resolved.missing ? 'true' : null,
      })}>${inner}</a>`;
    }
  }
}

/**
 * Render markdown to HTML.
 * Headings get `md-<slug>` ids; links are rewritten per `markdown-links`.
 */
export function renderMarkdown(content: string, options: RenderMarkdownOptions = {}): string {
  const slug = createSlugger();
  const instance = new Marked({
    gfm: true,
    breaks: true,
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        const text = this.parser.parseInline(tokens, this.parser.textRenderer);
        return `<h${depth} id="${escapeAttribute(HEADING_ID_PREFIX + slug(text))}">${inner}</h${depth}>\n`;
      },
      link(token) {
        return renderLink(token, this.parser.parseInline(token.tokens), options);
      },
    },
  });

  return instance.parse(content, { async: false }) as string;
}

/**
 * Highlight delta operations in markdown content
 * Wraps ADDED/MODIFIED/REMOVED sections with appropriate CSS classes
 */
export function highlightDeltas(html: string): string {
  // Add classes to section headers
  return html
    .replace(
      /<h2([^>]*)>ADDED\s+Requirements?<\/h2>/gi,
      '<h2$1 class="diff-added">ADDED Requirements</h2>'
    )
    .replace(
      /<h2([^>]*)>MODIFIED\s+Requirements?<\/h2>/gi,
      '<h2$1 class="diff-modified">MODIFIED Requirements</h2>'
    )
    .replace(
      /<h2([^>]*)>REMOVED\s+Requirements?<\/h2>/gi,
      '<h2$1 class="diff-removed">REMOVED Requirements</h2>'
    )
    .replace(
      /<h2([^>]*)>RENAMED\s+Requirements?<\/h2>/gi,
      '<h2$1 class="diff-modified">RENAMED Requirements</h2>'
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
