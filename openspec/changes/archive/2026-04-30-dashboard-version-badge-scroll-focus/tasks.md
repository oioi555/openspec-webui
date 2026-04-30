## 1. Version Badge Component

- [x] 1.1 Create a `VersionBadge.svelte` component that reads from `versionStatusStore.snapshot` and renders a shadcn `Badge` with conditional variant (outline when up-to-date, warning when updates available)
- [x] 1.2 Add click handler to `VersionBadge` that opens the Settings modal directly to the Versions page
- [x] 1.3 Handle the loading state—hide the badge (or show skeleton) when snapshot is null

## 2. Integrate Badge into Dashboard Header

- [x] 2.1 Import and place `VersionBadge` in `Dashboard.svelte` header, positioned to the right of the FolderPen button in the top-right area

## 3. Scroll-into-View on Programmatic Focus

- [x] 3.1 Add a reactive `$effect` in `explorer-section.svelte` that watches `layoutStore.focusedSection` and, when it matches the section's `section` prop, calls `headerRef?.scrollIntoView({ behavior: 'smooth', block: 'start' })` via `requestAnimationFrame`
- [x] 3.2 Ensure the reactive scroll does not double-fire when the existing `handleToggle` scroll already handled the same section expansion (e.g., guard with a timestamp or skip if the trigger was a direct toggle)

## 4. Verification

- [x] 4.1 Verify version badge appears on dashboard with correct variant for both up-to-date and update-available states
- [x] 4.2 Verify clicking badge opens Settings → Versions
- [x] 4.3 Verify dashboard card clicks scroll the target section header into view
- [x] 4.4 Verify activity bar clicks scroll the target section header into view
- [x] 4.5 Verify direct section header toggle still scrolls without double-scroll
