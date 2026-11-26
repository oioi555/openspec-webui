import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SPEC_TREE_STORAGE_KEY, createSpecTreeExpansionStore } from './specTreeExpansionCore';

class MockStorage {
  values = new Map<string, string>();
  failWrites = false;

  constructor(initial: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(initial)) this.values.set(key, value);
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error('quota');
    this.values.set(key, value);
  }
}

function stored(storage: MockStorage) {
  return JSON.parse(storage.values.get(SPEC_TREE_STORAGE_KEY) ?? 'null');
}

test('expanded folders survive a reload, per project', () => {
  const storage = new MockStorage();
  const store = createSpecTreeExpansionStore(() => storage);
  store.toggle('p1', 'network');
  store.expandMany('p1', ['network/auth']);
  store.toggle('p2', 'billing');

  const reloaded = createSpecTreeExpansionStore(() => storage);
  assert.deepEqual([...reloaded.getExpanded('p1')].sort(), ['network', 'network/auth']);
  assert.deepEqual([...reloaded.getExpanded('p2')], ['billing']);
  assert.equal(reloaded.isExpanded('p1', 'billing'), false);

  reloaded.toggle('p2', 'billing');
  assert.deepEqual(stored(storage), { p1: ['network', 'network/auth'] });
});

test('broken JSON falls back to all collapsed', () => {
  const storage = new MockStorage({ [SPEC_TREE_STORAGE_KEY]: '{not json' });
  assert.equal(createSpecTreeExpansionStore(() => storage).getExpanded('p1').size, 0);
});

test('non-array and non-string values are ignored', () => {
  const storage = new MockStorage({
    [SPEC_TREE_STORAGE_KEY]: JSON.stringify({ p1: 'network', p2: ['billing', 3, null], p3: null }),
  });
  const store = createSpecTreeExpansionStore(() => storage);
  assert.equal(store.getExpanded('p1').size, 0);
  assert.deepEqual([...store.getExpanded('p2')], ['billing']);
  for (const raw of ['[]', '"x"', 'null']) {
    const other = new MockStorage({ [SPEC_TREE_STORAGE_KEY]: raw });
    assert.equal(createSpecTreeExpansionStore(() => other).getExpanded('p1').size, 0);
  }
});

test('missing localStorage falls back to all collapsed and still works in memory', () => {
  delete (globalThis as { localStorage?: Storage }).localStorage;
  const store = createSpecTreeExpansionStore();
  assert.equal(store.getExpanded('p1').size, 0);
  store.toggle('p1', 'network');
  assert.equal(store.isExpanded('p1', 'network'), true);
});

test('storage write errors are ignored', () => {
  const storage = new MockStorage();
  storage.failWrites = true;
  const store = createSpecTreeExpansionStore(() => storage);
  assert.doesNotThrow(() => store.setExpanded('p1', ['network']));
  assert.deepEqual([...store.getExpanded('p1')], ['network']);
});

test('prune drops folders that no longer exist', () => {
  const storage = new MockStorage();
  const store = createSpecTreeExpansionStore(() => storage);
  store.setExpanded('p1', ['network', 'gone', 'network/auth']);
  store.prune('p1', ['network', 'network/auth', 'billing']);
  assert.deepEqual(stored(storage), { p1: ['network', 'network/auth'] });
  store.prune('p1', []);
  assert.deepEqual(stored(storage), {});
});
