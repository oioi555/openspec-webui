import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { SearchResult } from '../../types/api';

import { createSearchController } from './searchController';

function createResult(name: string): SearchResult {
  return {
    type: 'spec',
    name,
    path: `/specs/${name}`,
    excerpt: `${name} excerpt`,
    matchLine: 1,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

function createManualScheduler() {
  const tasks: Array<{ canceled: boolean; callback: () => void }> = [];

  return {
    tasks,
    schedule(callback: () => void, _delay: number) {
      const task = { canceled: false, callback };
      tasks.push(task);
      return task;
    },
    cancel(handle: unknown) {
      if (!handle || typeof handle !== 'object' || !('canceled' in handle)) {
        return;
      }

      (handle as { canceled: boolean }).canceled = true;
    },
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

test('short query reset keeps stale timers and responses from restoring results', async () => {
  const scheduler = createManualScheduler();
  const deferred = createDeferred<SearchResult[]>();
  const searchCalls: string[] = [];
  let currentResults = [createResult('existing')];

  const controller = createSearchController({
    search: async (query) => {
      searchCalls.push(query);
      return deferred.promise;
    },
    updateResults: (results) => {
      currentResults = results;
    },
    schedule: scheduler.schedule,
    cancelSchedule: scheduler.cancel,
  });

  controller.handleQueryChange('ab');
  controller.handleQueryChange('a');

  assert.deepEqual(currentResults, []);
  assert.equal(scheduler.tasks[0]?.canceled, true);

  scheduler.tasks[0]?.callback();
  assert.deepEqual(searchCalls, []);

  controller.handleQueryChange('abc');
  scheduler.tasks[1]?.callback();
  assert.deepEqual(searchCalls, ['abc']);

  controller.handleQueryChange('a');
  deferred.resolve([createResult('stale')]);
  await flushPromises();

  assert.deepEqual(currentResults, []);

  controller.destroy();
});

test('latest query wins when older searches resolve later', async () => {
  const scheduler = createManualScheduler();
  const deferredByQuery = new Map<string, ReturnType<typeof createDeferred<SearchResult[]>>>();
  let currentResults: SearchResult[] = [];

  const controller = createSearchController({
    search: async (query) => {
      const deferred = createDeferred<SearchResult[]>();
      deferredByQuery.set(query, deferred);
      return deferred.promise;
    },
    updateResults: (results) => {
      currentResults = results;
    },
    schedule: scheduler.schedule,
    cancelSchedule: scheduler.cancel,
  });

  controller.handleQueryChange('ab');
  scheduler.tasks[0]?.callback();

  controller.handleQueryChange('abcd');
  scheduler.tasks[1]?.callback();

  const latestResults = [createResult('latest')];
  deferredByQuery.get('abcd')?.resolve(latestResults);
  await flushPromises();

  assert.deepEqual(currentResults, latestResults);

  deferredByQuery.get('ab')?.resolve([createResult('stale')]);
  await flushPromises();

  assert.deepEqual(currentResults, latestResults);

  controller.destroy();
});
