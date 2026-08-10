import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PROJECT_UPDATE_COMMAND,
  buildProjectUpdateCommand,
  compareVersions,
  deriveProjectUpdateStatus,
  normalizeProjectVersionStatusEntry,
  normalizeProjectVersionStatusResponse,
} from './projectVersionStatusCore';

test('deriveProjectUpdateStatus maps generation === current to up-to-date', () => {
  assert.equal(deriveProjectUpdateStatus('1.3.1', '1.3.1'), 'up-to-date');
});

test('deriveProjectUpdateStatus maps a newer current CLI to update-available', () => {
  assert.equal(deriveProjectUpdateStatus('1.3.1', '1.4.0'), 'update-available');
  assert.equal(deriveProjectUpdateStatus('1.3.1', '1.3.2'), 'update-available');
});

test('deriveProjectUpdateStatus treats an ahead-of-CLI generation as up-to-date', () => {
  assert.equal(deriveProjectUpdateStatus('1.5.0', '1.4.0'), 'up-to-date');
});

test('compareVersions matches the shared server helper semantics', () => {
  // Core versions order by numeric segments.
  assert.equal(compareVersions('1.2.3', '1.2.3'), 0);
  assert.equal(compareVersions('1.2.3', '1.2.4'), -1);
  assert.equal(compareVersions('2.0.0', '1.9.9'), 1);
  // v-prefixed versions are equal to bare versions.
  assert.equal(compareVersions('v1.2.3', '1.2.3'), 0);
  // Shorter core versions are padded with zeros.
  assert.equal(compareVersions('1.2', '1.2.0'), 0);
  // A release sorts after any prerelease of the same core.
  assert.equal(compareVersions('1.0.0', '1.0.0-rc.1'), 1);
  assert.equal(compareVersions('1.0.0-rc.1', '1.0.0'), -1);
  // Numeric prerelease identifiers compare numerically.
  assert.equal(compareVersions('1.0.0-rc.2', '1.0.0-rc.10'), -1);
  assert.equal(compareVersions('1.0.0-1', '1.0.0-2'), -1);
  // Numeric prerelease identifiers sort before alphanumeric ones.
  assert.equal(compareVersions('1.0.0-1', '1.0.0-alpha'), -1);
  assert.equal(compareVersions('1.0.0-alpha', '1.0.0-1'), 1);
  // Alphanumeric prerelease identifiers compare lexicographically.
  assert.equal(compareVersions('1.0.0-alpha', '1.0.0-beta'), -1);
  // A shorter prerelease is smaller when identifiers match.
  assert.equal(compareVersions('1.0.0-alpha', '1.0.0-alpha.1'), -1);
  // Identical versions compare equal.
  assert.equal(compareVersions('1.0.0-rc.1', '1.0.0-rc.1'), 0);
});

test('deriveProjectUpdateStatus orders prereleases like the server helper', () => {
  // Stable release wins over its own prerelease.
  assert.equal(deriveProjectUpdateStatus('1.4.0', '1.4.0-beta.1'), 'up-to-date');
  assert.equal(deriveProjectUpdateStatus('1.4.0-beta.1', '1.4.0'), 'update-available');
  // Numeric prerelease identifiers sort before alphanumeric ones.
  assert.equal(deriveProjectUpdateStatus('1.4.0-1', '1.4.0-alpha'), 'update-available');
  assert.equal(deriveProjectUpdateStatus('1.4.0-alpha', '1.4.0-1'), 'up-to-date');
});

test('deriveProjectUpdateStatus returns unknown when either version is missing', () => {
  assert.equal(deriveProjectUpdateStatus(null, '1.4.0'), 'unknown');
  assert.equal(deriveProjectUpdateStatus(undefined, '1.4.0'), 'unknown');
  assert.equal(deriveProjectUpdateStatus('1.3.1', null), 'unknown');
  assert.equal(deriveProjectUpdateStatus('1.3.1', undefined), 'unknown');
  assert.equal(deriveProjectUpdateStatus(null, null), 'unknown');
  assert.equal(deriveProjectUpdateStatus('', '1.4.0'), 'unknown');
  assert.equal(deriveProjectUpdateStatus('1.3.1', ''), 'unknown');
});

test('normalizeProjectVersionStatusResponse tolerates null and empty payloads', () => {
  const emptySnapshot = { currentCliVersion: null, checkedAt: null, projects: [] };

  assert.deepEqual(normalizeProjectVersionStatusResponse(null), emptySnapshot);
  assert.deepEqual(normalizeProjectVersionStatusResponse(undefined), emptySnapshot);
  assert.deepEqual(normalizeProjectVersionStatusResponse({}), emptySnapshot);
  assert.deepEqual(normalizeProjectVersionStatusResponse('bogus'), emptySnapshot);
});

test('normalizeProjectVersionStatusResponse passes through a well-formed payload', () => {
  const response = {
    currentCliVersion: '1.4.0',
    checkedAt: '2026-08-11T00:00:00.000Z',
    projects: [
      { path: '/a', generationVersion: '1.4.0', currentVersion: '1.4.0', status: 'up-to-date' },
      { path: '/b', generationVersion: '1.2.0', currentVersion: '1.4.0', status: 'update-available' },
      { path: '/c', generationVersion: null, currentVersion: '1.4.0', status: 'unknown' },
    ],
  };

  assert.deepEqual(normalizeProjectVersionStatusResponse(response), response);
});

test('normalizeProjectVersionStatusResponse maps malformed entries to unknown and drops invalid ones', () => {
  const response = normalizeProjectVersionStatusResponse({
    currentCliVersion: '1.4.0',
    projects: [
      { path: '/ok', generationVersion: 42, currentVersion: '1.4.0', status: 'bogus' },
      { path: '/missing', generationVersion: '1.2.0' },
      'not-an-object',
      7,
      null,
    ],
  });

  assert.equal(response.currentCliVersion, '1.4.0');
  assert.equal(response.projects.length, 2);
  assert.deepEqual(response.projects[0], {
    path: '/ok',
    generationVersion: null,
    currentVersion: '1.4.0',
    status: 'unknown',
  });
  assert.deepEqual(response.projects[1], {
    path: '/missing',
    generationVersion: '1.2.0',
    currentVersion: null,
    status: 'unknown',
  });
});

test('normalizeProjectVersionStatusEntry rejects entries without a string path', () => {
  assert.equal(normalizeProjectVersionStatusEntry(null), null);
  assert.equal(normalizeProjectVersionStatusEntry({ generationVersion: '1.2.0' }), null);
  assert.equal(normalizeProjectVersionStatusEntry({ path: 42 }), null);
});

test('buildProjectUpdateCommand produces openspec update with the path', () => {
  assert.equal(PROJECT_UPDATE_COMMAND, 'openspec update');
  assert.equal(buildProjectUpdateCommand('/home/user/proj'), 'openspec update /home/user/proj');
});

test('buildProjectUpdateCommand quotes paths containing whitespace', () => {
  assert.equal(buildProjectUpdateCommand('/home/user/my project'), "openspec update '/home/user/my project'");
});

test('buildProjectUpdateCommand does not escape single quotes inside the path', () => {
  assert.equal(buildProjectUpdateCommand("/home/user/it's project"), "openspec update '/home/user/it's project'");
});
