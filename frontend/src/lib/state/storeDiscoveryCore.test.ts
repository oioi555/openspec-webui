import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import type { StoreDiscoveryDiagnostic, StoreDiscoveryResult } from '$lib/types/api';

import {
  applyStoreDiscoveryResult,
  createDefaultStoreDiscoveryState,
  createStoreDiscoveryController,
  resetStoreDiscoveryState,
  shouldApplyStoreDiscoveryResult,
} from './storeDiscoveryCore';

const DISCOVERY_STATUSES = ['stores', 'empty', 'unavailable'] as const;

function createResult(overrides: Partial<StoreDiscoveryResult> = {}): StoreDiscoveryResult {
  return {
    status: 'stores',
    stores: [{ id: 'store-a', root: '/tmp/store-a' }],
    reason: null,
    checkedAt: '2026-08-10T00:00:00.000Z',
    ...overrides,
  };
}

function createDiagnostic(): StoreDiscoveryDiagnostic {
  return { code: 'CLI_MISSING', message: 'openspec CLI not found on PATH' };
}

test('createDefaultStoreDiscoveryState returns the initial empty machine state', () => {
  assert.deepEqual(createDefaultStoreDiscoveryState(), {
    status: 'empty',
    stores: [],
    reason: null,
    checkedAt: null,
    loading: false,
    error: null,
  });
});

// ---------------------------------------------------------------------------
// stores / empty / unavailable result transitions
// ---------------------------------------------------------------------------

test('store discovery transitions through every result status in order', () => {
  const state = createDefaultStoreDiscoveryState();
  const controller = createStoreDiscoveryController({
    state,
    getStores: async () => createResult(),
  });

  for (const [index, status] of DISCOVERY_STATUSES.entries()) {
    const checkedAt = `2026-08-10T00:00:${String(index).padStart(2, '0')}.000Z`;
    controller.applyResult(
      createResult({
        status,
        stores: status === 'stores' ? [{ id: 'store-a', root: '/tmp/store-a' }] : [],
        reason: status === 'unavailable' ? createDiagnostic() : null,
        checkedAt,
      }),
    );

    assert.equal(state.status, status, `status should become '${status}'`);
    assert.equal(state.checkedAt, checkedAt);

    if (status === 'stores') {
      assert.deepEqual(state.stores, [{ id: 'store-a', root: '/tmp/store-a' }]);
      assert.equal(state.reason, null);
    } else if (status === 'unavailable') {
      assert.deepEqual(state.stores, []);
      assert.deepEqual(state.reason, createDiagnostic());
    } else {
      assert.deepEqual(state.stores, []);
      assert.equal(state.reason, null);
    }
  }
});

test('unavailable result carries the diagnostic reason through the store state', () => {
  const state = createDefaultStoreDiscoveryState();
  const controller = createStoreDiscoveryController({
    state,
    getStores: async () => createResult(),
  });

  controller.applyResult(
    createResult({ status: 'unavailable', stores: [], reason: createDiagnostic() }),
  );

  assert.equal(state.status, 'unavailable');
  assert.equal(state.reason?.code, 'CLI_MISSING');
  assert.equal(state.reason?.message, 'openspec CLI not found on PATH');
});

// ---------------------------------------------------------------------------
// stale checkedAt rejection
// ---------------------------------------------------------------------------

test('a stale checkedAt result is rejected and does not overwrite newer state', () => {
  const state = createDefaultStoreDiscoveryState();
  const controller = createStoreDiscoveryController({
    state,
    getStores: async () => createResult(),
  });

  const newer = createResult({
    status: 'stores',
    stores: [{ id: 'new', root: '/tmp/new' }],
    checkedAt: '2026-08-10T12:00:00.000Z',
  });
  controller.applyResult(newer);

  // Out-of-order late response with an older timestamp
  const stale = createResult({
    status: 'empty',
    stores: [],
    checkedAt: '2026-08-10T11:00:00.000Z',
  });
  controller.applyResult(stale);

  assert.equal(state.status, 'stores', 'stale result must be ignored');
  assert.deepEqual(state.stores, [{ id: 'new', root: '/tmp/new' }]);
  assert.equal(state.checkedAt, '2026-08-10T12:00:00.000Z');
});

test('results at the same checkedAt are accepted (>= comparison, no strict >)', () => {
  const state = createDefaultStoreDiscoveryState();
  const controller = createStoreDiscoveryController({
    state,
    getStores: async () => createResult(),
  });

  const checkedAt = '2026-08-10T12:00:00.000Z';
  controller.applyResult(createResult({ status: 'stores', checkedAt }));
  controller.applyResult(createResult({ status: 'empty', stores: [], checkedAt }));

  assert.equal(state.status, 'empty', 'equal timestamp should be applied');
  assert.equal(state.checkedAt, checkedAt);
});

test('pure shouldApplyStoreDiscoveryResult rejects only strictly-older timestamps', () => {
  assert.equal(shouldApplyStoreDiscoveryResult(createResult({ checkedAt: '2026-08-10T11:00:00.000Z' }), '2026-08-10T12:00:00.000Z'), false);
  assert.equal(shouldApplyStoreDiscoveryResult(createResult({ checkedAt: '2026-08-10T12:00:00.000Z' }), '2026-08-10T12:00:00.000Z'), true);
  assert.equal(shouldApplyStoreDiscoveryResult(createResult({ checkedAt: '2026-08-10T13:00:00.000Z' }), '2026-08-10T12:00:00.000Z'), true);
  // Missing baseline or missing checkedAt are always accepted
  assert.equal(shouldApplyStoreDiscoveryResult(createResult({ checkedAt: null }), '2026-08-10T12:00:00.000Z'), true);
  assert.equal(shouldApplyStoreDiscoveryResult(createResult({ checkedAt: '2026-08-10T11:00:00.000Z' }), null), true);
});

// ---------------------------------------------------------------------------
// refresh: success applies, failure preserves existing data
// ---------------------------------------------------------------------------

test('refresh success applies the fetched result and clears loading/error', async () => {
  const state = createDefaultStoreDiscoveryState();
  const controller = createStoreDiscoveryController({
    state,
    getStores: async () => createResult({ status: 'empty', stores: [] }),
  });

  const promise = controller.refresh();
  assert.equal(state.loading, true, 'loading should be set while in flight');
  await promise;

  assert.equal(state.loading, false);
  assert.equal(state.status, 'empty');
  assert.deepEqual(state.stores, []);
  assert.equal(state.error, null);
  assert.equal(state.checkedAt, '2026-08-10T00:00:00.000Z');
});

test('refresh failure preserves existing discovery data and records the error', async () => {
  const state = createDefaultStoreDiscoveryState();
  const failure = new Error('network down');
  let calls = 0;

  const controller = createStoreDiscoveryController({
    state,
    getStores: async () => {
      calls += 1;
      if (calls === 1) {
        return createResult({ status: 'stores', stores: [{ id: 'store-a', root: '/tmp/store-a' }] });
      }
      throw failure;
    },
    getErrorMessage: (cause) => (cause instanceof Error ? cause.message : 'fallback'),
  });

  await controller.refresh();
  assert.equal(state.status, 'stores');
  assert.deepEqual(state.stores, [{ id: 'store-a', root: '/tmp/store-a' }]);
  assert.equal(state.error, null);

  await controller.refresh(); // fails
  assert.equal(state.status, 'stores', 'stale data must remain visible on error');
  assert.deepEqual(state.stores, [{ id: 'store-a', root: '/tmp/store-a' }]);
  assert.equal(state.checkedAt, '2026-08-10T00:00:00.000Z');
  assert.equal(state.error, 'network down');
  assert.equal(state.loading, false, 'loading must clear in finally');
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

test('reset clears state back to defaults and forgets the stale-guard baseline', () => {
  const state = createDefaultStoreDiscoveryState();
  const controller = createStoreDiscoveryController({
    state,
    getStores: async () => createResult(),
  });

  controller.applyResult(
    createResult({ status: 'unavailable', stores: [], reason: createDiagnostic() }),
  );
  state.error = 'boom';
  state.loading = true;

  controller.reset();

  assert.deepEqual(state, createDefaultStoreDiscoveryState());

  // The stale-guard baseline is forgotten: a result older than the pre-reset
  // one is accepted again after reset.
  controller.applyResult(
    createResult({
      status: 'stores',
      stores: [{ id: 'store-a', root: '/tmp/store-a' }],
      checkedAt: '2026-08-09T00:00:00.000Z',
    }),
  );
  assert.equal(state.status, 'stores');
});

test('pure resetStoreDiscoveryState and applyStoreDiscoveryResult mutate the passed state', () => {
  const state = createDefaultStoreDiscoveryState();
  const result = createResult({ status: 'stores' });

  const nextBaseline = applyStoreDiscoveryResult(state, result, null);
  assert.equal(nextBaseline, result.checkedAt);
  assert.equal(state.status, 'stores');
  assert.deepEqual(state.stores, result.stores);

  // Stale result leaves both state and baseline untouched
  const baseline = nextBaseline as string;
  const stale = createResult({ status: 'empty', stores: [], checkedAt: '2020-01-01T00:00:00.000Z' });
  assert.equal(applyStoreDiscoveryResult(state, stale, baseline), baseline);
  assert.equal(state.status, 'stores');

  resetStoreDiscoveryState(state);
  assert.deepEqual(state, createDefaultStoreDiscoveryState());
});

// ---------------------------------------------------------------------------
// machine-global: not keyed or reset by active project changes
// ---------------------------------------------------------------------------

test('store discovery state is machine-global: no project-keyed state or reset surface', () => {
  const state = createDefaultStoreDiscoveryState();
  const controller = createStoreDiscoveryController({
    state,
    getStores: async () => createResult(),
  });

  // Unlike validationCore, there is no project binding, no syncProject, and no
  // project-scoped reset. The state is keyed to the machine only — an active
  // project switch has no handle through which it could reset discovery.
  const stateKeys = Object.keys(createDefaultStoreDiscoveryState());
  assert.ok(!stateKeys.includes('projectId'), 'state must not be keyed to a project');

  const controllerSurface = controller as unknown as Record<string, unknown>;
  assert.equal(controllerSurface.syncProject, undefined, 'no project sync surface');
  assert.equal(controllerSurface.resetProjectScopedState, undefined, 'no project-scoped reset');
  assert.equal(typeof controller.reset, 'function', 'only an explicit opt-in reset() exists');
});

test('store discovery data survives the project-switch reinit flow (refresh, never reset)', async () => {
  const state = createDefaultStoreDiscoveryState();
  let failNext = false;

  const controller = createStoreDiscoveryController({
    state,
    getStores: async () => {
      if (failNext) {
        throw new Error('boom');
      }
      return createResult({ status: 'stores', stores: [{ id: 'store-a', root: '/tmp/store-a' }] });
    },
    getErrorMessage: (cause) => (cause instanceof Error ? cause.message : 'fallback'),
  });

  await controller.refresh();
  assert.equal(state.status, 'stores');

  // appData.reinitializeProjectScopedState calls initializeData, which calls
  // storeDiscoveryStore.refresh() — it never calls reset(). Simulate both a
  // failing and a successful refresh across a "project switch".
  failNext = true;
  await controller.refresh();
  assert.equal(state.status, 'stores', 'failed refresh across project switch keeps discovery data');
  assert.equal(state.error, 'boom');

  failNext = false;
  await controller.refresh();
  assert.equal(state.status, 'stores');
  assert.equal(state.error, null);
  assert.deepEqual(state.stores, [{ id: 'store-a', root: '/tmp/store-a' }]);
});

test('storeDiscovery.svelte.ts exposes a module-level singleton with no project-scoped reset', async () => {
  const source = await readFile(new URL('./storeDiscovery.svelte.ts', import.meta.url), 'utf8');

  // One instance, created once at module scope (machine-global singleton).
  assert.match(
    source,
    /export const storeDiscoveryStore = createStoreDiscoveryStore\(\);/,
    'Store should be a module-level singleton',
  );
  assert.doesNotMatch(
    source,
    /export (?:function|const) createStoreDiscoveryStore/,
    'Factory must not be exported (no way to mint additional instances)',
  );

  // No project-keyed or project-scoped reset surface exists in the store.
  assert.doesNotMatch(source, /projectId|syncProject|resetProjectScopedState/);
});

test('project-switch reinit in appData refreshes store discovery instead of resetting it', async () => {
  const appData = await readFile(new URL('./appData.svelte.ts', import.meta.url), 'utf8');

  // The project-scoped reinit path re-fetches discovery via refresh() ...
  assert.match(
    appData,
    /storeDiscoveryStore\.refresh\(\)/,
    'Reinit should re-fetch store discovery',
  );
  // ... and reset() is never wired into app-data project handling.
  assert.doesNotMatch(appData, /storeDiscoveryStore\.reset\(/);
});
