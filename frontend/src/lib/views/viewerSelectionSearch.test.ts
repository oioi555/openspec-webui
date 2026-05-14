import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

// ---------------------------------------------------------------------------
// Helper: read ChangeViewer source once for all tests in this file
// ---------------------------------------------------------------------------
const changeViewerSource = readFile(new URL('./ChangeViewer.svelte', import.meta.url), 'utf8');

test('ChangeViewer selection context menus expose Search and snapshot validated selections', async () => {
  const source = await readFile(new URL('./ChangeViewer.svelte', import.meta.url), 'utf8');

  assert.match(source, /import \{[\s\S]*validateSearchKeyword,[\s\S]*\} from '\$lib\/contextCopy';/);
  assert.match(source, /let snapshotSelection = \$state\(''\);/);
  assert.match(source, /snapshotSelection = window\.getSelection\(\)\?\.toString\(\) \?\? '';/);
  assert.match(source, /let canSearch = \$derived\(validateSearchKeyword\(snapshotSelection\)\.valid\);/);
  assert.match(source, /const \{ valid, keyword \} = validateSearchKeyword\(snapshotSelection\);/);
  assert.match(source, /if \(valid\) \{\s*searchStore\.open\(keyword\);\s*\}/);
  assert.match(source, /getChangeViewerContextLabel\(\{ deltaCapability: delta\.capability \}\)/);
  assert.match(source, /getChangeViewerContextLabel\(\{ activeFileName: activeFile\?\.name \}\)/);

  assert.match(source, /\{t\(m\.common_search\)\}/);
  const searchMenuItems = source.match(/<ContextMenu\.Item disabled=\{!canSearch\} onSelect=\{handleSearchFromSelection\}>[\s\S]*?\{t\(m\.common_search\)\}[\s\S]*?<\/ContextMenu\.Item>/g);
  assert.equal(searchMenuItems?.length, 2);
});

test('SpecViewer selection context menu exposes Search and routes valid keywords through Explorer search', async () => {
  const source = await readFile(new URL('./SpecViewer.svelte', import.meta.url), 'utf8');

  assert.match(source, /import \{[\s\S]*validateSearchKeyword,[\s\S]*\} from '\$lib\/contextCopy';/);
  assert.match(source, /let snapshotSelection = \$state\(''\);/);
  assert.match(source, /snapshotSelection = window\.getSelection\(\)\?\.toString\(\) \?\? '';/);
  assert.match(source, /let canSearch = \$derived\(validateSearchKeyword\(snapshotSelection\)\.valid\);/);
  assert.match(source, /const \{ valid, keyword \} = validateSearchKeyword\(snapshotSelection\);/);
  assert.match(source, /if \(valid\) \{\s*searchStore\.open\(keyword\);\s*\}/);
  assert.match(source, /<ContextMenu\.Item disabled=\{!canSearch\} onSelect=\{handleSearchFromSelection\}>[\s\S]*?\{t\(m\.common_search\)\}[\s\S]*?<\/ContextMenu\.Item>/);
});

// ---------------------------------------------------------------------------
// ChangeViewer – Other Files rendering as a dedicated top-level Other tab
// ---------------------------------------------------------------------------

test('ChangeViewer primary tabs include an Other tab with badge count when other files exist', async () => {
  const source = await changeViewerSource;

  // showOtherTab derives from otherFiles.length and drives tab inclusion
  assert.match(
    source,
    /let showOtherTab = \$derived\(\(change\?\.otherFiles\.length \?\? 0\) > 0\)/,
    'showOtherTab must derive from otherFiles length',
  );

  // The primaryTabs array conditionally includes the Other tab
  assert.match(
    source,
    /\.\.\.\(showOtherTab\s*\n\s*\? \[/,
    'Other tab is spread into primaryTabs only when showOtherTab is true',
  );

  // Other tab uses FIXED_LABELS.dashboard.other and displays a badge
  // equal to the total other file count
  assert.match(
    source,
    /id: 'other-files',\s*\n\s*label: FIXED_LABELS\.dashboard\.other,\s*\n\s*badge: change\.otherFiles\.length,\s*\n\s*hitIndicator: Array\.from\(otherFileHitCounts\.values\(\)\)\.some\(\(count\) => count > 0\)/,
    'Other tab must have id=other-files, label from FIXED_LABELS, badge=otherFiles.length, and hitIndicator',
  );

  // activePrimaryTabId resolves 'other-files' when isOtherActive is true
  assert.match(
    source,
    /let activePrimaryTabId = \$derived\(\s*\n\s*isOtherActive \? 'other-files' : isDeltasActive \? 'spec-deltas' : `group-\$\{activeGroupIndex\}`/,
    'activePrimaryTabId must route other-files when isOtherActive',
  );
});

test('ChangeViewer Other tab selector selects the correct group index and resets file index', async () => {
  const source = await changeViewerSource;

  // selectOtherFiles jumps to the correct position
  assert.match(
    source,
    /function selectOtherFiles\(\)[\s\S]*activeGroupIndex = change\.fileGroups\.length \+ \(change\.specDeltas\.length > 0 \? 1 : 0\);/,
    'selectOtherFiles must compute group index after all groups and optional spec deltas tab',
  );
  assert.match(
    source,
    /function selectOtherFiles\(\)[\s\S]*activeFileIndex = 0;/,
    'selectOtherFiles must reset file index to 0',
  );

  // handlePrimaryTabSelect routes 'other-files' id to selectOtherFiles
  assert.match(
    source,
    /if \(id === 'other-files'\) \{\s*\n\s*selectOtherFiles\(\);/,
    'handlePrimaryTabSelect must route other-files to selectOtherFiles',
  );
});

test('ChangeViewer renders Spec Deltas and Other Files as mutually exclusive branches', async () => {
  const source = await changeViewerSource;

  assert.match(
    source,
    /let isDeltasActive = \$derived\(showDeltasTab && activeGroupIndex === \(change\?\.fileGroups\.length \?\? 0\)\)/,
    'isDeltasActive must be false when a change has no spec deltas so the Other tab can occupy the post-group index',
  );

  // Content area has three mutually exclusive branches:
  //   {#if isDeltasActive}          → spec deltas
  //   {:else if isOtherActive}      → other files
  //   {:else if activeFile}         → standard file groups
  assert.match(
    source,
    /\{#if isDeltasActive\}[\s\S]*\{\:else if isOtherActive\}[\s\S]*\{\:else if activeFile\}/,
    'Content area must branch: isDeltasActive → isOtherActive → activeFile, all mutually exclusive',
  );

  // Each branch is independent — selecting spec deltas does not affect
  // other file open states and vice versa.
  assert.match(
    source,
    /\{#if isDeltasActive\}\s*\n\s*<!-- Spec Deltas -->/,
    'isDeltasActive branch renders spec delta content',
  );
  assert.match(
    source,
    /\{:else if isOtherActive\}\s*\n\s*<div class="flex flex-col gap-3">/,
    'isOtherActive branch renders other files content (not inside deltas)',
  );

  // Secondary file tabs are suppressed when either special tab is active
  assert.match(
    source,
    /\{#if activeGroup && activeGroup\.files\.length > 1 && !isDeltasActive && !isOtherActive\}/,
    'Secondary file tabs must be hidden when deltas or other tab is active',
  );
});

test('ChangeViewer renders Other Files under the isOtherActive branch with collapsible entries', async () => {
  const source = await changeViewerSource;

  // Other files render inside the isOtherActive branch
  assert.match(
    source,
    /\{:else if isOtherActive\}\s*\n\s*<div class="flex flex-col gap-3">\s*\n\s*\{#each change\.otherFiles as otherFile\}/,
    'Other Files must iterate change.otherFiles under isOtherActive',
  );

  // Each other file entry is a collapsible card with data-other-file-path
  assert.match(
    source,
    /data-other-file-path=\{otherFile\.path\}/,
    'Each other file card must have a data-other-file-path attribute for scroll targeting',
  );

  // Per-file hit-count badge displayed when matches exist
  assert.match(
    source,
    /\{#if \(otherFileHitCounts\.get\(otherFile\.path\) \?\? 0\) > 0\}\s*\n\s*<Badge variant="warning"/,
    'Other file collapsible headers must show hit-count badge per file',
  );

  // revisions.json has a known schema and renders as friendly revision cards
  assert.match(
    source,
    /function parseRevisionsFile\(file: OtherFile\): RevisionsFile \| null \{[\s\S]*isRevisionsFile\(file\)[\s\S]*Array\.isArray\(parsed\.revisions\)/,
    'revisions.json should be detected and parsed as a known Other File format',
  );
  assert.match(
    source,
    /function isRevisionsFile\(file: OtherFile\): boolean \{[\s\S]*file\.name === 'revisions\.json'/,
    'revisions.json detection should key off the file name/path',
  );
  assert.match(
    source,
    /\{@const revisionsFile = parseRevisionsFile\(otherFile\)\}[\s\S]*\{#if revisionsFile\}[\s\S]*\{#each revisionsFile\.revisions as revision\}/,
    'Parsed revisions.json files must render as revision cards before generic JSON fallback',
  );

  // Markdown other files render with MarkdownRenderer and highlightQuery
  assert.match(
    source,
    /\{\:else if otherFile\.type === 'markdown'\}\s*\n\s*<MarkdownRenderer content=\{otherFile\.content\} highlightQuery=\{highlightQuery\} \/>/,
    'Markdown other files must reuse MarkdownRenderer with search highlighting',
  );

  // Non-markdown other files render as preformatted text via getOtherFileDisplayContent
  assert.match(
    source,
    /\{:else\}\s*\n\s*<pre class="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border\/60 bg-muted\/30 p-4 text-sm leading-6 text-foreground"><code>\{getOtherFileDisplayContent\(otherFile\)\}<\/code><\/pre>/,
    'JSON, YAML, txt, and unknown text-like files must fall back to preformatted code block',
  );

  // getOtherFileDisplayContent pretty-prints JSON, falls back to raw content
  assert.match(
    source,
    /function getOtherFileDisplayContent\(file: OtherFile\): string \{[\s\S]*if \(file\.type === 'json'\) \{[\s\S]*JSON\.stringify\(JSON\.parse\(file\.content\), null, 2\)[\s\S]*\}[\s\S]*return file\.content;/,
    'getOtherFileDisplayContent must pretty-print JSON and fall back to raw content',
  );
});

test('ChangeViewer search navigation to an otherFilePath selects the Other tab and opens the matching file', async () => {
  const source = await changeViewerSource;

  // Search navigation checks for otherFilePath on the match location
  assert.match(
    source,
    /searchNavigation\.matchLocation\?\.otherFilePath/,
    'Search navigation must handle otherFilePath match location',
  );

  // When otherFilePath is present, selectOtherFiles() is called
  assert.match(
    source,
    /else if \(searchNavigation\.matchLocation\?\.otherFilePath\) \{\s*\n\s*targetOtherFilePath = searchNavigation\.matchLocation\.otherFilePath;\s*\n\s*selectOtherFiles\(\);/,
    'Routing to otherFilePath must call selectOtherFiles()',
  );

  // The matching file's collapsible is opened
  assert.match(
    source,
    /otherFileOpenStates\[targetOtherFilePath\] = true;/,
    'The matched other file collapsible must be opened',
  );

  // Scroll-into-view targets the other file element or its first highlight
  assert.match(
    source,
    /getOtherFileElement\(targetOtherFilePath\)/,
    'getOtherFileElement must be used to locate the scroll target',
  );

  // getOtherFileElement queries for [data-other-file-path] elements
  assert.match(
    source,
    /function getOtherFileElement\(path: string\): HTMLElement \| null \{[\s\S]*contentRef\?\.querySelectorAll<HTMLElement>\('\[data-other-file-path\]'\)/,
    'getOtherFileElement must query for data-other-file-path attribute',
  );
});
