import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ancestorPaths,
  buildSpecTree,
  collectFolderPaths,
  countSpecs,
  flattenVisibleRows,
  nextTreeFocus,
  sortSpecTree,
  summarizeValidation,
  type SpecTreeNode,
} from './specTree';
import type { SpecSummary } from './types/api';
import type { ValidationTargetState } from './state/validationCore';

function spec(name: string, lastModified: string | null = null): SpecSummary {
  return { name, path: `openspec/specs/${name}/spec.md`, lastModified };
}

function segments(nodes: SpecTreeNode[]) {
  return nodes.map((node) => node.segment);
}

function find(nodes: SpecTreeNode[], path: string): SpecTreeNode {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (path.startsWith(`${node.path}/`)) return find(node.children, path);
  }
  throw new Error(`missing ${path}`);
}

test('flat ids become top-level spec nodes without children', () => {
  const tree = buildSpecTree([spec('alpha'), spec('beta')]);
  assert.deepEqual(segments(tree), ['alpha', 'beta']);
  assert.ok(tree.every((node) => node.spec && node.children.length === 0));
  assert.deepEqual(collectFolderPaths(tree), []);
});

test('three nested levels create folder nodes with full paths', () => {
  const tree = buildSpecTree([spec('network/auth/token'), spec('billing/invoice')]);
  assert.deepEqual(segments(tree), ['network', 'billing']);
  const auth = find(tree, 'network/auth');
  assert.equal(auth.spec, null);
  assert.equal(auth.children[0].path, 'network/auth/token');
  assert.equal(auth.children[0].spec?.name, 'network/auth/token');
  assert.deepEqual(collectFolderPaths(tree), ['network', 'network/auth', 'billing']);
});

test('a spec that also has children is one node with both', () => {
  for (const order of [['network', 'network/auth'], ['network/auth', 'network']]) {
    const tree = buildSpecTree(order.map((name) => spec(name)));
    assert.equal(tree.length, 1);
    assert.equal(tree[0].spec?.name, 'network');
    assert.deepEqual(segments(tree[0].children), ['auth']);
  }
});

test('a top-level spec sits next to folders and empty segments are ignored', () => {
  const tree = buildSpecTree([spec('architecture-overview'), spec('storage//blob/'), spec('')]);
  assert.deepEqual(segments(tree), ['architecture-overview', 'storage']);
  assert.equal(find(tree, 'storage/blob').spec?.name, 'storage//blob/');
});

test('Name order lists folders first', () => {
  const tree = sortSpecTree(
    buildSpecTree([spec('storage/blob'), spec('architecture-overview'), spec('billing/invoice')]),
    'name',
  );
  assert.deepEqual(segments(tree), ['billing', 'storage', 'architecture-overview']);
});

test('Date order keeps categories together', () => {
  const tree = sortSpecTree(
    buildSpecTree([
      spec('billing/invoice', '2026-01-03T00:00:00Z'),
      spec('billing/refund', '2026-01-04T00:00:00Z'),
      spec('network/auth/token', '2026-01-09T00:00:00Z'),
      spec('network/dns', '2026-01-01T00:00:00Z'),
      spec('architecture-overview', '2026-01-05T00:00:00Z'),
    ]),
    'date',
  );
  assert.deepEqual(segments(tree), ['network', 'architecture-overview', 'billing']);
  assert.deepEqual(segments(find(tree, 'network').children), ['auth', 'dns']);
  assert.deepEqual(segments(find(tree, 'billing').children), ['refund', 'invoice']);
});

test('Date order falls back to name on ties', () => {
  const tree = sortSpecTree(buildSpecTree([spec('beta'), spec('alpha')]), 'date');
  assert.deepEqual(segments(tree), ['alpha', 'beta']);
});

test('Folder row shows its spec count, excluding its own spec', () => {
  const tree = buildSpecTree([
    spec('network'),
    spec('network/auth'),
    spec('network/auth/token'),
    spec('network/auth/session'),
    spec('network/auth/oauth'),
    spec('network/dns'),
  ]);
  // network/auth contains three specs; network contains those plus network/auth and network/dns.
  assert.equal(countSpecs(find(tree, 'network/auth')), 3);
  assert.equal(countSpecs(find(tree, 'network')), 5);
  assert.equal(countSpecs(find(tree, 'network/dns')), 0);
});

test('Folder row surfaces a failing descendant', () => {
  const tree = buildSpecTree([spec('billing/invoice'), spec('billing/tax/vat'), spec('billing/refund'), spec('storage/blob')]);
  const states: Record<string, ValidationTargetState> = {
    'billing/invoice': 'warning',
    'billing/tax/vat': 'failed',
    'billing/refund': 'passed',
  };
  const lookup = (name: string) => states[name] ?? 'not-run';
  assert.equal(summarizeValidation(find(tree, 'billing'), lookup), 'failed');
  assert.equal(summarizeValidation(find(tree, 'storage'), lookup), null);

  for (const quiet of ['passed', 'not-run', 'stale', 'unknown'] as const) {
    assert.equal(summarizeValidation(find(tree, 'billing'), () => quiet), null);
  }
  assert.equal(summarizeValidation(find(tree, 'billing'), (name) => (name === 'billing/refund' ? 'info' : 'passed')), 'info');
});

test('flattenVisibleRows follows expansion with 1-based levels', () => {
  const tree = sortSpecTree(buildSpecTree([spec('network/auth/token'), spec('network/dns'), spec('billing/invoice')]), 'name');
  assert.deepEqual(
    flattenVisibleRows(tree, new Set()).map((row) => [row.node.path, row.level, row.hasChildren, row.expanded]),
    [['billing', 1, true, false], ['network', 1, true, false]],
  );
  assert.deepEqual(
    flattenVisibleRows(tree, new Set(['network', 'network/auth', 'missing'])).map((row) => [row.node.path, row.level]),
    [['billing', 1], ['network', 1], ['network/auth', 2], ['network/auth/token', 3], ['network/dns', 2]],
  );
  // A collapsed parent hides an expanded descendant.
  assert.equal(flattenVisibleRows(tree, new Set(['network/auth'])).length, 2);
});

test('ancestorPaths lists outer folders first', () => {
  assert.deepEqual(ancestorPaths('network/auth/token'), ['network', 'network/auth']);
  assert.deepEqual(ancestorPaths('architecture-overview'), []);
});

test('nextTreeFocus follows the WAI-ARIA tree pattern', () => {
  const tree = buildSpecTree([spec('network/auth/token'), spec('architecture-overview')]);
  const collapsed = flattenVisibleRows(tree, new Set());
  assert.deepEqual(nextTreeFocus(collapsed, 0, 'ArrowRight'), { type: 'expand', path: 'network' });
  assert.deepEqual(nextTreeFocus(collapsed, 0, 'ArrowDown'), { type: 'focus', index: 1 });
  assert.deepEqual(nextTreeFocus(collapsed, 1, 'ArrowDown'), { type: 'none' });
  assert.deepEqual(nextTreeFocus(collapsed, 0, 'ArrowUp'), { type: 'none' });
  assert.deepEqual(nextTreeFocus(collapsed, 1, 'ArrowRight'), { type: 'none' });
  assert.deepEqual(nextTreeFocus(collapsed, 0, 'ArrowLeft'), { type: 'none' });

  const rows = flattenVisibleRows(tree, new Set(['network', 'network/auth']));
  // network, network/auth, network/auth/token, architecture-overview
  assert.deepEqual(nextTreeFocus(rows, 0, 'ArrowRight'), { type: 'focus', index: 1 });
  assert.deepEqual(nextTreeFocus(rows, 0, 'ArrowLeft'), { type: 'collapse', path: 'network' });
  assert.deepEqual(nextTreeFocus(rows, 2, 'ArrowLeft'), { type: 'focus', index: 1 });
  assert.deepEqual(nextTreeFocus(rows, 2, 'Enter'), { type: 'activate', row: rows[2] });
  assert.deepEqual(nextTreeFocus(rows, 1, 'Home'), { type: 'focus', index: 0 });
  assert.deepEqual(nextTreeFocus(rows, 1, 'End'), { type: 'focus', index: 3 });
  assert.deepEqual(nextTreeFocus(rows, 1, 'a'), { type: 'none' });
  assert.deepEqual(nextTreeFocus(rows, -1, 'ArrowDown'), { type: 'focus', index: 0 });
  assert.deepEqual(nextTreeFocus([], 0, 'ArrowDown'), { type: 'none' });
});
