/**
 * Pure helpers that turn `/`-separated spec ids into a folder tree for the Specs panel.
 */

import type { SpecSummary } from './types/api';
import type { ValidationTargetState } from './state/validationCore';
import { timestampValue, type ExplorerSortMode } from './components/shared/explorer-section/sort-utils';

export interface SpecTreeNode {
  /** The node's own path segment, e.g. `token`. */
  segment: string;
  /** The full path from the root, e.g. `network/auth/token`. */
  path: string;
  /** The spec whose id equals `path`, or null for a plain folder. */
  spec: SpecSummary | null;
  children: SpecTreeNode[];
}

export interface SpecTreeRow {
  node: SpecTreeNode;
  /** 1-based depth, matching `aria-level`. */
  level: number;
  hasChildren: boolean;
  expanded: boolean;
}

export type SpecTreeSummaryState = Extract<ValidationTargetState, 'failed' | 'warning' | 'info'>;

/** Builds an unsorted tree (insertion order) from spec ids. Empty segments are ignored. */
export function buildSpecTree(specs: readonly SpecSummary[]): SpecTreeNode[] {
  const roots: SpecTreeNode[] = [];
  const byPath = new Map<string, SpecTreeNode>();

  for (const spec of specs) {
    const segments = spec.name.split('/').filter((segment) => segment.length > 0);
    if (segments.length === 0) continue;

    let siblings = roots;
    let path = '';
    let node: SpecTreeNode | undefined;
    for (const segment of segments) {
      path = path ? `${path}/${segment}` : segment;
      node = byPath.get(path);
      if (!node) {
        node = { segment, path, spec: null, children: [] };
        byPath.set(path, node);
        siblings.push(node);
      }
      siblings = node.children;
    }
    if (node && !node.spec) node.spec = spec;
  }

  return roots;
}

/** Newest `lastModified` timestamp among the node and all its descendants (0 if none). */
export function newestTimestamp(node: SpecTreeNode): number {
  let newest = timestampValue(node.spec?.lastModified);
  for (const child of node.children) {
    newest = Math.max(newest, newestTimestamp(child));
  }
  return newest;
}

function compareByName(a: SpecTreeNode, b: SpecTreeNode): number {
  return a.segment.localeCompare(b.segment);
}

/**
 * Returns a recursively sorted copy of the tree. Sorting only reorders siblings.
 * - `name`: nodes with children first, then plain specs, each alphabetical.
 * - `date`: newest first by the newest descendant (including the node itself); ties by name.
 */
export function sortSpecTree(nodes: readonly SpecTreeNode[], mode: ExplorerSortMode): SpecTreeNode[] {
  const sorted = nodes.map((node) => ({ ...node, children: sortSpecTree(node.children, mode) }));
  if (mode === 'date') {
    const times = new Map(sorted.map((node) => [node, newestTimestamp(node)]));
    sorted.sort((a, b) => (times.get(b)! - times.get(a)!) || compareByName(a, b));
  } else {
    sorted.sort((a, b) => {
      const folderDiff = Number(b.children.length > 0) - Number(a.children.length > 0);
      return folderDiff || compareByName(a, b);
    });
  }
  return sorted;
}

/**
 * Number of specs contained below the node at any depth, EXCLUDING the node's own spec.
 * A folder row shows this count; a node that is both a spec and a folder counts only its descendants.
 */
export function countSpecs(node: SpecTreeNode): number {
  let count = 0;
  for (const child of node.children) {
    count += (child.spec ? 1 : 0) + countSpecs(child);
  }
  return count;
}

const SEVERITY: Record<SpecTreeSummaryState, number> = { info: 1, warning: 2, failed: 3 };

/**
 * Most severe attention state (`failed` > `warning` > `info`) among the node's descendant specs,
 * excluding its own spec (whose state the row shows already). Null when none needs attention.
 */
export function summarizeValidation(
  node: SpecTreeNode,
  stateForSpec: (name: string) => ValidationTargetState,
): SpecTreeSummaryState | null {
  let worst: SpecTreeSummaryState | null = null;
  const visit = (current: SpecTreeNode) => {
    for (const child of current.children) {
      if (child.spec) {
        const state = stateForSpec(child.spec.name);
        if (state in SEVERITY) {
          const candidate = state as SpecTreeSummaryState;
          if (!worst || SEVERITY[candidate] > SEVERITY[worst]) worst = candidate;
        }
      }
      if (worst === 'failed') return;
      visit(child);
    }
  };
  visit(node);
  return worst;
}

/** Flattens the visible rows in display order; children of collapsed nodes are skipped. */
export function flattenVisibleRows(nodes: readonly SpecTreeNode[], expanded: ReadonlySet<string>): SpecTreeRow[] {
  const rows: SpecTreeRow[] = [];
  const visit = (list: readonly SpecTreeNode[], level: number) => {
    for (const node of list) {
      const hasChildren = node.children.length > 0;
      const isExpanded = hasChildren && expanded.has(node.path);
      rows.push({ node, level, hasChildren, expanded: isExpanded });
      if (isExpanded) visit(node.children, level + 1);
    }
  };
  visit(nodes, 1);
  return rows;
}

/** Ancestor folder paths of a spec id, outermost first: `a/b/c` → `['a', 'a/b']`. */
export function ancestorPaths(specName: string): string[] {
  const segments = specName.split('/').filter((segment) => segment.length > 0);
  const result: string[] = [];
  for (let index = 1; index < segments.length; index += 1) {
    result.push(segments.slice(0, index).join('/'));
  }
  return result;
}

/** Paths of every node that has children (expandable folders). */
export function collectFolderPaths(nodes: readonly SpecTreeNode[]): string[] {
  const result: string[] = [];
  const visit = (list: readonly SpecTreeNode[]) => {
    for (const node of list) {
      if (node.children.length > 0) {
        result.push(node.path);
        visit(node.children);
      }
    }
  };
  visit(nodes);
  return result;
}

export type SpecTreeKeyAction =
  | { type: 'focus'; index: number }
  | { type: 'expand'; path: string }
  | { type: 'collapse'; path: string }
  /** Open the spec when the row has one, otherwise toggle the folder. */
  | { type: 'activate'; row: SpecTreeRow }
  | { type: 'none' };

/**
 * WAI-ARIA tree keyboard handling over the flattened visible rows.
 * Supports ArrowUp, ArrowDown, ArrowRight, ArrowLeft, Enter, Home, and End.
 */
export function nextTreeFocus(rows: readonly SpecTreeRow[], focusedIndex: number, key: string): SpecTreeKeyAction {
  const row = rows[focusedIndex];
  if (!row) {
    return rows.length > 0 && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)
      ? { type: 'focus', index: key === 'ArrowUp' || key === 'End' ? rows.length - 1 : 0 }
      : { type: 'none' };
  }

  switch (key) {
    case 'ArrowDown':
      return focusedIndex < rows.length - 1 ? { type: 'focus', index: focusedIndex + 1 } : { type: 'none' };
    case 'ArrowUp':
      return focusedIndex > 0 ? { type: 'focus', index: focusedIndex - 1 } : { type: 'none' };
    case 'Home':
      return focusedIndex !== 0 ? { type: 'focus', index: 0 } : { type: 'none' };
    case 'End':
      return focusedIndex !== rows.length - 1 ? { type: 'focus', index: rows.length - 1 } : { type: 'none' };
    case 'ArrowRight':
      if (!row.hasChildren) return { type: 'none' };
      if (!row.expanded) return { type: 'expand', path: row.node.path };
      return { type: 'focus', index: focusedIndex + 1 };
    case 'ArrowLeft': {
      if (row.hasChildren && row.expanded) return { type: 'collapse', path: row.node.path };
      for (let index = focusedIndex - 1; index >= 0; index -= 1) {
        if (rows[index].level < row.level) return { type: 'focus', index };
      }
      return { type: 'none' };
    }
    case 'Enter':
      return { type: 'activate', row };
    default:
      return { type: 'none' };
  }
}
