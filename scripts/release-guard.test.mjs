import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkAncestry,
  checkNpmCliVersion,
  checkReleaseNotes,
  checkTagMatchesVersion,
  compareCore,
  isPublished,
  parseArgs,
  releaseNotesPath,
} from './release-guard.mjs';

const pkg = { name: 'openspec-webui', version: '2.1.0' };
const lock = { version: '2.1.0', packages: { '': { version: '2.1.0' } } };

test('tag must equal v + package.json version', () => {
  assert.equal(checkTagMatchesVersion('v2.1.0', pkg, lock), '2.1.0');
  assert.throws(() => checkTagMatchesVersion('v2.0.9', pkg, lock), /does not match package.json/);
  assert.throws(() => checkTagMatchesVersion('2.1.0', pkg, lock), /not of the form/);
  assert.throws(() => checkTagMatchesVersion('v2.1.0-rc.1', pkg, lock), /not of the form/);
});

test('package-lock version must match', () => {
  assert.throws(
    () => checkTagMatchesVersion('v2.1.0', pkg, { version: '2.1.0', packages: { '': { version: '2.0.0' } } }),
    /package-lock/
  );
});

test('release notes path and content checks', () => {
  assert.equal(releaseNotesPath('2.1.0'), '.github/release-notes/v2.1.0.md');
  assert.throws(() => checkReleaseNotes(null, 'x.md'), /missing/);
  assert.throws(() => checkReleaseNotes('  \n', 'x.md'), /empty/);
  checkReleaseNotes('## Fixes\n- a\n', 'x.md');
});

test('npm CLI version gate for trusted publishing', () => {
  checkNpmCliVersion('11.5.1');
  checkNpmCliVersion('12.0.0');
  assert.throws(() => checkNpmCliVersion('11.5.0'), /too old/);
  assert.throws(() => checkNpmCliVersion('10.9.2'), /too old/);
  assert.equal(compareCore('11.10.0', '11.5.1'), 1);
});

test('ancestry check maps git exit codes', () => {
  checkAncestry('v1.0.0', 'origin/main', () => ({ status: 0 }));
  assert.throws(() => checkAncestry('v1.0.0', 'origin/main', () => ({ status: 1 })), /not on origin\/main/);
  assert.throws(
    () => checkAncestry('v1.0.0', 'origin/main', () => ({ status: 128, stderr: 'bad ref' })),
    /bad ref/
  );
});

test('registry check distinguishes published, 404, and failures', () => {
  assert.equal(isPublished('p', '1.0.0', () => ({ status: 0, stdout: '"1.0.0"\n' })), true);
  assert.equal(isPublished('p', '1.0.0', () => ({ status: 0, stdout: '' })), false);
  assert.equal(isPublished('p', '1.0.0', () => ({ status: 1, stdout: '', stderr: 'npm error code E404' })), false);
  assert.throws(() => isPublished('p', '1.0.0', () => ({ status: 1, stdout: '', stderr: 'ETIMEDOUT' })), /ETIMEDOUT/);
  assert.equal(isPublished('p', '1.0.0', () => ({ status: 0, stdout: '["0.9.0","1.0.0"]' })), true);
  assert.throws(() => isPublished('p', '1.0.0', () => ({ status: 0, stdout: '<html>' })), /unparseable/);
});

test('argument parsing', () => {
  assert.deepEqual(parseArgs(['--tag', 'v1.0.0', '--skip-registry']), {
    tag: 'v1.0.0', mainRef: 'origin/main', ancestry: true, registry: false, npmCliOnly: false, publishedOnly: false,
  });
  assert.equal(parseArgs(['--check-npm-cli']).npmCliOnly, true);
  assert.equal(parseArgs(['--check-published']).publishedOnly, true);
  assert.throws(() => parseArgs([]), /--tag is required/);
  assert.throws(() => parseArgs(['--bogus']), /Unknown argument/);
});
