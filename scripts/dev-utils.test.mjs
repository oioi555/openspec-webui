import assert from 'node:assert/strict';
import test from 'node:test';

import { buildBootstrapEnv, extractWrapperProjectArg, repoRoot } from './dev-utils.mjs';

test('extractWrapperProjectArg keeps port flags forwarded while mapping the first bare path argument to bootstrap env', () => {
  const parsed = extractWrapperProjectArg(['--port', '4444', './demo-project', '--no-open']);

  assert.deepEqual(parsed.forwardedArgs, ['--port', '4444', '--no-open']);
  assert.equal(parsed.projectArg, './demo-project');
});

test('buildBootstrapEnv preserves explicit wrapper project paths and defaults wrappers to the repo root', () => {
  const explicit = buildBootstrapEnv('./demo-project', { OPENSPEC_INITIAL_PROJECT: '/ignored' });
  assert.equal(explicit.OPENSPEC_INITIAL_PROJECT, `${repoRoot}/demo-project`);

  const defaulted = buildBootstrapEnv(undefined, {});
  assert.equal(defaulted.OPENSPEC_INITIAL_PROJECT, repoRoot);

  const preserved = buildBootstrapEnv(undefined, { OPENSPEC_INITIAL_PROJECT: '/custom/project' });
  assert.equal(preserved.OPENSPEC_INITIAL_PROJECT, '/custom/project');
});
