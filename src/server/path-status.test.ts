import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

import { checkPathStatuses, parsePathStatusBody, PATH_STATUS_MAX_PATHS, PathStatusRequestError } from './path-status.js';

test('checkPathStatuses reports existing and missing paths inside the roots', async () => {
  const root = await mkdtemp(join(tmpdir(), 'path-status-'));
  try {
    await mkdir(join(root, 'src'));
    await writeFile(join(root, 'src', 'index.ts'), '');

    const statuses = await checkPathStatuses(
      [join(root, 'src', 'index.ts'), join(root, 'docs', 'missing.md'), join(root, 'src')],
      [root],
    );

    assert.deepEqual(statuses, {
      [join(root, 'src', 'index.ts')]: true,
      [join(root, 'docs', 'missing.md')]: false,
      [join(root, 'src')]: true,
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('checkPathStatuses never checks paths outside the roots or escaping with dot segments', async () => {
  const checked: string[] = [];
  const exists = async (path: string) => {
    checked.push(path);
    return true;
  };

  const statuses = await checkPathStatuses(
    ['/etc/passwd', '/repo/docs/../../etc/passwd', 'relative/path.md', '/repo-other/x', '/repo/docs/x.md', '/store/openspec/specs/a/spec.md'],
    ['/repo', '/store'],
    exists,
  );

  assert.deepEqual(statuses, {
    '/etc/passwd': null,
    '/repo/docs/../../etc/passwd': null,
    'relative/path.md': null,
    '/repo-other/x': null,
    '/repo/docs/x.md': true,
    '/store/openspec/specs/a/spec.md': true,
  });
  // The checker resolves paths first, so on Windows they gain a drive letter.
  assert.deepEqual(checked.sort(), ['/repo/docs/x.md', '/store/openspec/specs/a/spec.md'].map((p) => resolve(p)).sort());
});

test('parsePathStatusBody enforces an array of strings and the path limit', () => {
  assert.deepEqual(parsePathStatusBody({ paths: ['/a'] }), ['/a']);
  assert.throws(() => parsePathStatusBody({}), PathStatusRequestError);
  assert.throws(() => parsePathStatusBody({ paths: [1] }), PathStatusRequestError);
  assert.throws(() => parsePathStatusBody(null), PathStatusRequestError);
  assert.equal(parsePathStatusBody({ paths: Array(PATH_STATUS_MAX_PATHS).fill('/a') }).length, 200);
  assert.throws(() => parsePathStatusBody({ paths: Array(PATH_STATUS_MAX_PATHS + 1).fill('/a') }), PathStatusRequestError);
});
