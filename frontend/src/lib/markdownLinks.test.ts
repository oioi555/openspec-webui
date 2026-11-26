import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildEditorUrl,
  createSlugger,
  isValidEditorTemplate,
  matchLocationForChangeFile,
  normalizeAbsolutePath,
  resolveMarkdownLink,
  type MarkdownLinkContext,
} from './markdownLinks';

const ROOT = '/repo/openspec';

function context(sourcePath: string): MarkdownLinkContext {
  return {
    sourcePath,
    specs: [
      { name: 'auth', path: `${ROOT}/specs/auth` },
      { name: 'identity', path: `${ROOT}/specs/identity` },
      { name: 'identity/user-auth', path: `${ROOT}/specs/identity/user-auth` },
    ],
    changes: [
      { name: 'add-auth', path: `${ROOT}/changes/add-auth` },
      { name: '2026-01-02-old-change', path: `${ROOT}/changes/archive/2026-01-02-old-change` },
    ],
  };
}

const proposal = context(`${ROOT}/changes/add-auth/proposal.md`);

test('fragment-only links are anchors', () => {
  assert.deepEqual(resolveMarkdownLink('#requirement-user-login', proposal), {
    kind: 'anchor',
    fragment: 'requirement-user-login',
  });
});

test('http, https and mailto links are external; protocol-relative links become https', () => {
  assert.equal(resolveMarkdownLink('https://example.com/docs', proposal).kind, 'external');
  assert.equal(resolveMarkdownLink('http://example.com', proposal).kind, 'external');
  assert.equal(resolveMarkdownLink('mailto:a@example.com', proposal).kind, 'external');
  assert.deepEqual(resolveMarkdownLink('//example.com/x', proposal), { kind: 'external', href: 'https://example.com/x' });
});

test('script and data links are unsafe', () => {
  assert.deepEqual(resolveMarkdownLink('javascript:alert(1)', proposal), { kind: 'unsafe' });
  assert.deepEqual(resolveMarkdownLink('JavaScript:alert(1)', proposal), { kind: 'unsafe' });
  assert.deepEqual(resolveMarkdownLink('data:text/html,hi', proposal), { kind: 'unsafe' });
});

test('relative links stay raw without a context', () => {
  assert.deepEqual(resolveMarkdownLink('./design.md'), { kind: 'raw', href: './design.md' });
});

test('relative link from a change proposal resolves to a main spec', () => {
  assert.deepEqual(resolveMarkdownLink('../../specs/auth/spec.md', proposal), {
    kind: 'spec',
    name: 'auth',
    route: '/specs/auth',
  });
});

test('nested capability directory resolves to the nested spec, not its parent', () => {
  assert.deepEqual(resolveMarkdownLink('../../specs/identity/user-auth/', proposal), {
    kind: 'spec',
    name: 'identity/user-auth',
    route: '/specs/identity%2Fuser-auth',
  });
});

test('relative link from a delta spec resolves to the change design', () => {
  const delta = context(`${ROOT}/changes/add-auth/specs/auth/spec.md`);
  assert.deepEqual(resolveMarkdownLink('../../design.md', delta), {
    kind: 'change',
    name: 'add-auth',
    route: '/changes/add-auth',
    filePath: 'design.md',
  });
});

test('same-change sibling links resolve to the change with a relative file path', () => {
  assert.deepEqual(resolveMarkdownLink('./tasks.md', proposal), {
    kind: 'change',
    name: 'add-auth',
    route: '/changes/add-auth',
    filePath: 'tasks.md',
  });
});

test('archived change directory resolves to the archived change', () => {
  assert.deepEqual(resolveMarkdownLink('../archive/2026-01-02-old-change/', proposal), {
    kind: 'change',
    name: '2026-01-02-old-change',
    route: '/changes/2026-01-02-old-change',
    filePath: '',
  });
});

test('the most specific change directory wins', () => {
  const ctx: MarkdownLinkContext = {
    ...proposal,
    changes: [
      { name: 'outer', path: `${ROOT}/changes/outer` },
      { name: 'inner', path: `${ROOT}/changes/outer/inner` },
    ],
  };
  const resolved = resolveMarkdownLink(`${ROOT}/changes/outer/inner/proposal.md`, ctx);
  assert.equal(resolved.kind === 'change' && resolved.name, 'inner');
});

test('links outside OpenSpec targets are local files with optional line numbers', () => {
  assert.deepEqual(resolveMarkdownLink('../../../src/server/index.ts', proposal), {
    kind: 'file',
    path: '/repo/src/server/index.ts',
    line: null,
  });
  assert.deepEqual(resolveMarkdownLink('../../../src/server/index.ts#L42', proposal), {
    kind: 'file',
    path: '/repo/src/server/index.ts',
    line: 42,
  });
  assert.deepEqual(resolveMarkdownLink('../../../src/server/index.ts:7', proposal), {
    kind: 'file',
    path: '/repo/src/server/index.ts',
    line: 7,
  });
});

test('percent-encoded and absolute paths resolve', () => {
  assert.deepEqual(resolveMarkdownLink('../../../docs/my%20notes.md', proposal), {
    kind: 'file',
    path: '/repo/docs/my notes.md',
    line: null,
  });
  assert.deepEqual(resolveMarkdownLink('/etc/hosts', proposal), { kind: 'file', path: '/etc/hosts', line: null });
});

test('Windows source paths resolve with forward slashes', () => {
  const ctx: MarkdownLinkContext = {
    sourcePath: 'C:\\repo\\openspec\\changes\\add-auth\\proposal.md',
    specs: [{ name: 'auth', path: 'C:\\repo\\openspec\\specs\\auth' }],
    changes: [{ name: 'add-auth', path: 'C:\\repo\\openspec\\changes\\add-auth' }],
  };
  assert.equal(resolveMarkdownLink('../../specs/auth/spec.md', ctx).kind, 'spec');
  assert.deepEqual(resolveMarkdownLink('../../../src/a.ts', ctx), { kind: 'file', path: 'C:/repo/src/a.ts', line: null });
  assert.equal(normalizeAbsolutePath('C:\\a\\..\\b'), 'C:/b');
});

test('matchLocationForChangeFile maps core files, delta specs and other files', () => {
  const change = {
    fileGroups: [
      { name: 'Proposal', files: [{ name: 'proposal', path: 'proposal.md' }] },
      { name: 'Tasks', files: [{ name: 'tasks', path: 'tasks.md' }] },
      { name: 'Notes', files: [{ name: 'a', path: 'notes/a.md' }] },
    ],
    specDeltas: [{ capability: 'auth' }, { capability: 'identity/user-auth' }],
    otherFiles: [{ path: 'revisions.json' }],
  };

  assert.deepEqual(matchLocationForChangeFile(change, 'tasks.md'), { fileGroupName: 'Tasks', fileName: 'tasks' });
  assert.deepEqual(matchLocationForChangeFile(change, 'notes/a.md'), { fileGroupName: 'Notes', fileName: 'a' });
  assert.deepEqual(matchLocationForChangeFile(change, 'specs/auth/spec.md'), { specDeltaCapability: 'auth' });
  assert.deepEqual(matchLocationForChangeFile(change, 'specs/identity/user-auth'), {
    specDeltaCapability: 'identity/user-auth',
  });
  assert.deepEqual(matchLocationForChangeFile(change, 'revisions.json'), { otherFilePath: 'revisions.json' });
  assert.equal(matchLocationForChangeFile(change, ''), null);
  assert.equal(matchLocationForChangeFile(change, 'missing.md'), null);
});

test('buildEditorUrl builds preset URLs with encoded segments and default line', () => {
  assert.equal(buildEditorUrl('vscode', '/repo/src/server/index.ts', 42), 'vscode://file/repo/src/server/index.ts:42');
  assert.equal(buildEditorUrl('cursor', '/repo/a b.ts', null), 'cursor://file/repo/a%20b.ts:1');
  assert.equal(buildEditorUrl('windsurf', '/x.ts', 3), 'windsurf://file/x.ts:3');
  assert.equal(buildEditorUrl('vscodium', '/x.ts', 3), 'vscodium://file/x.ts:3');
  assert.equal(buildEditorUrl('antigravity', '/x.ts', 3), 'antigravity-ide://file/x.ts:3');
  assert.equal(buildEditorUrl('zed', '/x.ts', 3), 'zed://file/x.ts:3');
  assert.equal(buildEditorUrl('vscode', 'C:\\repo\\a.ts', 2), 'vscode://file/C:/repo/a.ts:2');
  assert.equal(buildEditorUrl('copy', '/x.ts', 1), null);
});

test('custom editor templates replace placeholders and reject unsafe templates', () => {
  assert.equal(
    buildEditorUrl('custom', '/repo/a b.ts', null, 'myeditor://open?file={path}&line={line}'),
    'myeditor://open?file=%2Frepo%2Fa%20b.ts&line=1',
  );
  assert.equal(isValidEditorTemplate('myeditor://open?file={path}'), true);
  assert.equal(isValidEditorTemplate('javascript:alert("{path}")'), false);
  assert.equal(isValidEditorTemplate('data:text/html,{path}'), false);
  assert.equal(isValidEditorTemplate('vbscript:{path}'), false);
  assert.equal(isValidEditorTemplate('/no/scheme/{path}'), false);
  assert.equal(isValidEditorTemplate('myeditor://open'), false);
  assert.equal(buildEditorUrl('custom', '/x.ts', 1, 'javascript:{path}'), null);
});

test('slugger produces GitHub-style ids with duplicate suffixes', () => {
  const slug = createSlugger();
  assert.equal(slug('Requirement: User login'), 'requirement-user-login');
  assert.equal(slug('Requirement: User login'), 'requirement-user-login-1');
  assert.equal(slug('日本語 見出し'), '日本語-見出し');
});
