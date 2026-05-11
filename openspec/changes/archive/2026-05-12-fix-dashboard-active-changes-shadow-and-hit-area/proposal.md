# Bugfix: Fix dashboard Active Changes shadow and hit area

## Bug Description

The Dashboard Active Changes section currently has two UI regressions:

- the section card uses a stronger shadow than peer dashboard panels, so it looks visually inconsistent
- the lower portion of an Active Changes item does not feel reliably clickable even though it appears to belong to the main open-change summary area

## Steps to Reproduce

1. Open the Dashboard with one or more active changes.
2. Compare the Active Changes panel elevation with neighboring dashboard panels such as Recent Activity.
3. Click an Active Changes item near its lower metadata/progress line or at the seam above the `Next Step` command row.
4. Observe that this lower area can feel non-responsive as a primary open-change target.

## Expected Behavior

- The Dashboard Active Changes panel should use the same shared shadow language as peer dashboard section panels unless a stronger emphasis is intentionally specified.
- The primary summary region of each Active Changes item should behave as one reliable click target, including the lower metadata/progress line.
- The `Next Step` command row should remain visually separated and should still not trigger change navigation when its command chips are activated.

## Root Cause

- `frontend/src/lib/views/Dashboard.svelte` renders the Active Changes section with a stronger `SurfaceCard` shadow than other dashboard section panels.
- Each Active Changes row is composed from an `InteractiveCard` with hover translation plus a primary `<button>` region and a separate command row. That composition creates a lower-edge seam that appears to belong to the main row while not consistently behaving like the main open-change target.

## Proposed Fix

- Align the Dashboard Active Changes section with the shared dashboard panel shadow treatment.
- Adjust the Active Changes row interaction structure so the full summary area above the command row remains a stable, reliable click target.
- Preserve command-row separation, command-chip behavior, sorting behavior, and existing change-opening behavior everywhere else.
