## MODIFIED Requirements

### Requirement: Provide dashboard and primary navigation context
The web UI SHALL provide an Obsidian-like three-pane layout with Activity Bar, Explorer Pane, and Main Viewer. The Dashboard page SHALL be accessible as a pinned `Dashboard` tab in the Main Viewer. The Activity Bar's top area SHALL show the shared application icon and current project control, and SHALL open the project selector without leaving the current tab. When the Explorer Pane is visible, it SHALL show the current project name in its header. Navigation highlighting SHALL be managed by the Activity Bar's active section indicator. The Dashboard SHALL render a workspace summary region with four metric cards ordered as Active Changes, Archive, Specs, and Tasks. The Specs summary card SHALL use the `FileText` icon so spec-related surfaces share a consistent visual cue. Selecting the Active Changes, Archive, or Specs cards SHALL focus the matching Explorer Pane section and reveal it when hidden without opening a standalone list page in the Main Viewer. Selecting the Tasks card SHALL focus the Dashboard / ACTIVE CHANGES context. The Dashboard SHALL render Active Changes with inline workspace command shortcuts in the section header (the count is already shown in the summary cards above, so a separate badge is omitted for consistency with Recent Activity), SHALL render Recent Activity as a full-width section beneath Active Changes when timestamp data is available, SHALL render the Recent Activity section header with a `History` icon to indicate chronological updates, SHALL render recent activity entries as dense cards rather than sparse full-width list rows, SHALL use recent-activity icon treatments that align with the summary cards for each content type (active change/info, archive/muted, spec/success), SHALL NOT render separate Quick Actions or Next Step panels, SHALL provide an actionable empty state when no active changes exist, and SHALL render project documentation when available. Activating the Project Documentation `Focus section` control SHALL scroll to the documentation section without changing Explorer Pane visibility. The Dashboard SHALL align with the Explorer Pane's ACTIVE CHANGES section as the `Dashboard` surface.

#### Scenario: Render the Dashboard tab
- **WHEN** the operator clicks the Dashboard icon in the Activity Bar
- **THEN** the Dashboard tab is focused in the Main Viewer
- **AND** the Dashboard shows summary cards in the order Active Changes, Archive, Specs, and Tasks
- **AND** the Dashboard shows the Active Changes section with inline command shortcuts
- **AND** the Dashboard shows Recent Activity in the main dashboard flow beneath Active Changes when recent items exist
- **AND** the Dashboard renders project documentation when available

#### Scenario: Summary cards focus Explorer sections
- **WHEN** the operator activates the Archive or Specs summary card on Dashboard
- **THEN** the matching Explorer Pane section is expanded and focused
- **AND** the Main Viewer remains on the Dashboard tab instead of opening a standalone list page

#### Scenario: Open project selector from the Activity Bar
- **WHEN** the operator clicks the current project control in the Activity Bar
- **THEN** the project selector opens
- **AND** the currently focused tab remains focused until the operator picks another project

#### Scenario: Show an actionable empty active changes state
- **WHEN** the workspace has no active changes
- **THEN** the Dashboard shows `No active changes yet`
- **AND** the empty state presents call-to-action controls for starting a change or browsing existing workspace content

#### Scenario: Browse recent dashboard activity
- **WHEN** at least one change or spec exposes a timestamp for recent activity
- **THEN** the Dashboard shows recent activity entries ordered from newest to oldest
- **AND** selecting an entry opens the corresponding tab and focuses the related Explorer section

#### Scenario: Dashboard links to active changes browsing
- **WHEN** the operator clicks the Dashboard icon in the Activity Bar
- **THEN** the Explorer Pane expands the ACTIVE CHANGES section
- **AND** the Dashboard and Explorer together represent the `Dashboard` surface

#### Scenario: Navigation highlights active section via Activity Bar
- **WHEN** the operator is viewing a spec
- **THEN** the Specs icon in the Activity Bar is highlighted
- **WHEN** the operator is viewing an archived change
- **THEN** the Changes icon in the Activity Bar is highlighted
- **WHEN** the operator is viewing an active change
- **THEN** the Dashboard icon in the Activity Bar is highlighted
- **WHEN** the operator is viewing the Dashboard
- **THEN** the Dashboard icon in the Activity Bar is highlighted
