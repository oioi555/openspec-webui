## ADDED Requirements

### Requirement: Explorer section headers scroll into view on programmatic focus
The system SHALL scroll the focused explorer section header to the top of the explorer pane when the `focusedSection` state changes programmatically. This SHALL apply when focus is triggered by dashboard card clicks, dashboard summary card clicks, and activity bar preset selection. The scroll SHALL use smooth behavior and align the header to the top of the scroll area (`block: 'start'`). The scroll SHALL be deferred until after the section expansion DOM update completes.

#### Scenario: Dashboard card click scrolls section header into view
- **WHEN** the operator clicks a dashboard card that calls `focusSection()` for a specific section
- **THEN** the target explorer section expands (if collapsed)
- **AND** the section header scrolls smoothly to the top of the explorer pane

#### Scenario: Activity bar preset click scrolls section header into view
- **WHEN** the operator clicks an activity bar button that calls `setActivityPreset()`
- **THEN** the target explorer section expands (if collapsed)
- **AND** the section header scrolls smoothly to the top of the explorer pane

#### Scenario: Dashboard summary card scrolls section header into view
- **WHEN** the operator clicks a dashboard summary card that calls `setActivityPreset()`
- **THEN** the target explorer section expands (if collapsed)
- **AND** the section header scrolls smoothly to the top of the explorer pane

#### Scenario: Section already visible does not disrupt
- **WHEN** the focused section header is already at or near the top of the explorer pane
- **THEN** the scroll call is a no-op or produces minimal visual movement
- **AND** no layout shift or flicker occurs

#### Scenario: Direct user toggle still scrolls as before
- **WHEN** the operator clicks a section header directly in the explorer pane to expand it
- **THEN** the existing `scrollIntoView` behavior in the toggle handler continues to work
- **AND** the new reactive scroll does not produce a double-scroll
