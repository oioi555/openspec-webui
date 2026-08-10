import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { ProjectEntry, StoreRecord } from './types/api';
import {
  normalizeCanonicalRoot,
  mergeUnifiedProjectList,
  deriveLabelFromRoot,
  resolveStoreRoot,
  isStoreRoot,
  resolveStoreRelationship,
} from './storeHelpers';

function createProject(overrides: Partial<ProjectEntry> = {}): ProjectEntry {
  return {
    id: 'proj-1',
    path: '/home/user/project',
    label: 'My Project',
    addedAt: Date.now(),
    lastOpenedAt: Date.now(),
    pointerStoreId: null,
    referenceStoreIds: [],
    ...overrides,
  };
}

function createStore(overrides: Partial<StoreRecord> = {}): StoreRecord {
  return {
    id: 'store-1',
    root: '/home/user/store',
    ...overrides,
  };
}

// --- normalizeCanonicalRoot ---

test('normalizeCanonicalRoot strips trailing slashes', () => {
  assert.equal(normalizeCanonicalRoot('/home/user/project/'), '/home/user/project');
  assert.equal(normalizeCanonicalRoot('/home/user/project//'), '/home/user/project');
  assert.equal(normalizeCanonicalRoot('/root/'), '/root');
});

test('normalizeCanonicalRoot preserves root path', () => {
  assert.equal(normalizeCanonicalRoot('/'), '/');
  assert.equal(normalizeCanonicalRoot('/home/user/project'), '/home/user/project');
});

// --- deriveLabelFromRoot ---

test('deriveLabelFromRoot extracts last segment', () => {
  assert.equal(deriveLabelFromRoot('/home/user/my-project'), 'my-project');
  assert.equal(deriveLabelFromRoot('/home/user/store/'), 'store');
});

// --- mergeUnifiedProjectList ---

test('mergeUnifiedProjectList creates rows from projects only', () => {
  const projects = [createProject({ id: 'p1', path: '/a', label: 'A' })];
  const rows = mergeUnifiedProjectList(projects, []);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].projectId, 'p1');
  assert.equal(rows[0].label, 'A');
  assert.equal(rows[0].storeId, null);
  assert.equal(rows[0].isStoreOnly, false);
});

test('mergeUnifiedProjectList creates rows from stores only', () => {
  const stores = [createStore({ id: 's1', root: '/store-a' })];
  const rows = mergeUnifiedProjectList([], stores);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].projectId, null);
  assert.equal(rows[0].storeId, 's1');
  assert.equal(rows[0].isStoreOnly, true);
  assert.equal(rows[0].label, 'store-a');
});

test('mergeUnifiedProjectList merges project and store sharing same root', () => {
  const projects = [createProject({ id: 'p1', path: '/shared', label: 'Shared Project' })];
  const stores = [createStore({ id: 's1', root: '/shared' })];
  const rows = mergeUnifiedProjectList(projects, stores);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].projectId, 'p1');
  assert.equal(rows[0].storeId, 's1');
  assert.equal(rows[0].label, 'Shared Project');
  assert.equal(rows[0].isStoreOnly, false);
});

test('mergeUnifiedProjectList keeps distinct roots separate', () => {
  const projects = [createProject({ id: 'p1', path: '/project-a', label: 'A' })];
  const stores = [createStore({ id: 's1', root: '/store-b' })];
  const rows = mergeUnifiedProjectList(projects, stores);

  assert.equal(rows.length, 2);
  assert.equal(rows[0].projectId, 'p1');
  assert.equal(rows[0].storeId, null);
  assert.equal(rows[1].projectId, null);
  assert.equal(rows[1].storeId, 's1');
  assert.equal(rows[1].isStoreOnly, true);
});

test('mergeUnifiedProjectList merges trailing slash differences', () => {
  const projects = [createProject({ id: 'p1', path: '/home/user/proj', label: 'Proj' })];
  const stores = [createStore({ id: 's1', root: '/home/user/proj/' })];
  const rows = mergeUnifiedProjectList(projects, stores);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].projectId, 'p1');
  assert.equal(rows[0].storeId, 's1');
});

// --- Relationship badge regression: badges on DECLARING row, not TARGET ---

test('mergeUnifiedProjectList places pointer badge on the declaring project row, not the target store row', () => {
  const projects = [
    createProject({
      id: 'proj-a',
      path: '/project-a',
      label: 'Project A',
      pointerStoreId: 'store-b',
      referenceStoreIds: ['store-c', 'store-d'],
    }),
  ];
  const stores = [
    createStore({ id: 'store-b', root: '/store-b-root' }),
    createStore({ id: 'store-c', root: '/store-c-root' }),
    createStore({ id: 'store-d', root: '/store-d-root' }),
  ];
  const rows = mergeUnifiedProjectList(projects, stores);

  // Project A's row should carry both relationship badges
  const rowA = rows.find((r) => r.projectId === 'proj-a');
  assert.ok(rowA, 'Project A row should exist');
  assert.equal(rowA.pointsToStoreId, 'store-b', 'Project A should point to store-b');
  assert.equal(rowA.referenceCount, 2, 'Project A should reference 2 stores');

  // Target Store B should NOT inherit A's pointer badge
  const rowB = rows.find((r) => r.storeId === 'store-b');
  assert.ok(rowB, 'Store B row should exist');
  assert.equal(rowB.pointsToStoreId, null, 'Store B should NOT show pointer badge from A');
  assert.equal(rowB.referenceCount, 0, 'Store B should NOT show reference count from A');

  // Referenced Stores C and D should NOT inherit A's reference count
  const rowC = rows.find((r) => r.storeId === 'store-c');
  const rowD = rows.find((r) => r.storeId === 'store-d');
  assert.ok(rowC, 'Store C row should exist');
  assert.ok(rowD, 'Store D row should exist');
  assert.equal(rowC.referenceCount, 0, 'Store C should NOT show reference count from A');
  assert.equal(rowD.referenceCount, 0, 'Store D should NOT show reference count from A');
  assert.equal(rowC.pointsToStoreId, null, 'Store C should NOT show pointer badge');
  assert.equal(rowD.pointsToStoreId, null, 'Store D should NOT show pointer badge');
});

test('mergeUnifiedProjectList store-only CLI rows have no relationship facts', () => {
  const stores = [
    createStore({ id: 's1', root: '/standalone-store' }),
  ];
  const rows = mergeUnifiedProjectList([], stores);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].isStoreOnly, true);
  assert.equal(rows[0].pointsToStoreId, null, 'Store-only row should have no pointer');
  assert.equal(rows[0].referenceCount, 0, 'Store-only row should have no references');
});

test('mergeUnifiedProjectList each project carries its own independent relationship facts', () => {
  const projects = [
    createProject({
      id: 'proj-a',
      path: '/proj-a',
      label: 'A',
      pointerStoreId: 's1',
      referenceStoreIds: [],
    }),
    createProject({
      id: 'proj-b',
      path: '/proj-b',
      label: 'B',
      pointerStoreId: null,
      referenceStoreIds: ['s1', 's2'],
    }),
    createProject({
      id: 'proj-c',
      path: '/proj-c',
      label: 'C',
      pointerStoreId: null,
      referenceStoreIds: [],
    }),
  ];
  const rows = mergeUnifiedProjectList(projects, []);

  const rowA = rows.find((r) => r.projectId === 'proj-a')!;
  const rowB = rows.find((r) => r.projectId === 'proj-b')!;
  const rowC = rows.find((r) => r.projectId === 'proj-c')!;

  assert.equal(rowA.pointsToStoreId, 's1', 'A points to s1');
  assert.equal(rowA.referenceCount, 0, 'A has no references');

  assert.equal(rowB.pointsToStoreId, null, 'B has no pointer');
  assert.equal(rowB.referenceCount, 2, 'B references 2 stores');

  assert.equal(rowC.pointsToStoreId, null, 'C has no pointer');
  assert.equal(rowC.referenceCount, 0, 'C has no references');
});

// --- resolveStoreRoot ---

test('resolveStoreRoot finds store by id in rows', () => {
  const stores = [createStore({ id: 's1', root: '/my-store' })];
  const rows = mergeUnifiedProjectList([], stores);

  assert.equal(resolveStoreRoot('s1', rows, stores), '/my-store');
  assert.equal(resolveStoreRoot('unknown', rows, stores), null);
});

// --- isStoreRoot ---

test('isStoreRoot matches project path to store', () => {
  const stores = [createStore({ id: 's1', root: '/store-root' })];

  assert.equal(isStoreRoot('/store-root', stores), true);
  assert.equal(isStoreRoot('/store-root/', stores), true);
  assert.equal(isStoreRoot('/other-path', stores), false);
});

// --- resolveStoreRelationship ---

test('resolveStoreRelationship returns no relationship for null project', () => {
  const rel = resolveStoreRelationship(null, []);
  assert.equal(rel.hasRelationship, false);
  assert.equal(rel.isStoreRoot, false);
  assert.equal(rel.pointerStoreId, null);
});

test('resolveStoreRelationship detects store root', () => {
  const stores = [createStore({ id: 's1', root: '/my-store' })];
  const rel = resolveStoreRelationship(
    { path: '/my-store', pointerStoreId: null, referenceStoreIds: [] },
    stores,
  );

  assert.equal(rel.isStoreRoot, true);
  assert.equal(rel.hasRelationship, true);
});

test('resolveStoreRelationship detects store root when project root matches store root (registry path, not config path)', () => {
  // The project path here is the registry root (/my-store), NOT the config file path
  // (/my-store/openspec/config.yaml). The Dashboard should pass the registry path.
  const stores = [createStore({ id: 's1', root: '/my-store' })];
  const rel = resolveStoreRelationship(
    { path: '/my-store', pointerStoreId: null, referenceStoreIds: [] },
    stores,
  );

  assert.equal(rel.isStoreRoot, true, 'Registry root /my-store should match store root /my-store');
});

test('resolveStoreRelationship does NOT detect store root when given config file path instead of registry root', () => {
  // If someone mistakenly passes the config file path, it should NOT match
  const stores = [createStore({ id: 's1', root: '/my-store' })];
  const rel = resolveStoreRelationship(
    { path: '/my-store/openspec/config.yaml', pointerStoreId: null, referenceStoreIds: [] },
    stores,
  );

  assert.equal(rel.isStoreRoot, false, 'Config path should NOT match store root');
});

test('resolveStoreRelationship detects pointer', () => {
  const stores = [createStore({ id: 's1', root: '/planning' })];
  const rel = resolveStoreRelationship(
    { path: '/my-project', pointerStoreId: 's1', referenceStoreIds: [] },
    stores,
  );

  assert.equal(rel.pointerStoreId, 's1');
  assert.equal(rel.pointerStoreRoot, '/planning');
  assert.equal(rel.hasRelationship, true);
});

test('resolveStoreRelationship detects references', () => {
  const rel = resolveStoreRelationship(
    { path: '/my-project', pointerStoreId: null, referenceStoreIds: ['s1', 's2'] },
    [],
  );

  assert.deepEqual(rel.referenceStoreIds, ['s1', 's2']);
  assert.equal(rel.hasRelationship, true);
});
