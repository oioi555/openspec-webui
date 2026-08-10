import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

// ---------------------------------------------------------------------------
// Source-assertion tests for the Project Selector unified list, header links,
// Store badges, and store-only row behavior.
// ---------------------------------------------------------------------------

const selectorSource = readFile(
  new URL('./ProjectSelector.svelte', import.meta.url),
  'utf8',
);

// ---------------------------------------------------------------------------
// 1. Header documentation links (inside SharedDialogHeader children)
// ---------------------------------------------------------------------------

test('Project Selector renders OpenSpec Stores Guide link inside SharedDialogHeader', async () => {
  const source = await selectorSource;

  assert.match(
    source,
    /OPENSPEC_STORES_GUIDE_URL/,
    'Selector should import and use OPENSPEC_STORES_GUIDE_URL',
  );
  assert.match(
    source,
    /project_selector_stores_guide/,
    'Selector should render the stores guide label from i18n',
  );
  assert.match(
    source,
    /target="_blank"/,
    'Documentation links should open in new tab',
  );
  assert.match(
    source,
    /rel="noopener noreferrer"/,
    'Documentation links should have noopener noreferrer',
  );
});

test('Project Selector renders Store CLI Reference link inside SharedDialogHeader', async () => {
  const source = await selectorSource;

  assert.match(
    source,
    /OPENSPEC_STORE_CLI_REFERENCE_URL/,
    'Selector should import and use OPENSPEC_STORE_CLI_REFERENCE_URL',
  );
  assert.match(
    source,
    /project_selector_store_cli_reference/,
    'Selector should render the store CLI reference label from i18n',
  );
});

test('Project Selector doc links are inside SharedDialogHeader children snippet', async () => {
  const source = await selectorSource;

  // The links should be rendered inside <SharedDialogHeader ...> ... </SharedDialogHeader>
  // as a children snippet, after the description.
  const headerBlock = source.match(
    /<SharedDialogHeader[\s\S]*?<\/SharedDialogHeader>/,
  );
  assert.ok(headerBlock, 'Should find SharedDialogHeader block');

  const headerContent = headerBlock[0];
  assert.match(
    headerContent,
    /OPENSPEC_STORES_GUIDE_URL/,
    'Stores Guide URL should be inside SharedDialogHeader',
  );
  assert.match(
    headerContent,
    /OPENSPEC_STORE_CLI_REFERENCE_URL/,
    'Store CLI Reference URL should be inside SharedDialogHeader',
  );
  assert.match(
    headerContent,
    /mt-2 flex flex-wrap items-center gap-3 text-xs/,
    'Links container should be inside header with proper spacing',
  );
});

// ---------------------------------------------------------------------------
// 1b. Official Store links: exact links, structurally outside status logic
// ---------------------------------------------------------------------------

const storeDiscoveryStatuses = ['stores', 'empty', 'unavailable'] as const;

function extractHeaderBlock(source: string): string {
  const headerBlock = source.match(/<SharedDialogHeader[\s\S]*?<\/SharedDialogHeader>/);
  assert.ok(headerBlock, 'Should find SharedDialogHeader block');
  return headerBlock[0];
}

test('Project Selector header contains exactly the two official Store links', async () => {
  const source = await selectorSource;
  const headerContent = extractHeaderBlock(source);

  assert.match(
    headerContent,
    /href=\{OPENSPEC_STORES_GUIDE_URL\}/,
    'Stores Guide link should render the exact guide URL',
  );
  assert.match(
    headerContent,
    /href=\{OPENSPEC_STORE_CLI_REFERENCE_URL\}/,
    'Store CLI Reference link should render the exact reference URL',
  );

  // Exactly two anchor links — no third link sneaks into the header.
  const anchors = headerContent.match(/<a\b/g) ?? [];
  assert.equal(anchors.length, 2, 'SharedDialogHeader should contain exactly two doc links');
});

test('Project Selector official Store links are independent of every discovery status', async () => {
  const source = await selectorSource;
  const headerContent = extractHeaderBlock(source);

  for (const status of storeDiscoveryStatuses) {
    assert.doesNotMatch(
      headerContent,
      new RegExp(`storeDiscoveryStore\\.status === '${status}'`),
      `Header links must not be gated by discovery status '${status}'`,
    );
    assert.match(
      headerContent,
      /href=\{OPENSPEC_STORES_GUIDE_URL\}/,
      `Stores Guide link must remain inside header for status '${status}'`,
    );
    assert.match(
      headerContent,
      /href=\{OPENSPEC_STORE_CLI_REFERENCE_URL\}/,
      `Store CLI Reference link must remain inside header for status '${status}'`,
    );
  }
});

test('Project Selector official Store links are structurally outside the discovery status conditional', async () => {
  const source = await selectorSource;

  const headerStart = source.indexOf('<SharedDialogHeader');
  const headerEnd = source.indexOf('</SharedDialogHeader>');
  const unavailableConditional = source.indexOf(`storeDiscoveryStore.status === 'unavailable'`);

  assert.ok(headerStart !== -1, 'Should find SharedDialogHeader opening tag');
  assert.ok(headerEnd !== -1 && headerEnd > headerStart, 'Should find SharedDialogHeader closing tag');
  assert.ok(unavailableConditional !== -1, 'Should find the discovery status conditional');

  // The links live inside the header, which closes before the status conditional
  // opens — so they can never be inside `{#if storeDiscoveryStore.status === ...}`.
  assert.ok(
    headerEnd < unavailableConditional,
    'Header (with links) should close before the discovery status conditional',
  );

  const headerRegion = source.slice(headerStart, headerEnd + '</SharedDialogHeader>'.length);
  assert.doesNotMatch(
    headerRegion,
    /\{#if storeDiscoveryStore\.status/,
    'Header links region should contain no status conditional',
  );
  assert.match(
    headerRegion,
    /href=\{OPENSPEC_STORES_GUIDE_URL\}/,
    'Stores Guide link should be inside the header region',
  );
  assert.match(
    headerRegion,
    /href=\{OPENSPEC_STORE_CLI_REFERENCE_URL\}/,
    'Store CLI Reference link should be inside the header region',
  );
});

// ---------------------------------------------------------------------------
// 2. Unified list and merge behavior
// ---------------------------------------------------------------------------

test('Project Selector uses mergeUnifiedProjectList with 2-arg signature', async () => {
  const source = await selectorSource;

  assert.match(
    source,
    /mergeUnifiedProjectList\(/,
    'Selector should use mergeUnifiedProjectList helper',
  );
  assert.match(
    source,
    /unifiedRows/,
    'Selector should iterate over unifiedRows',
  );
  // Verify 2-arg call (projects, stores) — no active project args
  assert.match(
    source,
    /mergeUnifiedProjectList\(\s*projects,\s*storeDiscoveryStore\.stores,\s*\)/,
    'Should call mergeUnifiedProjectList with only projects and stores',
  );
});

test('Project Selector iterates unifiedRows as one flat list', async () => {
  const source = await selectorSource;

  assert.match(
    source,
    /\{#each unifiedRows as row\}/,
    'Should iterate unifiedRows as a single flat list',
  );

  // No second list, no "Registered Stores" heading, no separate store region
  assert.doesNotMatch(
    source,
    /Registered Stores/,
    'Should not have a Registered Stores heading',
  );
  assert.doesNotMatch(
    source,
    /storesExplorerSection/i,
    'Should not reference a separate stores explorer section',
  );
});

// ---------------------------------------------------------------------------
// 3. Store-only row selection behavior
// ---------------------------------------------------------------------------

test('Store-only rows use handleStoreRowSelect which calls addProject', async () => {
  const source = await selectorSource;

  assert.match(
    source,
    /async function handleStoreRowSelect\(row: UnifiedProjectRow\)/,
    'Should have a handleStoreRowSelect function',
  );
  assert.match(
    source,
    /projectStore\.addProject\(row\.canonicalRoot\)/,
    'Store-only rows should call addProject to register and activate',
  );
  assert.match(
    source,
    /onclick=\{\(\) => handleStoreRowSelect\(row\)\}/,
    'Each row button should call handleStoreRowSelect',
  );
});

// ---------------------------------------------------------------------------
// 4. Store badges
// ---------------------------------------------------------------------------

test('Project Selector renders Store badge with store id', async () => {
  const source = await selectorSource;

  assert.match(
    source,
    /\{#if row\.storeId\}/,
    'Should conditionally render store badge',
  );
  assert.match(
    source,
    /project_selector_store_badge/,
    'Should use store badge i18n key',
  );
  assert.match(
    source,
    /\{ id: row\.storeId \}/,
    'Should pass store id to the badge label',
  );
});

test('Project Selector renders Points to badge for pointer relationships', async () => {
  const source = await selectorSource;

  assert.match(
    source,
    /\{#if row\.pointsToStoreId\}/,
    'Should conditionally render pointer badge',
  );
  assert.match(
    source,
    /project_selector_points_to/,
    'Should use points_to i18n key',
  );
});

test('Project Selector renders References count badge', async () => {
  const source = await selectorSource;

  assert.match(
    source,
    /\{#if row\.referenceCount > 0\}/,
    'Should conditionally render reference count badge',
  );
  assert.match(
    source,
    /project_selector_references_count/,
    'Should use references_count i18n key',
  );
});

// ---------------------------------------------------------------------------
// 5. Remove button only for registry entries
// ---------------------------------------------------------------------------

test('Remove button is only available for non-store-only rows', async () => {
  const source = await selectorSource;

  assert.match(
    source,
    /canRemove = row\.projectId !== null && !row\.isStoreOnly/,
    'Remove should be gated by having a projectId and not being store-only',
  );
});

// ---------------------------------------------------------------------------
// 6. Discovery unavailable status
// ---------------------------------------------------------------------------

test('Project Selector shows discovery unavailable status line', async () => {
  const source = await selectorSource;

  assert.match(
    source,
    /storeDiscoveryStore\.status === 'unavailable'/,
    'Should check discovery unavailable state',
  );
  assert.match(
    source,
    /project_selector_unavailable_stores/,
    'Should render localized unavailable message',
  );
});

// ---------------------------------------------------------------------------
// 7. No separate Store region or Open Store action
// ---------------------------------------------------------------------------

test('Project Selector has no separate Open Store button or action', async () => {
  const source = await selectorSource;

  assert.doesNotMatch(
    source,
    /Open Store/,
    'Should not have an Open Store action',
  );
  assert.doesNotMatch(
    source,
    /openStore/,
    'Should not have an openStore function',
  );
});
