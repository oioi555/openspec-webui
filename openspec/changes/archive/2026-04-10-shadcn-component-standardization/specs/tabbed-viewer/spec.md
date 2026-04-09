## MODIFIED Requirements

### Requirement: Tab management system
The system SHALL provide a tab management store that maintains an ordered list of open tabs. Each tab SHALL have a unique ID, type (spec, change, or dashboard), display name, URL path, and optional pinned state. The store SHALL support operations: open tab, close tab, focus tab, reorder tabs, and pin/unpin tab. The ChangeViewer and SpecViewer SHALL use the `UnderlineTabs` component from `$lib/components/ui/underline-tabs/` for their internal sub-tab navigation instead of inline underline tab implementations. The `UnderlineTabs` API SHALL support optional badge counts so ChangeViewer can render file group counts and spec delta counts without feature-specific badge markup.

#### Scenario: SpecViewer uses UnderlineTabs component
- **WHEN** the operator views a spec that has both `spec.md` and `design.md`
- **THEN** the sub-tab navigation is rendered using the `UnderlineTabs` component
- **AND** switching between Specification and Design tabs works correctly

#### Scenario: ChangeViewer uses UnderlineTabs component with badge counts
- **WHEN** the operator views a change detail with file groups and spec deltas
- **THEN** the primary tab navigation is rendered using the `UnderlineTabs` component
- **AND** file group counts and spec delta counts are passed via the `badge` field instead of inline badge spans in `ChangeViewer.svelte`

#### Scenario: No inline underline tab classes remain in feature components
- **WHEN** `SpecViewer.svelte` or `ChangeViewer.svelte` is inspected
- **THEN** no feature-local underline tab button markup remains for those primary tab navigations
