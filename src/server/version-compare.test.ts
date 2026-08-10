import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compareVersions, normalizeVersion, splitVersion } from './version-compare.js';

test('normalizeVersion trims whitespace and strips a leading v prefix', () => {
  assert.equal(normalizeVersion('1.2.3'), '1.2.3');
  assert.equal(normalizeVersion('v1.2.3'), '1.2.3');
  assert.equal(normalizeVersion('V1.2.3'), '1.2.3');
  assert.equal(normalizeVersion(' 1.2.3 '), '1.2.3');
  assert.equal(normalizeVersion(' v1.2.3 '), '1.2.3');
});

test('normalizeVersion returns null for absent, empty, or blank versions', () => {
  assert.equal(normalizeVersion(null), null);
  assert.equal(normalizeVersion(undefined), null);
  assert.equal(normalizeVersion(''), null);
  assert.equal(normalizeVersion('   '), null);
});

test('splitVersion pads core segments to three parts', () => {
  assert.deepEqual(splitVersion('1'), { segments: [1, 0, 0], prerelease: [] });
  assert.deepEqual(splitVersion('1.2'), { segments: [1, 2, 0], prerelease: [] });
  assert.deepEqual(splitVersion('1.2.3'), { segments: [1, 2, 3], prerelease: [] });
  assert.deepEqual(splitVersion('1.2.3.4'), { segments: [1, 2, 3, 4], prerelease: [] });
});

test('splitVersion tolerates non-numeric core segments', () => {
  assert.deepEqual(splitVersion('a.b.c'), { segments: [0, 0, 0], prerelease: [] });
  assert.deepEqual(splitVersion('1.x.3'), { segments: [1, 0, 3], prerelease: [] });
});

test('splitVersion separates and splits the prerelease suffix', () => {
  assert.deepEqual(splitVersion('1.2.3-rc.1'), { segments: [1, 2, 3], prerelease: ['rc', '1'] });
  assert.deepEqual(splitVersion('v1.2.3-beta'), { segments: [1, 2, 3], prerelease: ['beta'] });
});

test('compareVersions orders core versions by numeric segments', () => {
  assert.equal(compareVersions('1.2.3', '1.2.3'), 0);
  assert.equal(compareVersions('1.2.3', '1.2.4'), -1);
  assert.equal(compareVersions('1.2.4', '1.2.3'), 1);
  assert.equal(compareVersions('2.0.0', '1.9.9'), 1);
  assert.equal(compareVersions('1.0.0', '0.9.9'), 1);
});

test('compareVersions treats v-prefixed versions as equal to bare versions', () => {
  assert.equal(compareVersions('v1.2.3', '1.2.3'), 0);
  assert.equal(compareVersions('1.2.3', 'v1.2.4'), -1);
});

test('compareVersions pads shorter core versions with zeros', () => {
  assert.equal(compareVersions('1.2', '1.2.0'), 0);
  assert.equal(compareVersions('1', '1.0.0'), 0);
  assert.equal(compareVersions('1.2.3.4', '1.2.3'), 1);
});

test('compareVersions orders a release after its prerelease of the same core', () => {
  assert.equal(compareVersions('1.0.0', '1.0.0-rc.1'), 1);
  assert.equal(compareVersions('1.0.0-rc.1', '1.0.0'), -1);
});

test('compareVersions compares numeric prerelease identifiers numerically', () => {
  assert.equal(compareVersions('1.0.0-rc.2', '1.0.0-rc.10'), -1);
  assert.equal(compareVersions('1.0.0-rc.10', '1.0.0-rc.2'), 1);
  assert.equal(compareVersions('1.0.0-1', '1.0.0-2'), -1);
});

test('compareVersions orders numeric prerelease identifiers before alphanumeric ones', () => {
  assert.equal(compareVersions('1.0.0-1', '1.0.0-alpha'), -1);
  assert.equal(compareVersions('1.0.0-alpha', '1.0.0-1'), 1);
});

test('compareVersions compares alphanumeric prerelease identifiers lexicographically', () => {
  assert.equal(compareVersions('1.0.0-alpha', '1.0.0-beta'), -1);
  assert.equal(compareVersions('1.0.0-beta', '1.0.0-alpha'), 1);
  assert.equal(compareVersions('1.0.0-alpha.1', '1.0.0-alpha.2'), -1);
});

test('compareVersions treats a shorter prerelease as smaller when identifiers match', () => {
  assert.equal(compareVersions('1.0.0-alpha', '1.0.0-alpha.1'), -1);
  assert.equal(compareVersions('1.0.0-alpha.1', '1.0.0-alpha'), 1);
});

test('compareVersions returns zero for identical prerelease versions', () => {
  assert.equal(compareVersions('1.0.0-rc.1', '1.0.0-rc.1'), 0);
  assert.equal(compareVersions('v1.0.0-beta.2', '1.0.0-beta.2'), 0);
});

test('compareVersions reflects the update-available ordering used by the snapshot service', () => {
  assert.equal(compareVersions('1.3.1', '1.4.0'), -1);
  assert.equal(compareVersions('0.1.0', '0.2.0'), -1);
  assert.equal(compareVersions('1.4.0', '1.4.0'), 0);
});
