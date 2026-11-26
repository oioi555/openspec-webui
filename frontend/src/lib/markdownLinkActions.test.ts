import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { handleMarkdownLinkClick, headingIdsForFragment, type MarkdownLinkActionDeps } from './markdownLinkActions';

const PLAIN = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };

function recorder(existingIds: string[] = []) {
  const calls: unknown[][] = [];
  const deps: MarkdownLinkActionDeps = {
    openRoute: (...args) => calls.push(['openRoute', ...args]),
    openChangeFile: (...args) => calls.push(['openChangeFile', ...args]),
    scrollToId: (id) => {
      calls.push(['scrollToId', id]);
      return existingIds.includes(id);
    },
    openFile: (...args) => calls.push(['openFile', ...args]),
  };
  return { calls, deps };
}

test('plain click on a spec link opens the spec route in the app', () => {
  const { calls, deps } = recorder();
  const handled = handleMarkdownLinkClick({ mdLink: 'spec', mdRoute: '/specs/auth' }, PLAIN, deps);

  assert.equal(handled, true);
  assert.deepEqual(calls, [['openRoute', '/specs/auth']]);
});

test('modified and middle clicks on in-app links fall through to the browser', () => {
  const { calls, deps } = recorder();

  assert.equal(handleMarkdownLinkClick({ mdLink: 'spec', mdRoute: '/specs/auth' }, { ...PLAIN, ctrlKey: true }, deps), false);
  assert.equal(handleMarkdownLinkClick({ mdLink: 'spec', mdRoute: '/specs/auth' }, { ...PLAIN, metaKey: true }, deps), false);
  assert.equal(
    handleMarkdownLinkClick({ mdLink: 'change', mdRoute: '/changes/a', mdChange: 'a' }, { ...PLAIN, button: 1 }, deps),
    false,
  );
  assert.deepEqual(calls, []);
});

test('change links pass the change name and relative file path', () => {
  const { calls, deps } = recorder();
  handleMarkdownLinkClick(
    { mdLink: 'change', mdRoute: '/changes/add-auth', mdChange: 'add-auth', mdChangeFile: 'tasks.md' },
    PLAIN,
    deps,
  );

  assert.deepEqual(calls, [['openChangeFile', 'add-auth', '/changes/add-auth', 'tasks.md']]);
});

test('fragment links scroll within the renderer and never navigate', () => {
  const { calls, deps } = recorder(['md-requirement-user-login']);
  const handled = handleMarkdownLinkClick({ mdLink: 'anchor', mdFragment: 'Requirement: User login' }, PLAIN, deps);

  assert.equal(handled, true);
  assert.deepEqual(calls, [
    ['scrollToId', 'md-Requirement: User login'],
    ['scrollToId', 'md-requirement-user-login'],
  ]);
});

test('fragment links without a matching heading are still swallowed', () => {
  const { deps } = recorder();
  assert.equal(handleMarkdownLinkClick({ mdLink: 'anchor', mdFragment: 'missing' }, PLAIN, deps), true);
});

test('file links hand path and line to openFile', () => {
  const { calls, deps } = recorder();
  handleMarkdownLinkClick({ mdLink: 'file', mdPath: '/repo/a.ts', mdLine: '42' }, PLAIN, deps);
  handleMarkdownLinkClick({ mdLink: 'file', mdPath: '/repo/b.ts' }, PLAIN, deps);

  assert.deepEqual(calls, [
    ['openFile', '/repo/a.ts', 42],
    ['openFile', '/repo/b.ts', null],
  ]);
});

test('external and unmarked links are left to the browser', () => {
  const { calls, deps } = recorder();
  assert.equal(handleMarkdownLinkClick({ mdLink: 'external' }, PLAIN, deps), false);
  assert.equal(handleMarkdownLinkClick({}, PLAIN, deps), false);
  assert.deepEqual(calls, []);
});

test('headingIdsForFragment de-duplicates slug candidates', () => {
  assert.deepEqual(headingIdsForFragment('why'), ['md-why']);
});

test('MarkdownRenderer wires clicks through the delegated handler scoped to its root', async () => {
  const source = await readFile(new URL('./components/shared/MarkdownRenderer.svelte', import.meta.url), 'utf8');

  assert.match(source, /handleMarkdownLinkClick\(/);
  assert.match(source, /onclick=\{handleClick\}/);
  assert.match(source, /root\?\.querySelector/);
  assert.match(source, /tabStore\.open\(/);
});
