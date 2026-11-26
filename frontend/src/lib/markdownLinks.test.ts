import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildEditorUrl,
  isViewableChangePath,
  createSlugger,
  isValidEditorTemplate,
  matchLocationForChangeFile,
  normalizeAbsolutePath,
  preArchiveSourcePath,
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

test('line fragments accept bare numbers and ranges, using the start line', () => {
  for (const [href, line] of [
    ['../../../src/a.ts#42', 42],
    ['../../../src/a.ts#849-851', 849],
    ['../../../src/a.ts#L10-20', 10],
    ['../../../src/a.ts#L10-L20', 10],
    ['../../../src/a.ts#L7', 7],
  ] as const) {
    assert.deepEqual(resolveMarkdownLink(href, proposal), { kind: 'file', path: '/repo/src/a.ts', line }, href);
  }

  assert.deepEqual(resolveMarkdownLink('file:///repo/src/jobs.py#849-851', proposal), {
    kind: 'file',
    path: '/repo/src/jobs.py',
    line: 849,
  });
  assert.deepEqual(resolveMarkdownLink('../../../src/a.ts#section-1', proposal), {
    kind: 'file',
    path: '/repo/src/a.ts',
    line: null,
  });
});

test('change files the ChangeViewer cannot show resolve as local files', () => {
  assert.deepEqual(resolveMarkdownLink('evidence/pytest-full.txt', proposal), {
    kind: 'file',
    path: `${ROOT}/changes/add-auth/evidence/pytest-full.txt`,
    line: null,
  });
  assert.equal(resolveMarkdownLink('evidence/report.json', proposal).kind, 'file');
  assert.equal(resolveMarkdownLink('evidence/', proposal).kind, 'file');
  assert.equal(resolveMarkdownLink('notes/a.md', proposal).kind, 'change');
  assert.equal(resolveMarkdownLink('revisions.json', proposal).kind, 'change');
  assert.equal(resolveMarkdownLink('specs/auth/spec.md', proposal).kind, 'change');
  assert.equal(resolveMarkdownLink('specs/identity/user-auth/', proposal).kind, 'change');
  assert.equal(resolveMarkdownLink('specs/auth/notes.txt', proposal).kind, 'file');
});

test('isViewableChangePath mirrors what the ChangeViewer shows', () => {
  assert.equal(isViewableChangePath(''), true);
  assert.equal(isViewableChangePath('proposal.md'), true);
  assert.equal(isViewableChangePath('.openspec.yaml'), true);
  assert.equal(isViewableChangePath('specs'), true);
  assert.equal(isViewableChangePath('evidence'), false);
  assert.equal(isViewableChangePath('notes/deep/a.MD'), true);
  assert.equal(isViewableChangePath('specs/auth/spec.md'), true);
  assert.equal(isViewableChangePath('specs/auth'), true);
  assert.equal(isViewableChangePath('evidence/run.txt'), false);
  assert.equal(isViewableChangePath('evidence\\run.json'), false);
});

// ---------------------------------------------------------------------------
// Existence status and archived-change fallback
// ---------------------------------------------------------------------------

function withStatus(base: MarkdownLinkContext, statuses: Record<string, boolean | null>) {
  const unknown: string[] = [];
  return {
    unknown,
    ctx: {
      ...base,
      pathStatus: (path: string) => statuses[path],
      onUnknownPath: (path: string) => unknown.push(path),
    } satisfies MarkdownLinkContext,
  };
}

const archivedProposal = context(`${ROOT}/changes/archive/2026-01-15-add-line/proposal.md`);

test('preArchiveSourcePath maps archived documents back to their pre-archive directory', () => {
  assert.equal(
    preArchiveSourcePath(`${ROOT}/changes/archive/2026-01-15-add-line/specs/a/spec.md`),
    `${ROOT}/changes/add-line/specs/a/spec.md`,
  );
  assert.equal(preArchiveSourcePath(`${ROOT}/changes/add-line/proposal.md`), null);
  assert.equal(preArchiveSourcePath(`${ROOT}/changes/archive/no-date/proposal.md`), null);
});

test('missing, existing and unknown local targets', () => {
  const { ctx, unknown } = withStatus(proposal, { '/repo/src/gone.ts': false, '/repo/src/here.ts': true, '/etc/hosts': null });

  assert.deepEqual(resolveMarkdownLink('../../../src/gone.ts', ctx), { kind: 'file', path: '/repo/src/gone.ts', line: null, missing: true });
  assert.deepEqual(resolveMarkdownLink('../../../src/here.ts', ctx), { kind: 'file', path: '/repo/src/here.ts', line: null });
  assert.deepEqual(resolveMarkdownLink('/etc/hosts', ctx), { kind: 'file', path: '/etc/hosts', line: null });
  assert.deepEqual(resolveMarkdownLink('../../../src/new.ts', ctx), { kind: 'file', path: '/repo/src/new.ts', line: null });
  assert.deepEqual(unknown, ['/repo/src/new.ts']);
});

test('archived docs link written before archiving falls back to the pre-archive location', () => {
  const shallow = '/repo/openspec/docs/design.md';
  const real = '/repo/docs/design.md';
  const { ctx } = withStatus(archivedProposal, { [shallow]: false, [real]: true });

  assert.deepEqual(resolveMarkdownLink('../../../docs/design.md', ctx), { kind: 'file', path: real, line: null });
});

test('archived spec link written before archiving opens the spec', () => {
  const { ctx } = withStatus(archivedProposal, { [`${ROOT}/changes/specs/auth/spec.md`]: false });

  assert.deepEqual(resolveMarkdownLink('../../specs/auth/spec.md', ctx), { kind: 'spec', name: 'auth', route: '/specs/auth' });
});

test('archived link already written for the archived location keeps its first target', () => {
  const real = '/repo/docs/design.md';
  const { ctx, unknown } = withStatus(archivedProposal, { [real]: true });

  assert.deepEqual(resolveMarkdownLink('../../../../docs/design.md', ctx), { kind: 'file', path: real, line: null });
  assert.deepEqual(unknown, [], 'no fallback lookup once the first target exists');
});

test('archived fallback is not used when neither target exists, and both are requested together', () => {
  const { ctx: loading, unknown } = withStatus(archivedProposal, {});
  assert.deepEqual(resolveMarkdownLink('../../../docs/x.md', loading), { kind: 'file', path: '/repo/openspec/docs/x.md', line: null });
  assert.deepEqual(unknown, ['/repo/openspec/docs/x.md', '/repo/docs/x.md']);

  const { ctx } = withStatus(archivedProposal, { '/repo/openspec/docs/x.md': false, '/repo/docs/x.md': false });
  assert.deepEqual(resolveMarkdownLink('../../../docs/x.md', ctx), { kind: 'file', path: '/repo/openspec/docs/x.md', line: null, missing: true });
});
