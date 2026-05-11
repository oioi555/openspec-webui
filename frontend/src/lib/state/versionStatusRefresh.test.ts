import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('api.ts exports refreshVersionStatus as a POST to /version-status/refresh', async () => {
  const source = await readFile(new URL('../api.ts', import.meta.url), 'utf8');

  // refreshVersionStatus function exists and uses POST method
  assert.match(source, /export async function refreshVersionStatus\(\)/);
  assert.match(source, /refreshVersionStatus[\s\S]*?method:\s*'POST'/);
  assert.match(source, /\/version-status\/refresh/);
});

test('versionStatus.svelte.ts exposes refreshing state and manualRefresh method alongside existing refresh', async () => {
  const source = await readFile(new URL('./versionStatus.svelte.ts', import.meta.url), 'utf8');

  // Imports refreshVersionStatus from api
  assert.match(source, /import.*refreshVersionStatus.*from.*\$lib\/api/);

  // Has one shared loading reactive state for startup and manual refresh
  assert.match(source, /let loading\s*=\s*\$state\(false\)/);

  // manualRefresh async function exists
  assert.match(source, /async function manualRefresh\(\)/);

  // manualRefresh exits early if another lookup is already running
  assert.match(source, /if \(loading\) \{\s*return;\s*\}/);

  // manualRefresh calls refreshVersionStatus (POST endpoint)
  assert.match(source, /manualRefresh[\s\S]*?await refreshVersionStatus\(\)/);

  // manualRefresh sets loading = true at start
  assert.match(source, /async function manualRefresh[\s\S]*?loading\s*=\s*true/);

  // manualRefresh resets loading = false in finally block
  assert.match(source, /finally\s*\{[\s\S]*?loading\s*=\s*false[\s\S]*?\}[\s\S]*?\}/);

  // Store exposes manualRefresh in return object
  assert.match(source, /manualRefresh,/);

  // Existing refresh function is preserved (GET-based initial load)
  assert.match(source, /async function refresh\(\)/);
  assert.match(source, /await getVersionStatus\(\)/);

  // manualRefresh clears retry timeout (does not schedule retry)
  assert.match(source, /manualRefresh[\s\S]*?clearRetryTimeout\(\)/);

  // manualRefresh does NOT call scheduleRetry (unlike initial refresh)
  const manualRefreshBlock = source.slice(
    source.indexOf('async function manualRefresh()'),
    source.indexOf('async function manualRefresh()') + 600
  );
  assert.equal(manualRefreshBlock.includes('scheduleRetry'), false,
    'manualRefresh should not schedule retry since POST does synchronous recheck');
});
