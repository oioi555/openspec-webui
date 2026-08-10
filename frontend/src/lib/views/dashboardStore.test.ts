import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

// ---------------------------------------------------------------------------
// Source-assertion tests for Dashboard Store relationship: badge/card split.
// ---------------------------------------------------------------------------

const dashboardSource = readFile(
  new URL('./Dashboard.svelte', import.meta.url),
  'utf8',
);

// ---------------------------------------------------------------------------
// 1. Badge: pure Store root gets compact header badge, no relationship card
// ---------------------------------------------------------------------------

test('Dashboard renders OpenSpec Store badge in header when isStoreRoot', async () => {
  const source = await dashboardSource;

  assert.match(
    source,
    /storeRelationship\?\.isStoreRoot/,
    'Should check isStoreRoot for badge rendering',
  );
  assert.match(
    source,
    /dashboard_store_root_badge/,
    'Should use dashboard_store_root_badge i18n key for badge',
  );
  assert.match(
    source,
    /<Badge variant="secondary"/,
    'Should use Badge component with secondary variant for Store root badge',
  );
});

test('Dashboard badge appears in the header h1, not in the card', async () => {
  const source = await dashboardSource;

  // The badge should be inside the <h1> element
  const h1Section = source.match(
    /<h1[^>]*>[\s\S]*?<\/h1>/,
  );
  assert.ok(h1Section, 'Should find h1 element');

  assert.match(
    h1Section[0],
    /dashboard_store_root_badge/,
    'Badge should render inside the h1 header element',
  );
});

// ---------------------------------------------------------------------------
// 2. Card condition: only for pointer or references, NOT pure Store root
// ---------------------------------------------------------------------------

test('Dashboard card requires pointerStoreId or referenceStoreIds, not just storeRelationship', async () => {
  const source = await dashboardSource;

  assert.match(
    source,
    /\{#if storeRelationship && \(storeRelationship\.pointerStoreId \|\| storeRelationship\.referenceStoreIds\.length > 0\)\}/,
    'Card should render only when pointerStoreId or references exist',
  );
});

test('Dashboard card does NOT render for pure Store root (no pointer, no references)', async () => {
  const source = await dashboardSource;

  // The old condition was just {#if storeRelationship} — verify it's gone
  // The new condition requires pointerStoreId OR references
  const cardCondition = source.match(
    /\{#if storeRelationship\b/,
  );
  assert.ok(cardCondition, 'Should find card condition');

  // The condition should require additional conditions beyond just storeRelationship
  const fullCondition = source.match(
    /\{#if storeRelationship && \(/,
  );
  assert.ok(fullCondition, 'Card condition should require additional conditions beyond just storeRelationship');
});

// ---------------------------------------------------------------------------
// 3. No isStoreRoot info block in card body
// ---------------------------------------------------------------------------

test('Dashboard card body does not contain Store root info paragraph', async () => {
  const source = await dashboardSource;

  // The old isStoreRoot block with Info icon and description should be removed
  // Verify no dashboard_store_root_description reference exists in the file
  assert.doesNotMatch(
    source,
    /dashboard_store_root_description/,
    'Should not reference dashboard_store_root_description anywhere (removed)',
  );

  // Verify the isStoreRoot check exists only in the header badge, not in the card
  // Find all occurrences of isStoreRoot
  const isStoreRootMatches = [...source.matchAll(/isStoreRoot/g)];
  // Each occurrence should be inside the <h1> section (badge), not in the card
  for (const match of isStoreRootMatches) {
    const beforeMatch = source.slice(Math.max(0, match.index - 500), match.index);
    // Should NOT be inside a SurfaceCard context
    assert.doesNotMatch(
      beforeMatch,
      /SurfaceCard/,
      `isStoreRoot at position ${match.index} should not be inside a SurfaceCard context`,
    );
  }
});

// ---------------------------------------------------------------------------
// 4. Store root detection uses registry project path, not config path
// ---------------------------------------------------------------------------

test('Dashboard uses activeRegistryProject path for Store-root detection', async () => {
  const source = await dashboardSource;

  assert.match(
    source,
    /activeRegistryProject = \$derived\(/,
    'Should derive activeRegistryProject from projectStore.projects',
  );
  assert.match(
    source,
    /projectStore\.projects\.find\(\(p\) => p\.id === projectStore\.activeProjectId\)/,
    'Should look up active project by activeProjectId in registry',
  );
  assert.match(
    source,
    /path: activeRegistryProject\.path/,
    'Should use registry project path for resolveStoreRelationship, not config path',
  );
});

test('Dashboard does not use project.value.path for Store-root comparison', async () => {
  const source = await dashboardSource;

  const scriptSection = source.match(
    /<script[\s\S]*?<\/script>/,
  );
  assert.ok(scriptSection, 'Should find script section');

  const resolveCallInScript = scriptSection[0].match(
    /resolveStoreRelationship\([\s\S]*?storeDiscoveryStore\.stores/,
  );
  assert.ok(resolveCallInScript, 'Should find resolveStoreRelationship call in script');

  assert.doesNotMatch(
    resolveCallInScript[0],
    /project\.value\.path/,
    'Should not pass project.value.path (config file path) to resolveStoreRelationship',
  );
});

// ---------------------------------------------------------------------------
// 5. Pointer store behavior
// ---------------------------------------------------------------------------

test('Dashboard shows pointer store with Open planning Store action', async () => {
  const source = await dashboardSource;

  assert.match(
    source,
    /\{#if storeRelationship\.pointerStoreId\}/,
    'Should show pointer section when pointerStoreId exists',
  );
  assert.match(
    source,
    /dashboard_pointer_store_description/,
    'Should display pointer store description',
  );
  assert.match(
    source,
    /dashboard_open_planning_store/,
    'Should have Open planning Store action label',
  );
  assert.match(
    source,
    /handleOpenPlanningStore/,
    'Should have a handler for opening the planning store',
  );
});

test('Dashboard handleOpenPlanningStore uses addProject for store-only rows', async () => {
  const source = await dashboardSource;

  assert.match(
    source,
    /projectStore\.addProject\(storeRoot\)/,
    'Should call addProject when store is only in CLI discovery',
  );
  assert.match(
    source,
    /projectStore\.bindProject\(existingRow\.projectId\)/,
    'Should call bindProject when store is already registered',
  );
});

test('Dashboard never suggests initializing local specs for pointer projects', async () => {
  const source = await dashboardSource;

  assert.doesNotMatch(
    source,
    /initialize.*spec/i,
    'Should never suggest initializing local specs for pointer projects',
  );
});

// ---------------------------------------------------------------------------
// 6. References behavior
// ---------------------------------------------------------------------------

test('Dashboard shows references as read-only', async () => {
  const source = await dashboardSource;

  assert.match(
    source,
    /\{#if storeRelationship\.referenceStoreIds\.length > 0\}/,
    'Should show references section when references exist',
  );
  assert.match(
    source,
    /dashboard_references_description/,
    'Should display references description',
  );
});

test('Dashboard referenced stores are navigable', async () => {
  const source = await dashboardSource;

  assert.match(
    source,
    /handleOpenReferencedStore/,
    'Should have handler for opening referenced stores',
  );
});

// ---------------------------------------------------------------------------
// 7. Unresolved pointer: always shows store id, distinguishes unavailable vs not-found
// ---------------------------------------------------------------------------

test('Dashboard always displays declared Store id for unresolved pointer', async () => {
  const source = await dashboardSource;

  assert.match(
    source,
    /storeRelationship\.pointerStoreId/,
    'Should reference the declared pointerStoreId in unresolved section',
  );
});

test('Dashboard distinguishes discovery unavailable from store not found', async () => {
  const source = await dashboardSource;

  assert.match(
    source,
    /dashboard_store_discovery_unavailable/,
    'Should have message for discovery unavailable (CLI/list error)',
  );
  assert.match(
    source,
    /dashboard_store_not_found/,
    'Should have message for store not found in successful catalog',
  );
  assert.match(
    source,
    /storeDiscoveryStore\.status === 'unavailable'/,
    'Should check discovery status to distinguish the two cases',
  );
});

test('Dashboard unresolved pointer never suggests local initialization', async () => {
  const source = await dashboardSource;

  assert.doesNotMatch(
    source,
    /initialize.*local/i,
    'Should never suggest initializing local specs or data',
  );
});

// ---------------------------------------------------------------------------
// 8. Card placement: directly after header, before summary cards
// ---------------------------------------------------------------------------

test('Dashboard Store card is placed directly after header, before summary cards', async () => {
  const source = await dashboardSource;

  const headerEnd = source.indexOf('<!-- Summary Cards -->');
  assert.ok(headerEnd > 0, 'Should find Summary Cards comment');

  const storeCardPos = source.indexOf('FIXED_LABELS.dashboard.storeRelationship');
  assert.ok(storeCardPos > 0, 'Should find Store Relationship heading');
  assert.ok(
    storeCardPos < headerEnd,
    'Store Relationship card should appear before Summary Cards',
  );
});

test('Dashboard Store card uses SurfaceCard with consistent shadow', async () => {
  const source = await dashboardSource;

  const storeCardSection = source.match(
    /<SurfaceCard[^>]*>[\s\S]*?FIXED_LABELS\.dashboard\.storeRelationship/,
  );
  assert.ok(storeCardSection, 'Should find Store relationship SurfaceCard section');

  assert.match(
    storeCardSection[0],
    /shadow="sm"/,
    'Store relationship card should use shadow="sm" consistent with peer panels',
  );
});

// ---------------------------------------------------------------------------
// 9. Performance: mergedRows computed once, not per-row IIFE
// ---------------------------------------------------------------------------

test('Dashboard computes mergedRows once as derived state', async () => {
  const source = await dashboardSource;

  assert.match(
    source,
    /let mergedRows = \$derived\(/,
    'Should compute mergedRows once as derived state',
  );
});

test('Dashboard reference rows use pre-computed mergedRows, not per-IIFE mergeUnifiedProjectList', async () => {
  const source = await dashboardSource;

  const refEachBlock = source.match(
    /\{#each storeRelationship\.referenceStoreIds as refStoreId\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(refEachBlock, 'Should find reference each block');

  assert.doesNotMatch(
    refEachBlock[1],
    /mergeUnifiedProjectList/,
    'Reference rows should NOT call mergeUnifiedProjectList per-IIFE',
  );
  assert.match(
    refEachBlock[1],
    /mergedRows\.find/,
    'Reference rows should use pre-computed mergedRows',
  );
});
