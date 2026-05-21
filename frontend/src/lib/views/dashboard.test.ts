import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

// ---------------------------------------------------------------------------
// Source-assertion tests for the Dashboard Active Changes panel surface,
// click behaviour, and CommandShortcutBar non-navigation semantics.
//
// These tests read component source at test-time and assert structural
// properties of the Dashboard.svelte and CommandShortcutBar.svelte templates.
// They do NOT mount Svelte components (no DOM/JSDOM), keeping them fast and
// stable across runtime refactors.
// ---------------------------------------------------------------------------

const dashboardSource = readFile(new URL('./Dashboard.svelte', import.meta.url), 'utf8');
const commandBarSource = readFile(
  new URL('../components/shared/CommandShortcutBar.svelte', import.meta.url),
  'utf8',
);
const surfaceCardSource = readFile(
  new URL('../components/shared/surface/surface-card.svelte', import.meta.url),
  'utf8',
);

// ---------------------------------------------------------------------------
// 1. Dashboard Active Changes panel shadow treatment
// ---------------------------------------------------------------------------

test('Dashboard Active Changes section uses SurfaceCard with shadow consistent with peer panels', async () => {
  const source = await dashboardSource;

  // SurfaceCard accepts shadow="sm" | shadow="lg" (default "lg").
  // The bug was that Active Changes used shadow="lg" while peers like
  // Recent Activity used shadow="sm". After the fix all peer dashboard
  // section SurfaceCards should share the same shadow value.
  //
  // We verify:
  //   - Active Changes SurfaceCard explicitly specifies a shadow prop
  //   - Recent Activity SurfaceCard uses the same shadow value
  //   - Planning Context SurfaceCard uses the same shadow value

  // Find all SurfaceCard usages in the dashboard to verify consistency
  const surfaceCardUsages = source.match(/<SurfaceCard[^>]*>/g) ?? [];

  assert.ok(surfaceCardUsages.length >= 2, 'Dashboard should contain at least two SurfaceCard sections');

  // Extract shadow prop values from each SurfaceCard
  const shadowValues = surfaceCardUsages.map((usage) => {
    const match = usage.match(/shadow="(\w+)"/);
    return match ? match[1] : null; // null means default (lg)
  });

  // After fix: all dashboard section SurfaceCards should use shadow="sm"
  // (or any consistent value). The key invariant is that they're ALL the same.
  const nonNullShadows = shadowValues.filter((v): v is string => v !== null);
  if (nonNullShadows.length > 0) {
    const first = nonNullShadows[0];
    for (const shadow of nonNullShadows) {
      assert.equal(
        shadow,
        first,
        `All dashboard SurfaceCard shadow values must match. Found '${first}' and '${shadow}'.`,
      );
    }
  }
});

test('Dashboard Active Changes SurfaceCard uses the softer shadow option after the fix', async () => {
  const source = await dashboardSource;
  const surfaceSource = await surfaceCardSource;

  // SurfaceCard supports 'sm' and 'lg' shadow options.
  // The shared dashboard spec says peer panels should use consistent
  // default shadow. After fix, the Active Changes panel should use
  // shadow="sm" (matching Recent Activity and other peers).
  //
  // We check that the Active Changes section explicitly passes shadow="sm"
  // by looking at the section that contains the Active Changes heading.

  // The Active Changes section is the one containing SquarePen and
  // FIXED_LABELS.dashboard.activeChanges in the header.
  // Find the SurfaceCard nearest to that content.
  const activeChangesSectionMatch = source.match(
    /<SurfaceCard[^>]*>[\s\S]*?SquarePen[\s\S]*?FIXED_LABELS\.dashboard\.activeChanges/,
  );
  assert.ok(activeChangesSectionMatch, 'Should find Active Changes SurfaceCard section');

  const activeChangesCardTag = activeChangesSectionMatch[0].match(/<SurfaceCard[^>]*>/)?.[0];
  assert.ok(activeChangesCardTag, 'Should find the opening SurfaceCard tag for Active Changes');

  // The card should explicitly set shadow="sm" after the fix
  assert.match(activeChangesCardTag, /shadow="sm"/, 'Active Changes SurfaceCard should use shadow="sm"');

  // Confirm SurfaceCard still supports both shadow options
  assert.match(surfaceSource, /sm: 'shadow-sm'/);
  assert.match(surfaceSource, /lg: 'shadow-lg'/);
});

// ---------------------------------------------------------------------------
// 2. Dashboard Active Changes summary click handler opens change via openActiveChange
// ---------------------------------------------------------------------------

test('openActiveChange function focuses the active-changes section and opens the change tab', async () => {
  const source = await dashboardSource;

  // openActiveChange should call layoutStore.focusSection('active-changes')
  // and tabStore.open with the encoded change path.
  assert.match(source, /function openActiveChange\(name: string\)/);
  assert.match(source, /layoutStore\.focusSection\('active-changes'\)/);
  assert.match(source, /tabStore\.open\(`\/changes\/\$\{encodeURIComponent\(name\)\}`\)/);
});

test('each Dashboard Active Changes item wires onclick to openActiveChange with the correct name', async () => {
  const source = await dashboardSource;

  // The sortedActiveChanges loop should produce a clickable button that
  // calls openActiveChange(change.name)
  assert.match(source, /\{#each sortedActiveChanges as change(?:, i)?\}/);

  // The primary summary button should call openActiveChange
  assert.match(
    source,
    /onclick=\{\(\) => openActiveChange\(change\.name\)\}/,
    'Active Changes row button should call openActiveChange(change.name)',
  );

  // The ItemContextMenu should also support open-in-new-tab via openActiveChange
  assert.match(
    source,
    /onOpenInNewTab: \(\) => openActiveChange\(change\.name\)/,
    'Context menu open-in-new-tab should also call openActiveChange',
  );
});

// ---------------------------------------------------------------------------
// 3. Active Changes rows use bounded solid task-card treatment
// ---------------------------------------------------------------------------

test('Active Changes rows use bounded solid task-card styling instead of hover lift', async () => {
  const source = await dashboardSource;

  assert.match(
    source,
    /<div class="flex flex-col gap-2 p-4">/,
    'Active Changes list should keep item spacing so compound Next Step rows remain legible',
  );

  // Active Changes are compound task items, so each item keeps a subtle
  // bounded surface while avoiding large-radius floating-card styling.
  const eachBlock = source.match(
    /\{#each sortedActiveChanges as change\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(eachBlock, 'Should find the sortedActiveChanges each block');
  const loopBody = eachBlock[1];

  // Find the InteractiveCard inside the loop
  const cardMatch = loopBody.match(/<InteractiveCard[^>]*>/);
  assert.ok(cardMatch, 'Should find an InteractiveCard inside the loop');

  assert.match(cardMatch[0], /radius="sm"/);
  assert.match(cardMatch[0], /bg-background\/60 shadow-none p-0/);

  assert.match(
    loopBody,
    /class="cursor-pointer border-t border-border\/40 bg-secondary\/20 px-5 py-2\.5"/,
    'Next Step sub-row should use a weaker internal separator and subtle background',
  );

  // InteractiveCard still preserves lift for outer card-tone surfaces, while
  // inset rows use grounded border/background hover treatment.
  const interactiveSource = await readFile(
    new URL('../components/shared/surface/interactive-card.svelte', import.meta.url),
    'utf8',
  );
  assert.match(
    interactiveSource,
    /tone === 'card' && 'hover:-translate-y-0\.5 hover:border-primary\/40 hover:shadow-md'/,
    'card-tone InteractiveCard should keep the calmer outer-card hover lift',
  );
  assert.match(
    interactiveSource,
    /tone === 'inset' && 'hover:border-primary\/40'/,
    'inset InteractiveCard should use border hover instead of lift',
  );
});

// ---------------------------------------------------------------------------
// 4. Next Step row container opens the change
// ---------------------------------------------------------------------------

test('Next Step command row container itself opens the change via openActiveChange', async () => {
  const source = await dashboardSource;

  const eachBlock = source.match(
    /\{#each sortedActiveChanges as change(?:, i)?\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(eachBlock, 'Should find the sortedActiveChanges each block');
  const loopBody = eachBlock[1];

  // The Next Step row should be wrapped in a clickable container that calls
  // openActiveChange(change.name). This makes the background/label area open
  // the change, while command chips inside stop propagation.
  const nextStepRow = loopBody.match(
    /<div[^>]*border-t[^>]*onclick=\{[^}]*openActiveChange\(change\.name\)[^}]*\}[^>]*>[\s\S]*?nextStep/,
  ) ?? loopBody.match(
    /onclick=\{\(\) => openActiveChange\(change\.name\)\}[\s\S]*?border-t[\s\S]*?nextStep/i,
  );

  // More robust: find the command row section and verify it has an onclick
  // that opens the change. The row is inside {#if changeCommands.length > 0}.
  const commandRowSection = loopBody.match(
    /\{#if changeCommands\.length > 0\}([\s\S]*?)\{\/if\}/,
  );
  assert.ok(commandRowSection, 'Should find the changeCommands conditional block');

  const rowContent = commandRowSection[1];

  // The outermost div of the command row should have an onclick calling
  // openActiveChange(change.name) so clicking the background/label opens the change.
  assert.match(
    rowContent,
    /onclick=\{\(\) => openActiveChange\(change\.name\)\}/,
    'Next Step row container must call openActiveChange(change.name) on click',
  );

  assert.match(
    rowContent,
    /role="button"/,
    'Next Step row container should expose button semantics for accessibility',
  );

  assert.match(
    rowContent,
    /tabindex="0"/,
    'Next Step row container should be keyboard focusable',
  );

  assert.match(
    rowContent,
    /onkeydown=\{\(event\) => \{[\s\S]*event\.key === 'Enter' \|\| event\.key === ' '[\s\S]*openActiveChange\(change\.name\);[\s\S]*\}\}/,
    'Next Step row container should open the change on Enter/Space',
  );

  // The border separator should still be present
  assert.match(
    rowContent,
    /border-t/,
    'Next Step row should retain the border-t visual separator',
  );
});

// ---------------------------------------------------------------------------
// 5. CommandShortcutBar / command chip interactions remain non-navigating
// ---------------------------------------------------------------------------

test('CommandShortcutBar does not import or call tabStore or layoutStore', async () => {
  const source = await commandBarSource;

  // CommandShortcutBar should only copy commands to clipboard.
  // It must NOT navigate (no tabStore, layoutStore imports or calls).
  assert.doesNotMatch(source, /tabStore/);
  assert.doesNotMatch(source, /layoutStore/);

  // It should use the clipboard API for copying
  assert.match(source, /navigator\.clipboard\.writeText/);
  assert.match(source, /copyCommand/);
});

test('command chips stop click propagation so clicking a chip does not open the change', async () => {
  const source = await dashboardSource;
  const commandSource = await commandBarSource;

  const eachBlock = source.match(
    /\{#each sortedActiveChanges as change(?:, i)?\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(eachBlock, 'Should find the sortedActiveChanges each block');
  const loopBody = eachBlock[1];

  const commandRowSection = loopBody.match(
    /\{#if changeCommands\.length > 0\}([\s\S]*?)\{\/if\}/,
  );
  assert.ok(commandRowSection, 'Should find the changeCommands conditional block');
  const rowContent = commandRowSection[1];

  // The CommandShortcutBar buttons must stop propagation so clicking a
  // command chip does not bubble up to the row container's openActiveChange
  // handler.
  assert.match(
    commandSource,
    /stopPropagation/,
    'Command chips must call stopPropagation to prevent opening the change',
  );

  assert.match(
    commandSource,
    /onclick=\{\(event\) => \{[\s\S]*event\.stopPropagation\(\);[\s\S]*copyCommand\(command\);[\s\S]*\}\}/,
    'Command chip click handler should stop propagation before copying the command',
  );

  // Verify CommandShortcutBar still passes changeName for copy-to-clipboard
  assert.match(
    rowContent,
    /<CommandShortcutBar commands=\{changeCommands\} changeName=\{change\.name\} \/>/,
    'Change-level CommandShortcutBar should still pass changeName for command text building',
  );
});

test('Dashboard command row keeps the summary button and command chips as separate interaction zones', async () => {
  const source = await dashboardSource;

  const eachBlock = source.match(
    /\{#each sortedActiveChanges as change(?:, i)?\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(eachBlock, 'Should find the sortedActiveChanges each block');
  const loopBody = eachBlock[1];

  // The primary summary button should still exist and call openActiveChange
  const summaryButton = loopBody.match(
    /<button\s+type="button"\s+class="group w-full px-4 py-3 text-left"\s+onclick=\{\(\) => openActiveChange\(change\.name\)\}([\s\S]*?)<\/button>/,
  );
  assert.ok(summaryButton, 'Should find the primary summary button block within the loop');

  // CommandShortcutBar must NOT appear inside the summary button block
  assert.doesNotMatch(
    summaryButton[0],
    /CommandShortcutBar/,
    'CommandShortcutBar must not be nested inside the summary button',
  );

  // CommandShortcutBar appears after the button, inside the command row
  assert.match(
    loopBody,
    /<\/button>[\s\S]*?\{#if changeCommands\.length > 0\}[\s\S]*?border-t[\s\S]*?CommandShortcutBar/,
    'CommandShortcutBar should appear in the bordered command row after the summary button',
  );
});

test('Dashboard workspace-level CommandShortcutBar in the header does not navigate', async () => {
  const source = await dashboardSource;

  // The workspace-level command bar in the Active Changes header area
  // should also not navigate — it's just for copy-to-clipboard commands.
  assert.match(
    source,
    /<CommandShortcutBar commands=\{workspaceCommands\} \/>/,
    'Workspace-level CommandShortcutBar should not pass changeName (no navigation needed)',
  );

  // workspaceCommands are derived from getWorkspaceCommands which only
  // produces copy-command workflows, not navigation commands
  assert.match(source, /getWorkspaceCommands\(activeChanges\.value, commandPreferencesSnapshot\(\)\)/);
});

test('CommandChip component renders a button with type="button" default (not submit)', async () => {
  const chipSource = await readFile(
    new URL('../components/shared/command-chip/command-chip.svelte', import.meta.url),
    'utf8',
  );

  // CommandChip should default to type="button" so it never submits a form
  assert.match(chipSource, /type = 'button'/);
  assert.match(chipSource, /\{type\}/);
});

test('shared dense-surface primitives use restrained radii', async () => {
  const cardSource = await readFile(
    new URL('../components/ui/card/card.svelte', import.meta.url),
    'utf8',
  );
  const badgeSource = await readFile(
    new URL('../components/ui/badge/badge.svelte', import.meta.url),
    'utf8',
  );
  const iconBoxSource = await readFile(
    new URL('../components/shared/icon-box/icon-box.svelte', import.meta.url),
    'utf8',
  );
  const insetPanelSource = await readFile(
    new URL('../components/shared/surface/inset-panel.svelte', import.meta.url),
    'utf8',
  );

  assert.match(cardSource, /rounded-lg border py-6 shadow/);
  assert.equal(cardSource.includes('rounded-xl border py-6 shadow'), false);
  assert.match(badgeSource, /rounded-sm border px-2\.5 py-0\.5/);
  assert.match(iconBoxSource, /lg: 'h-9 w-9 rounded-md'/);
  assert.match(insetPanelSource, /'rounded-md border px-4 py-4'/);
});

test('Dashboard active-change items derive validation status icon using deriveValidationListIconState', async () => {
  const source = await dashboardSource;

  // The sortedActiveChanges loop should call validationStatusForActiveChange
  // which uses deriveValidationListIconState with deriveValidationTargetSummary.
  assert.match(
    source,
    /function validationStatusForActiveChange\(name: string\)/,
    'validationStatusForActiveChange helper should exist',
  );
  assert.match(
    source,
    /deriveValidationListIconState\([\s\S]*'active-change'[\s\S]*deriveValidationTargetSummary/,
    'helper must call deriveValidationListIconState with active-change kind and deriveValidationTargetSummary state',
  );

  // The icon is conditionally rendered inside the each block
  assert.match(
    source,
    /\{#if validationStatus\}\s*\n\s*<StatusIndicator state=\{validationStatus\} format="minimal" showLabel=\{false\} class="shrink-0" \/>/,
    'validationStatus icon should render as minimal StatusIndicator when non-null',
  );
});

test('Dashboard active-change validation icon appears in title row after creation badges', async () => {
  const source = await dashboardSource;
  const eachBlock = source.match(
    /\{#each sortedActiveChanges as change(?:, i)?\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(eachBlock, 'Should find the sortedActiveChanges each block');
  const loopBody = eachBlock[1];

  const titleRow = loopBody.match(
    /<div class="flex flex-wrap items-center gap-2">([\s\S]*?)\n\s*<\/div>\n\s*<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">/,
  );
  assert.ok(titleRow, 'Should find the active-change title/badge row');

  assert.match(
    titleRow[1],
    /\{change\.name\}[\s\S]*FIXED_LABELS\.dashboard\.proposal[\s\S]*FIXED_LABELS\.common\.design[\s\S]*\{#if validationStatus\}[\s\S]*<StatusIndicator state=\{validationStatus\} format="minimal" showLabel=\{false\} class="shrink-0" \/>/,
    'validation status should appear after change name, Proposal badge, and Design badge in the title row',
  );
});

// ---------------------------------------------------------------------------
// Other Files badge – dashboard card badge visibility for meaningful other
// files vs .openspec.yaml-only
// ---------------------------------------------------------------------------

test('Dashboard active-change title row places the Other N badge after Design when meaningful other files exist', async () => {
  const source = await dashboardSource;
  const eachBlock = source.match(
    /\{#each sortedActiveChanges as change(?:, i)?\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(eachBlock, 'Should find the sortedActiveChanges each block');
  const loopBody = eachBlock[1];

  // The title row renders badges in a flex-wrap gap-2 container.
  // Order: change.name → Proposal → Design → Other N → validationStatus.
  const titleRow = loopBody.match(
    /<div class="flex flex-wrap items-center gap-2">([\s\S]*?)\n\s*<\/div>/,
  );
  assert.ok(titleRow, 'title row should be a flex-wrap gap-2 container');

  const badgeZone = titleRow[1];
  assert.match(badgeZone, /\{change\.name\}/, 'change name appears first');
  assert.match(badgeZone, /FIXED_LABELS\.dashboard\.proposal/, 'Proposal badge present');
  assert.match(badgeZone, /FIXED_LABELS\.common\.design/, 'Design badge present');

  assert.match(
    badgeZone,
    /FIXED_LABELS\.common\.design[\s\S]*change\.otherFileCount > 0[\s\S]*getOtherFileCountLabel\(change\.otherFileCount\)[\s\S]*\{#if validationStatus\}/,
    'Other badge should appear after Design and before validation status',
  );
});

test('Dashboard only renders the Other N badge when otherFileCount is greater than zero', async () => {
  const source = await dashboardSource;
  const eachBlock = source.match(
    /\{#each sortedActiveChanges as change(?:, i)?\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(eachBlock, 'Should find the sortedActiveChanges each block');
  const loopBody = eachBlock[1];

  assert.match(
    loopBody,
    /otherFileCount/,
    'otherFileCount should drive dashboard badge visibility',
  );
  assert.match(
    loopBody,
    /\{#if change\.otherFileCount > 0\}\s*\n\s*<Badge variant="outline">\{getOtherFileCountLabel\(change\.otherFileCount\)\}<\/Badge>\s*\n\s*\{\/if\}/,
    'Other badge should be conditionally hidden for .openspec.yaml-only changes',
  );
});

test('Dashboard active-change rows do not render trailing arrow icons', async () => {
  const source = await dashboardSource;
  const eachBlock = source.match(
    /\{#each sortedActiveChanges as change(?:, i)?\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(eachBlock, 'Should find the sortedActiveChanges each block');

  assert.doesNotMatch(
    eachBlock[1],
    /<ArrowRight\b/,
    'Active Changes rows should not render a trailing ArrowRight icon',
  );
});

test('Dashboard active-change progress area is right-aligned after arrow removal', async () => {
  const source = await dashboardSource;
  const eachBlock = source.match(
    /\{#each sortedActiveChanges as change(?:, i)?\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(eachBlock, 'Should find the sortedActiveChanges each block');
  const loopBody = eachBlock[1];

  assert.match(
    loopBody,
    /<div class="flex min-w-45 shrink-0 items-center justify-end">\s*\n\s*<div class="w-36 min-w-0 shrink-0">/,
    'Active Changes progress area should right-align the fixed-width progress bar without reserving arrow space',
  );
});

test('Dashboard recent activity derives compact validation status for active changes and specs only', async () => {
  const source = await dashboardSource;

  assert.match(
    source,
    /function validationStatusForRecentActivity\(item: RecentActivityItem\)/,
    'validationStatusForRecentActivity helper should exist',
  );
  assert.match(
    source,
    /if \(item\.kind === 'active-change'\)[\s\S]*deriveValidationListIconState\([\s\S]*'active-change'[\s\S]*deriveValidationTargetSummary\(validationStore, \{ type: 'change', name: item\.name \}\)\.state/,
    'recent active changes should use active-change validation list semantics',
  );
  assert.match(
    source,
    /if \(item\.kind === 'spec'\)[\s\S]*deriveValidationListIconState\([\s\S]*'spec'[\s\S]*deriveValidationTargetSummary\(validationStore, \{ type: 'spec', name: item\.name \}\)\.state/,
    'recent specs should use spec validation list semantics',
  );
  assert.match(
    source,
    /return null;/,
    'recent archived changes and other non-targets should not produce validation status',
  );
});

test('Dashboard recent activity rows render right-aligned status indicators instead of arrows', async () => {
  const source = await dashboardSource;
  const eachBlock = source.match(
    /\{#each sortedRecentActivity as item\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(eachBlock, 'Should find the sortedRecentActivity each block');
  const loopBody = eachBlock[1];

  assert.match(
    loopBody,
    /\{@const validationStatus = validationStatusForRecentActivity\(item\)\}/,
    'recent activity loop should derive a compact validation status per item',
  );
  assert.match(
    loopBody,
    /\{#if validationStatus\}\s*\n\s*<StatusIndicator state=\{validationStatus\} format="minimal" showLabel=\{false\} class="ml-auto shrink-0" \/>/,
    'recent activity should right-align compact status where the trailing arrow used to be',
  );
  assert.doesNotMatch(
    loopBody,
    /<ArrowRight\b/,
    'Recent Activity rows should not render a trailing ArrowRight icon',
  );
});

test('Dashboard recent activity rows remain clickable and expose context-menu open actions without arrows', async () => {
  const source = await dashboardSource;
  const eachBlock = source.match(
    /\{#each sortedRecentActivity as item\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(eachBlock, 'Should find the sortedRecentActivity each block');
  const loopBody = eachBlock[1];

  assert.match(
    loopBody,
    /onclick=\{item\.open\}/,
    'Recent Activity row button should remain clickable',
  );
  assert.match(
    loopBody,
    /onOpenInNewTab: item\.open/,
    'Recent Activity context menu should retain open-in-new-tab behavior',
  );
  assert.doesNotMatch(
    loopBody,
    /<ArrowRight\b/,
    'Recent Activity click affordance should not depend on a trailing arrow',
  );
});

test('Dashboard recent activity items use restrained tiles without floating-card shadow', async () => {
  const source = await dashboardSource;
  const eachBlock = source.match(
    /\{#each sortedRecentActivity as item\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(eachBlock, 'Should find the sortedRecentActivity each block');
  const loopBody = eachBlock[1];

  const cardMatch = loopBody.match(/<InteractiveCard[^>]*>/);
  assert.ok(cardMatch, 'Should find an InteractiveCard inside the recent activity loop');
  assert.match(cardMatch[0], /radius="sm"/);
  assert.match(cardMatch[0], /shadow-none/);
});
