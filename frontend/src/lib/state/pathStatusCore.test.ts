import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createPathStatusController, PATH_STATUS_CHUNK_SIZE, type PathStatusState } from './pathStatusCore';

function setup(fetchImpl?: (paths: string[]) => Promise<Record<string, boolean | null>>) {
  const state: PathStatusState = { statuses: {} };
  const calls: string[][] = [];
  const scheduled: Array<() => void> = [];
  const controller = createPathStatusController({
    state,
    fetchStatuses: async (paths) => {
      calls.push(paths);
      return fetchImpl ? fetchImpl(paths) : Object.fromEntries(paths.map((path) => [path, path.endsWith('.ok')]));
    },
    schedule: (callback) => scheduled.push(callback),
  });
  const runScheduled = async () => {
    while (scheduled.length) scheduled.shift()!();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };
  return { state, calls, controller, runScheduled };
}

test('requests in one tick are batched into a single fetch and cached', async () => {
  const { calls, controller, runScheduled } = setup();

  controller.request(['/a.ok', '/b.missing']);
  controller.request(['/a.ok', '/c.ok']);
  assert.equal(controller.get('/a.ok'), undefined);

  await runScheduled();
  assert.deepEqual(calls, [['/a.ok', '/b.missing', '/c.ok']]);
  assert.equal(controller.get('/a.ok'), true);
  assert.equal(controller.get('/b.missing'), false);

  controller.request(['/a.ok', '/b.missing']);
  await runScheduled();
  assert.equal(calls.length, 1, 'cached paths are not requested again');
});

test('large batches are split into chunks of the server limit', async () => {
  const { calls, controller, runScheduled } = setup();
  controller.request(Array.from({ length: PATH_STATUS_CHUNK_SIZE + 5 }, (_, i) => `/f${i}`));

  await runScheduled();
  assert.deepEqual(calls.map((chunk) => chunk.length), [PATH_STATUS_CHUNK_SIZE, 5]);
});

test('fetch failures resolve to unknown', async () => {
  const { controller, runScheduled } = setup(async () => {
    throw new Error('offline');
  });
  controller.request(['/x']);

  await runScheduled();
  assert.equal(controller.get('/x'), null);
});

test('clear drops cached statuses and ignores responses from before the clear', async () => {
  let release: (value: Record<string, boolean>) => void = () => {};
  const { state, controller, runScheduled } = setup(() => new Promise((resolve) => { release = resolve; }));

  controller.request(['/late']);
  const flushing = runScheduled();
  controller.clear();
  release({ '/late': true });
  await flushing;
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(state.statuses, {});
  assert.equal(controller.get('/late'), undefined);
});
