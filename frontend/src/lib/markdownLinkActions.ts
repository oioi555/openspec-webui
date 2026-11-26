/**
 * Click handling for links rendered by `renderMarkdown()`.
 * Kept free of DOM and store imports so it can be unit tested.
 */

import { slugifyHeading, HEADING_ID_PREFIX } from './markdownLinks';

export interface MarkdownLinkClickEvent {
  button: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export interface MarkdownLinkData {
  mdLink?: string;
  mdRoute?: string;
  mdChange?: string;
  mdChangeFile?: string;
  mdFragment?: string;
  mdPath?: string;
  mdLine?: string;
  mdMissing?: string;
}

export interface MarkdownLinkActionDeps {
  openRoute(route: string): void;
  openChangeFile(changeName: string, route: string, filePath: string): void;
  /** Scroll to the element with this id inside the renderer root; return false if absent. */
  scrollToId(id: string): boolean;
  openFile(path: string, line: number | null, missing: boolean): void;
}

function isModifiedClick(event: MarkdownLinkClickEvent): boolean {
  return event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
}

/** Candidate heading ids for a fragment, most exact first. */
export function headingIdsForFragment(fragment: string): string[] {
  const ids = [`${HEADING_ID_PREFIX}${fragment}`, `${HEADING_ID_PREFIX}${slugifyHeading(fragment)}`];
  return [...new Set(ids)];
}

/**
 * Handle a click on a rendered Markdown link.
 * Returns true when the click was handled and the default navigation must be prevented.
 */
export function handleMarkdownLinkClick(
  data: MarkdownLinkData,
  event: MarkdownLinkClickEvent,
  deps: MarkdownLinkActionDeps,
): boolean {
  switch (data.mdLink) {
    case 'anchor': {
      // Never let a fragment change the WebUI route.
      if (data.mdFragment) {
        headingIdsForFragment(data.mdFragment).some((id) => deps.scrollToId(id));
      }
      return true;
    }
    case 'spec': {
      if (isModifiedClick(event) || !data.mdRoute) {
        return false;
      }
      deps.openRoute(data.mdRoute);
      return true;
    }
    case 'change': {
      if (isModifiedClick(event) || !data.mdRoute || !data.mdChange) {
        return false;
      }
      deps.openChangeFile(data.mdChange, data.mdRoute, data.mdChangeFile ?? '');
      return true;
    }
    case 'file': {
      if (isModifiedClick(event) || !data.mdPath) {
        return false;
      }
      const line = data.mdLine ? Number(data.mdLine) : null;
      deps.openFile(data.mdPath, Number.isFinite(line) ? line : null, data.mdMissing === 'true');
      return true;
    }
    default:
      return false;
  }
}
