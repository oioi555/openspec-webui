import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { SearchResult } from '../types/api';

import { createDefaultSearchState, createSearchStateController } from './searchCore';

function createResult(name: string): SearchResult {
  return {
    type: 'spec',
    name,
    path: `/specs/${name}`,
    excerpt: `${name} excerpt`,
    matchLine: 1,
    matchSource: 'content',
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

test('project-scoped search reset clears the visible query, results, and loading state', () => {
  const state = createDefaultSearchState();
  const controller = createSearchStateController({
    state,
    search: async () => [],
  });

  state.query = 'foo';
  state.results = [createResult('existing')];
  state.loading = true;

  controller.resetProjectScopedState();

  assert.equal(state.query, '');
  assert.deepEqual(state.results, []);
  assert.equal(state.loading, false);

  controller.destroy();
});

test('project-scoped search reset invalidates pending search work from the previous project', async () => {
  const state = createDefaultSearchState();
  const scheduler = createManualScheduler();
  const deferred = createDeferred<SearchResult[]>();
  const controller = createSearchStateController({
    state,
    search: async () => deferred.promise,
    schedule: scheduler.schedule,
    cancelSchedule: scheduler.cancel,
  });

  state.results = [createResult('existing')];
  controller.handleQueryChange('project-a');
  scheduler.tasks[0]?.callback();

  assert.equal(state.loading, true);

  controller.resetProjectScopedState();

  assert.equal(state.query, '');
  assert.deepEqual(state.results, []);
  assert.equal(state.loading, false);

  deferred.resolve([createResult('stale')]);
  await flushPromises();

  assert.equal(state.query, '');
  assert.deepEqual(state.results, []);
  assert.equal(state.loading, false);

  controller.destroy();
});

test('search state still updates normally for a valid query in the active project', async () => {
  const state = createDefaultSearchState();
  const scheduler = createManualScheduler();
  const expectedResults = [createResult('current')];
  const controller = createSearchStateController({
    state,
    search: async () => expectedResults,
    schedule: scheduler.schedule,
    cancelSchedule: scheduler.cancel,
  });

  controller.handleQueryChange('current');

  assert.equal(state.query, 'current');
  assert.deepEqual(state.results, []);

  scheduler.tasks[0]?.callback();
  await flushPromises();

  assert.deepEqual(state.results, expectedResults);
  assert.equal(state.loading, false);

  controller.destroy();
});
