/**
 * Resolve links inside rendered Markdown against the document that contains
 * them, and build editor URLs for links to local files.
 *
 * Pure module: no DOM, no stores. See openspec change
 * `add-markdown-link-navigation` (capability `markdown-links`).
 */

export interface MarkdownLinkEntry {
  name: string;
  /** Absolute directory path (capability dir for specs, change dir for changes). */
  path: string;
}

export interface MarkdownLinkContext {
  /** Absolute path of the rendered document. */
  sourcePath: string;
  specs: readonly MarkdownLinkEntry[];
  changes: readonly MarkdownLinkEntry[];
}

export type ResolvedMarkdownLink =
  | { kind: 'anchor'; fragment: string }
  | { kind: 'external'; href: string }
  | { kind: 'unsafe' }
  | { kind: 'raw'; href: string }
  | { kind: 'spec'; name: string; route: string }
  | { kind: 'change'; name: string; route: string; filePath: string }
  | { kind: 'file'; path: string; line: number | null };

const EXTERNAL_SCHEMES = new Set(['http', 'https', 'mailto']);
const BLOCKED_TEMPLATE_SCHEMES = new Set(['javascript', 'data', 'vbscript']);
const SCHEME_PATTERN = /^([a-zA-Z][a-zA-Z0-9+.-]*):/;
const DRIVE_PATTERN = /^[a-zA-Z]:$/;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Convert backslashes to slashes so Windows paths compare like POSIX ones. */
export function toSlashPath(path: string): string {
  return path.replace(/\\/g, '/');
}

function isAbsolutePath(path: string): boolean {
  return path.startsWith('/') || /^[a-zA-Z]:\//.test(path);
}

/** Collapse `.`, `..`, duplicate and trailing slashes. Input must be absolute. */
export function normalizeAbsolutePath(path: string): string {
  const slashPath = toSlashPath(path);
  const segments = slashPath.split('/');
  const hasDrive = DRIVE_PATTERN.test(segments[0] ?? '');
  const root = hasDrive ? segments[0] : '';
  const stack: string[] = [];

  for (const segment of segments.slice(1)) {
    if (segment === '' || segment === '.') {
      continue;
    }

    if (segment === '..') {
      stack.pop();
      continue;
    }

    stack.push(segment);
  }

  return `${root}/${stack.join('/')}`;
}

function dirname(path: string): string {
  const normalized = normalizeAbsolutePath(path);
  const index = normalized.lastIndexOf('/');
  if (index <= 0) {
    return normalized.slice(0, Math.max(index, 0)) || '/';
  }

  const parent = normalized.slice(0, index);
  return DRIVE_PATTERN.test(parent) ? `${parent}/` : parent;
}

function joinPath(base: string, relative: string): string {
  return normalizeAbsolutePath(`${base.replace(/\/$/, '')}/${relative}`);
}

function parseLineFragment(fragment: string): number | null {
  const match = /^L(\d+)/.exec(fragment);
  return match ? Number(match[1]) : null;
}

function splitLineSuffix(path: string): { path: string; line: number | null } {
  const match = /^(.*[^/:]):(\d+)(?::\d+)?$/.exec(path);
  if (!match || DRIVE_PATTERN.test(match[1])) {
    return { path, line: null };
  }

  return { path: match[1], line: Number(match[2]) };
}

export function specRoute(name: string): string {
  return `/specs/${encodeURIComponent(name)}`;
}

export function changeRoute(name: string): string {
  return `/changes/${encodeURIComponent(name)}`;
}

function findSpec(target: string, specs: readonly MarkdownLinkEntry[]): MarkdownLinkEntry | null {
  for (const spec of specs) {
    const dir = normalizeAbsolutePath(spec.path);
    if (target === dir || target === `${dir}/spec.md`) {
      return spec;
    }
  }

  return null;
}

function findChange(
  target: string,
  changes: readonly MarkdownLinkEntry[],
): { change: MarkdownLinkEntry; filePath: string } | null {
  let best: { change: MarkdownLinkEntry; dir: string } | null = null;

  for (const change of changes) {
    const dir = normalizeAbsolutePath(change.path);
    if ((target === dir || target.startsWith(`${dir}/`)) && (!best || dir.length > best.dir.length)) {
      best = { change, dir };
    }
  }

  if (!best) {
    return null;
  }

  return {
    change: best.change,
    filePath: target === best.dir ? '' : target.slice(best.dir.length + 1),
  };
}

/**
 * Classify an href found in a Markdown document.
 * Without a context, relative and absolute paths are returned as `raw`.
 */
export function resolveMarkdownLink(href: string, context?: MarkdownLinkContext | null): ResolvedMarkdownLink {
  const trimmed = href.trim();

  if (trimmed.startsWith('#')) {
    return { kind: 'anchor', fragment: safeDecode(trimmed.slice(1)) };
  }

  const schemeMatch = SCHEME_PATTERN.exec(trimmed);
  if (schemeMatch && schemeMatch[1].length > 1) {
    const scheme = schemeMatch[1].toLowerCase();
    if (EXTERNAL_SCHEMES.has(scheme)) {
      return { kind: 'external', href: trimmed };
    }

    if (scheme === 'file') {
      return resolveMarkdownLink(trimmed.replace(/^file:\/\//i, ''), context);
    }

    return { kind: 'unsafe' };
  }

  if (trimmed.startsWith('//')) {
    return { kind: 'external', href: `https:${trimmed}` };
  }

  if (!context || !trimmed) {
    return { kind: 'raw', href: trimmed };
  }

  const hashIndex = trimmed.indexOf('#');
  const fragment = hashIndex >= 0 ? trimmed.slice(hashIndex + 1) : '';
  const withoutFragment = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;
  const withoutQuery = withoutFragment.split('?', 1)[0];
  const decoded = toSlashPath(safeDecode(withoutQuery));
  const suffix = splitLineSuffix(decoded);
  const line = parseLineFragment(fragment) ?? suffix.line;

  const target = isAbsolutePath(suffix.path)
    ? normalizeAbsolutePath(suffix.path)
    : joinPath(dirname(context.sourcePath), suffix.path);

  const spec = findSpec(target, context.specs);
  if (spec) {
    return { kind: 'spec', name: spec.name, route: specRoute(spec.name) };
  }

  const changeMatch = findChange(target, context.changes);
  if (changeMatch) {
    return {
      kind: 'change',
      name: changeMatch.change.name,
      route: changeRoute(changeMatch.change.name),
      filePath: changeMatch.filePath,
    };
  }

  return { kind: 'file', path: target, line };
}

// ---------------------------------------------------------------------------
// Change file targets
// ---------------------------------------------------------------------------

export interface ChangeLinkMatchLocation {
  fileGroupName?: string;
  fileName?: string;
  specDeltaCapability?: string;
  otherFilePath?: string;
}

export interface ChangeLinkShape {
  fileGroups: readonly { name: string; files: readonly { name: string; path: string }[] }[];
  specDeltas: readonly { capability: string }[];
  otherFiles: readonly { path: string }[];
}

/** Map a path relative to a change directory to the ChangeViewer location that shows it. */
export function matchLocationForChangeFile(
  change: ChangeLinkShape,
  filePath: string,
): ChangeLinkMatchLocation | null {
  const relative = toSlashPath(filePath).replace(/\/$/, '');
  if (!relative) {
    return null;
  }

  for (const group of change.fileGroups) {
    for (const file of group.files) {
      if (toSlashPath(file.path) === relative) {
        return { fileGroupName: group.name, fileName: file.name };
      }
    }
  }

  const deltaMatch = /^specs\/(.+?)(?:\/spec\.md)?$/.exec(relative);
  if (deltaMatch) {
    const delta = change.specDeltas.find((item) => item.capability === deltaMatch[1]);
    if (delta) {
      return { specDeltaCapability: delta.capability };
    }
  }

  const otherFile = change.otherFiles.find((file) => toSlashPath(file.path) === relative);
  if (otherFile) {
    return { otherFilePath: otherFile.path };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Editor URLs
// ---------------------------------------------------------------------------

export const OPEN_FILES_WITH_OPTIONS = ['copy', 'vscode', 'cursor', 'windsurf', 'vscodium', 'antigravity', 'zed', 'custom'] as const;

export type OpenFilesWith = (typeof OPEN_FILES_WITH_OPTIONS)[number];

export type EditorPreset = Exclude<OpenFilesWith, 'copy' | 'custom'>;

const EDITOR_PRESET_SCHEMES: Record<EditorPreset, string> = {
  vscode: 'vscode',
  cursor: 'cursor',
  windsurf: 'windsurf',
  vscodium: 'vscodium',
  // Antigravity IDE registers `antigravity-ide` (product.json urlProtocol), not `antigravity`.
  antigravity: 'antigravity-ide',
  zed: 'zed',
};

export function isOpenFilesWith(value: unknown): value is OpenFilesWith {
  return typeof value === 'string' && (OPEN_FILES_WITH_OPTIONS as readonly string[]).includes(value);
}

/** Percent-encode each path segment, keeping `/` and a Windows drive letter. */
function encodePathSegments(path: string): string {
  const normalized = normalizeAbsolutePath(path);
  const encoded = normalized
    .split('/')
    .map((segment, index) => (index <= 1 && DRIVE_PATTERN.test(segment) ? segment : encodeURIComponent(segment)))
    .join('/');
  return encoded.startsWith('/') ? encoded : `/${encoded}`;
}

export function isValidEditorTemplate(template: string): boolean {
  const trimmed = template.trim();
  const match = SCHEME_PATTERN.exec(trimmed);
  if (!match || match[1].length < 2) {
    return false;
  }

  return !BLOCKED_TEMPLATE_SCHEMES.has(match[1].toLowerCase()) && trimmed.includes('{path}');
}

/**
 * Build the URL that opens `path` in the chosen editor.
 * Returns null for `copy` or an invalid custom template (caller falls back to copy).
 */
export function buildEditorUrl(
  openWith: OpenFilesWith,
  path: string,
  line: number | null,
  customTemplate = '',
): string | null {
  const lineValue = String(line ?? 1);

  if (openWith === 'copy') {
    return null;
  }

  if (openWith === 'custom') {
    if (!isValidEditorTemplate(customTemplate)) {
      return null;
    }

    return customTemplate
      .trim()
      .replaceAll('{path}', encodeURIComponent(normalizeAbsolutePath(path)))
      .replaceAll('{line}', lineValue);
  }

  return `${EDITOR_PRESET_SCHEMES[openWith]}://file${encodePathSegments(path)}:${lineValue}`;
}

// ---------------------------------------------------------------------------
// Heading slugs
// ---------------------------------------------------------------------------

export const HEADING_ID_PREFIX = 'md-';

/** GitHub-style heading slug. */
export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

export function createSlugger() {
  const seen = new Map<string, number>();

  return (text: string) => {
    const base = slugifyHeading(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}
