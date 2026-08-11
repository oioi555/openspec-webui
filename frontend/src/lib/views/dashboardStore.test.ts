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
    /pointerStoreRow\.label/,
    'Should display the resolved pointer Store label inline',
  );
  assert.match(
    source,
    /dashboard_open_planning_store/,
    'Should have Open planning Store action label',
  );
  assert.match(
    source,
    /onclick=\{handleOpenPlanningStore\}/,
    'Should wire the direct Open action to handleOpenPlanningStore',
  );
  assert.doesNotMatch(
    source,
    /dashboard_pointer_store_description/,
    'Should NOT render the removed pointer description text',
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

test('Dashboard shows references as a collapsed count with expandable list', async () => {
  const source = await dashboardSource;

  assert.match(
    source,
    /\{#if storeRelationship\.referenceStoreIds\.length > 0\}/,
    'Should show references section when references exist',
  );
  assert.match(
    source,
    /dashboard_references_count/,
    'Should display references count badge',
  );
  assert.match(
    source,
    /<Collapsible\.Trigger/,
    'Should render a Collapsible trigger for references',
  );
  assert.doesNotMatch(
    source,
    /dashboard_references_description/,
    'Should NOT render the removed references description text',
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

test('Dashboard Store bar uses SurfaceCard with consistent shadow', async () => {
  const source = await dashboardSource;

  const storeBarTag = source.match(/<SurfaceCard[^>]*role="navigation"[^>]*>/);
  assert.ok(storeBarTag, 'Should find the Store relationship navigation bar SurfaceCard');

  assert.match(
    storeBarTag[0],
    /shadow="sm"/,
    'Store relationship bar should use shadow="sm" consistent with peer panels',
  );
  assert.match(
    storeBarTag[0],
    /aria-label=\{FIXED_LABELS\.dashboard\.storeRelationship\}/,
    'Store relationship bar should keep the storeRelationship label as aria-label',
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

// ---------------------------------------------------------------------------
// 10. Compact relationship bar: single-line navigation (pointer + references
//     coexist in one bar; no card sections, no description copy)
// ---------------------------------------------------------------------------

test('Dashboard Store relationship renders as one compact navigation bar', async () => {
  const source = await dashboardSource;

  const barTag = source.match(/<SurfaceCard[^>]*role="navigation"[^>]*>/);
  assert.ok(barTag, 'Should find the compact relationship navigation bar');

  // The bar must come before Summary Cards (placement preserved)
  const headerEnd = source.indexOf('<!-- Summary Cards -->');
  assert.ok(headerEnd > 0, 'Should find Summary Cards comment');
  assert.ok(
    (barTag.index ?? 0) < headerEnd,
    'Compact relationship bar should appear directly after header, before Summary Cards',
  );

  // Pointer and references segments coexist inside the same bar
  const barSection = source.slice(
    barTag.index,
    source.indexOf('</SurfaceCard>', barTag.index),
  );
  assert.match(
    barSection,
    /\{#if storeRelationship\.pointerStoreId\}/,
    'Bar should contain the pointer store segment',
  );
  assert.match(
    barSection,
    /referenceStoreIds\.length > 0/,
    'Bar should contain the references segment',
  );

  // No old SectionHeader heading inside the bar
  assert.doesNotMatch(
    barSection,
    /<SectionHeader/,
    'Compact bar should NOT use the old SectionHeader card heading',
  );
  // No description copy anywhere in the relationship section
  assert.doesNotMatch(
    barSection,
    /dashboard_pointer_store_description|dashboard_references_description/,
    'Compact bar should NOT render removed description copy',
  );
});

test('Dashboard pointer label and direct Open action are inline in the bar', async () => {
  const source = await dashboardSource;

  assert.match(
    source,
    /pointerStoreRow\.label/,
    'Pointer Store should be identified by its resolved label',
  );
  assert.match(
    source,
    /<Button variant="default" size="sm"[^>]*onclick=\{handleOpenPlanningStore\}>/,
    'Pointer Open action should be an inline prominent button in one operation',
  );
  assert.match(
    source,
    /title=\{pointerStoreRow\.path\}/,
    'Pointer label should keep the full path in a title for truncation',
  );
});

test('Dashboard pure Store root still gets only the header badge, not the bar', async () => {
  const source = await dashboardSource;

  // Badge stays in the header h1
  const h1Section = source.match(/<h1[^>]*>[\s\S]*?<\/h1>/);
  assert.ok(h1Section, 'Should find h1 element');
  assert.match(h1Section[0], /dashboard_store_root_badge/, 'Header badge should remain in the h1');

  // Bar render condition still requires pointer or references
  assert.match(
    source,
    /\{#if storeRelationship && \(storeRelationship\.pointerStoreId \|\| storeRelationship\.referenceStoreIds\.length > 0\)\}/,
    'Bar should render only for pointer or references projects, never pure Store roots',
  );
});

test('Dashboard references trigger is collapsed by default and expands on activation', async () => {
  const source = await dashboardSource;

  // Collapsible default state
  assert.match(
    source,
    /let referencesOpen = \$state\(false\)/,
    'References should start collapsed by default',
  );
  assert.match(
    source,
    /<Collapsible\.Root open=\{referencesOpen\}/,
    'Collapsible should be driven by the referencesOpen state',
  );

  // Closed state shows chevron-right; open state flips to chevron-down
  assert.match(
    source,
    /\{#if referencesOpen\}[\s\S]*?<ChevronDown[\s\S]*?\{:else\}[\s\S]*?<ChevronRight/,
    'Trigger should show ChevronDown when open and ChevronRight when closed',
  );
});

test('Dashboard references trigger shows a count badge and is hidden at zero', async () => {
  const source = await dashboardSource;

  // The trigger is gated by the length check, so zero references hide it
  assert.match(
    source,
    /\{#if storeRelationship\.referenceStoreIds\.length > 0\}[\s\S]*?<Collapsible\.Trigger/,
    'References trigger should only render when the count is above zero',
  );

  // Count badge uses the referenceStoreIds length
  assert.match(
    source,
    /dashboard_references_count, \{ count: storeRelationship\.referenceStoreIds\.length \}/,
    'Trigger count badge should be driven by referenceStoreIds.length',
  );
  assert.match(
    source,
    /<Badge variant="secondary"/,
    'Count should render in a secondary Badge',
  );
});

test('Dashboard expanded references render one Open row per entry', async () => {
  const source = await dashboardSource;

  const refEachBlock = source.match(
    /\{#each storeRelationship\.referenceStoreIds as refStoreId\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(refEachBlock, 'Should find reference each block');

  // Every entry (0, 3, 10, or more) gets its own navigation row with Open
  assert.match(
    refEachBlock[1],
    /onclick=\{\(\) => handleOpenReferencedStore\(refStoreId\)\}/,
    'Each expanded reference row should expose an Open action for its store',
  );
  assert.match(
    refEachBlock[1],
    /FIXED_LABELS\.common\.open/,
    'Reference Open action should use the shared Open label',
  );
  assert.doesNotMatch(
    refEachBlock[1],
    /mergeUnifiedProjectList/,
    'Expanded reference rows should not recompute merged rows',
  );
});

test('Dashboard unresolved pointer stays visible inline with a Store docs link', async () => {
  const source = await dashboardSource;

  // Declared pointer store id remains visible when unresolved
  assert.match(
    source,
    /\{storeRelationship\.pointerStoreId\}/,
    'Unresolved pointer should keep showing the declared Store id inline',
  );
  // Status copy distinguishes unavailable vs not-found inside the bar
  assert.match(
    source,
    /storeDiscoveryStore\.status === 'unavailable'[\s\S]*?dashboard_store_discovery_unavailable[\s\S]*?\{:else\}[\s\S]*?dashboard_store_not_found/,
    'Unresolved pointer should distinguish discovery unavailable from store not found',
  );
  assert.match(
    source,
    /OPENSPEC_STORES_GUIDE_URL/,
    'Unresolved pointer should provide the official Store documentation link',
  );
});

test('Dashboard unresolved reference entries stay visible in the expanded list with docs link', async () => {
  const source = await dashboardSource;

  const refEachBlock = source.match(
    /\{#each storeRelationship\.referenceStoreIds as refStoreId\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(refEachBlock, 'Should find reference each block');

  assert.match(
    refEachBlock[1],
    /dashboard_store_discovery_unavailable[\s\S]*?dashboard_store_not_found/,
    'Unresolved reference rows should keep both status messages available',
  );
  assert.match(
    refEachBlock[1],
    /OPENSPEC_STORES_GUIDE_URL/,
    'Unresolved reference rows should link to the official Store documentation',
  );
});

test('Dashboard navigation handlers preserve bind/add-project paths', async () => {
  const source = await dashboardSource;

  // Pointer open path: bind if registered, addProject if discovery-only
  assert.match(
    source,
    /handleOpenPlanningStore[\s\S]*?existingRow\?\.projectId[\s\S]*?projectStore\.bindProject\(existingRow\.projectId\)[\s\S]*?projectStore\.addProject\(storeRoot\)/,
    'handleOpenPlanningStore should bind registered rows and addProject discovery-only rows',
  );
  // Referenced store open path keeps the same navigation semantics
  assert.match(
    source,
    /handleOpenReferencedStore[\s\S]*?projectStore\.bindProject\(existingRow\.projectId\)[\s\S]*?projectStore\.addProject\(storeRoot\)/,
    'handleOpenReferencedStore should bind registered rows and addProject discovery-only rows',
  );
});

test('Dashboard references handling never uses the remote field', async () => {
  const source = await dashboardSource;

  assert.doesNotMatch(
    source,
    /\bremote\b/,
    'Reference entries should be handled by id only — remote must not be read, displayed, or validated',
  );
});
