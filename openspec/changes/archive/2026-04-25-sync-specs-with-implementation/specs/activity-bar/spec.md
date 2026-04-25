## MODIFIED Requirements

### Requirement: Activity Bar renders persistent vertical control strip
The system SHALL render a vertical Activity Bar as the leftmost pane of the application layout, fixed at 48px width. The Activity Bar SHALL remain visible even when the Explorer Pane is collapsed. When an active project exists, the bottom area SHALL provide an Explorer open/close control rather than a current-project avatar tile. The bar SHALL display icon buttons in this order: Dashboard, Archive, Specs, a visual separator, and Search. The Dashboard control SHALL keep using the LayoutDashboard icon as the visual symbol for the primary landing surface. Each navigation icon SHALL use the `@lucide/svelte` library. When no active project exists, the bottom area SHALL fall back to the shared `app-icon.svg` and SHALL open project selection. The `decodeName` utility function used in the Activity Bar SHALL be imported from `$lib/utils` instead of being defined locally.

#### Scenario: Activity Bar renders on page load with explorer toggle
- **WHEN** the application loads with an active project
- **THEN** a vertical Activity Bar is displayed at the leftmost edge
- **AND** it contains an Explorer open/close control at the bottom
- **AND** it contains icon buttons for Dashboard, Archive, Specs, Search, and Settings
- **AND** each navigation icon renders at 20px size using `@lucide/svelte`

#### Scenario: Activity Bar renders no-project fallback icon
- **WHEN** the application loads without an active project
- **THEN** the bottom control renders the shared `app-icon.svg`
- **AND** activating the control still opens project selection

#### Scenario: Activity Bar has fixed width
- **WHEN** the application layout renders
- **THEN** the Activity Bar occupies exactly 48px width
- **AND** it does not resize with the window

#### Scenario: Activity Bar remains when Explorer Pane collapses
- **WHEN** the operator collapses the Explorer Pane
- **THEN** the Activity Bar remains visible at the left edge
- **AND** the Explorer toggle remains visible at the bottom
- **AND** all Activity Bar controls stay interactive

#### Scenario: Explorer toggle is visually separated from navigation icons
- **WHEN** the Activity Bar renders with an active project
- **THEN** the bottom Explorer control is grouped in the bottom area via `mt-auto`
- **AND** a horizontal rule separator appears between the Specs and Search navigation icons

#### Scenario: decodeName imported from shared utils
- **WHEN** the ActivityBar component needs to decode a URI component
- **THEN** it imports `decodeName` from `$lib/utils`
- **AND** no local `decodeName` function is defined in ActivityBar.svelte
