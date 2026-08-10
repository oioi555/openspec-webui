import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('api.ts exports project version status clients for GET and POST refresh', async () => {
  const source = await readFile(new URL('../api.ts', import.meta.url), 'utf8');

  // getProjectVersionStatus reads from the GET endpoint
  assert.match(source, /export async function getProjectVersionStatus\(\)/);
  assert.match(source, /\/project-version-status'/);

  // refreshProjectVersionStatus posts to the refresh endpoint
  assert.match(source, /export async function refreshProjectVersionStatus\(\)/);
  assert.match(source, /refreshProjectVersionStatus[\s\S]*?method:\s*'POST'/);
  assert.match(source, /\/project-version-status\/refresh/);
});

test('projectVersionStatus.svelte.ts exposes a singleton store with initialize/refresh/manualRefresh/destroy', async () => {
  const source = await readFile(new URL('./projectVersionStatus.svelte.ts', import.meta.url), 'utf8');

  // Imports both client functions from $lib/api
  assert.match(source, /import.*getProjectVersionStatus.*from.*\$lib\/api/);
  assert.match(source, /import.*refreshProjectVersionStatus.*from.*\$lib\/api/);

  // Snapshot / loading / error reactive state
  assert.match(source, /let snapshot\s*=\s*\$state<ProjectVersionStatusResponse \| null>\(null\)/);
  assert.match(source, /let loading\s*=\s*\$state\(false\)/);
  assert.match(source, /let error\s*=\s*\$state<string \| null>\(null\)/);

  // refresh uses the GET-based initial load and guards against concurrent runs
  assert.match(source, /async function refresh\(\)/);
  assert.match(source, /if \(loading\) \{\s*return;\s*\}/);
  assert.match(source, /await getProjectVersionStatus\(\)/);

  // manualRefresh uses the POST refresh endpoint
  assert.match(source, /async function manualRefresh\(\)/);
  assert.match(source, /manualRefresh[\s\S]*?await refreshProjectVersionStatus\(\)/);

  // Both refresh paths reset loading in a finally block
  assert.match(source, /finally\s*\{[\s\S]*?loading\s*=\s*false[\s\S]*?\}/);

  // Store exposes the lifecycle and refresh methods
  assert.match(source, /initialize\(\)/);
  assert.match(source, /destroy\(\)/);
  assert.match(source, /manualRefresh,/);
  assert.match(source, /refresh,/);

  // Singleton export
  assert.match(source, /export const projectVersionStatusStore\s*=\s*createProjectVersionStatusStore\(\)/);
});
