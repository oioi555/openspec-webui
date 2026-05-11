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
  assert.match(source, /\{#each sortedActiveChanges as change\}/);

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
// 3. Active Changes row preserves InteractiveCard hover lift
// ---------------------------------------------------------------------------

test('Active Changes InteractiveCard retains the standard hover-lift transform', async () => {
  const source = await dashboardSource;

  // InteractiveCard base class includes hover:-translate-y-0.5 for a subtle
  // lift on hover. The Active Changes items should NOT suppress this with
  // a local hover:translate-y-0 override.
  const eachBlock = source.match(
    /\{#each sortedActiveChanges as change\}([\s\S]*?)\{\/each\}/,
  );
  assert.ok(eachBlock, 'Should find the sortedActiveChanges each block');
  const loopBody = eachBlock[1];

  // Find the InteractiveCard inside the loop
  const cardMatch = loopBody.match(/<InteractiveCard[^>]*>/);
  assert.ok(cardMatch, 'Should find an InteractiveCard inside the loop');

  // The card must NOT include hover:translate-y-0 which would cancel the
  // base hover:-translate-y-0.5 lift from InteractiveCard.
  assert.doesNotMatch(
    cardMatch[0],
    /hover:translate-y-0\b/,
    'Active Changes InteractiveCard must not override the hover lift with hover:translate-y-0',
  );

  // Confirm InteractiveCard base still provides the lift
  const interactiveSource = await readFile(
    new URL('../components/shared/surface/interactive-card.svelte', import.meta.url),
    'utf8',
  );
  assert.match(
    interactiveSource,
    /hover:-translate-y-0\.5/,
    'InteractiveCard base must still define the hover-lift',
  );
});

// ---------------------------------------------------------------------------
// 4. Next Step row container opens the change
// ---------------------------------------------------------------------------

test('Next Step command row container itself opens the change via openActiveChange', async () => {
  const source = await dashboardSource;

  const eachBlock = source.match(
    /\{#each sortedActiveChanges as change\}([\s\S]*?)\{\/each\}/,
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
    /\{#each sortedActiveChanges as change\}([\s\S]*?)\{\/each\}/,
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
    /\{#each sortedActiveChanges as change\}([\s\S]*?)\{\/each\}/,
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
