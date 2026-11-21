import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';

import { repoRoot, resolveLocalBin, withFlag } from './dev-utils.mjs';

test('withFlag adds a missing flag only once', () => {
  assert.deepEqual(withFlag(['--port', '4444'], '--no-open'), ['--port', '4444', '--no-open']);
  assert.deepEqual(withFlag(['--no-open'], '--no-open'), ['--no-open']);
});

test('resolveLocalBin points to the package JS bin entry, never a .cmd shim', () => {
  assert.equal(resolveLocalBin('vite'), join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js'));
  assert.equal(resolveLocalBin('tsc'), join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc'));
  assert.equal(resolveLocalBin('tsx'), join(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs'));
  assert.equal(
    resolveLocalBin('paraglide-js'),
    join(repoRoot, 'node_modules', '@inlang', 'paraglide-js', 'bin', 'run.js'),
  );
});

test('resolveLocalBin returns null for unknown tools', () => {
  assert.equal(resolveLocalBin('definitely-not-installed-tool'), null);
});
