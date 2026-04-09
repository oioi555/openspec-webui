# shared-ui-parts Specification

## Purpose
Define reusable shared UI primitives that standardize state presentation, command affordances, section headers, and tab navigation across the application.

## Requirements
### Requirement: ErrorBanner component
The system SHALL provide an `ErrorBanner` component in `$lib/components/ui/error-banner/` that renders a styled error container. The component SHALL accept an `error` message string prop and an optional `onRetry` callback prop. When `onRetry` is provided, the component SHALL render a "Retry" button.

#### Scenario: Render error message without retry
- **WHEN** an ErrorBanner is rendered with `error="Failed to load"`
- **THEN** it displays the error text in a bordered container with danger styling
- **AND** no retry button is shown

#### Scenario: Render error message with retry button
- **WHEN** an ErrorBanner is rendered with `error="Network error"` and `onRetry={handleRetry}`
- **THEN** it displays the error text in a bordered container
- **AND** a "Retry" button is shown that calls `onRetry` when clicked

### Requirement: LoadingState component
The system SHALL provide a `LoadingState` component in `$lib/components/ui/loading-state/` that renders a centered loading indicator with a configurable height.

#### Scenario: Render default loading state
- **WHEN** a LoadingState is rendered without props
- **THEN** it displays a centered "Loading..." message with muted foreground color
- **AND** the container height defaults to `h-64`

#### Scenario: Render loading state with custom height
- **WHEN** a LoadingState is rendered with `height="h-48"`
- **THEN** the container uses the specified height class

### Requirement: EmptyState component
The system SHALL provide an `EmptyState` component in `$lib/components/ui/empty-state/` that renders a centered empty placeholder message with an optional icon.

#### Scenario: Render empty state message
- **WHEN** an EmptyState is rendered with `message="No active changes"`
- **THEN** it displays the message centered with muted foreground color

#### Scenario: Render empty state with icon
- **WHEN** an EmptyState is rendered with `message="No specs found"` and `icon={FileText}`
- **THEN** it displays the icon above the message

### Requirement: IconBox component
The system SHALL provide an `IconBox` component in `$lib/components/ui/icon-box/` that renders a colored icon inside a rounded background box. The component SHALL accept `size` (`"sm"` | `"md"` | `"lg"`), `variant` (`"info"` | `"success"` | `"muted"` | `"warning"` | `"danger"`), and `icon` (Svelte component) props.

#### Scenario: Render info icon box
- **WHEN** an IconBox is rendered with `size="md"` and `variant="info"` and `icon={SquarePen}`
- **THEN** it renders a rounded box with info background color containing the SquarePen icon

#### Scenario: Render small success icon box
- **WHEN** an IconBox is rendered with `size="sm"` and `variant="success"` and `icon={FileText}`
- **THEN** it renders a small rounded box with success background color

### Requirement: Callout component
The system SHALL provide a `Callout` component in `$lib/components/ui/callout/` that renders a styled callout box. The component SHALL accept `variant` (`"info"` | `"warning"` | `"error"`) and render children as content.

#### Scenario: Render info callout
- **WHEN** a Callout is rendered with `variant="info"`
- **THEN** it renders a bordered container with info background and text colors

#### Scenario: Render warning callout
- **WHEN** a Callout is rendered with `variant="warning"`
- **THEN** it renders a bordered container with warning background and text colors

### Requirement: DialogHeader component
The system SHALL provide a `DialogHeader` component in `$lib/components/ui/dialog-header/` that renders a panel header with optional icon, title, description, and close button. The component SHALL accept `icon`, `title`, `description`, and `onClose` props.

#### Scenario: Render dialog header with all props
- **WHEN** a DialogHeader is rendered with `icon={Settings}`, `title="Settings"`, and `onClose={closeFn}`
- **THEN** it renders the icon, title text, and a close (X) button that calls `onClose`

#### Scenario: Render dialog header without icon
- **WHEN** a DialogHeader is rendered with only `title="Search"` and `onClose={closeFn}`
- **THEN** it renders the title and close button without an icon

### Requirement: ExplorerSection component
The system SHALL provide an `ExplorerSection` component in `$lib/components/ui/explorer-section/` that renders a collapsible section with header and content area. The component SHALL accept `title` (string), `count` (number), `open` (boolean), `focused` (boolean, optional), `onToggle` (callback), an optional `icon`, an optional `headerExtra` slot, and a default slot for content. The header SHALL display the icon, title in uppercase tracking-wider text, a count badge, and a chevron icon indicating collapsed/expanded state.

#### Scenario: Render expanded section
- **WHEN** an ExplorerSection is rendered with `title="ACTIVE CHANGES"`, `count={3}`, and `open={true}`
- **THEN** the section header shows the icon, title, count badge with "3", and a down chevron
- **AND** the content area is visible

#### Scenario: Render collapsed section
- **WHEN** an ExplorerSection is rendered with `title="ARCHIVE"`, `count={5}`, and `open={false}`
- **THEN** the section header shows the title, count badge with "5", and a right chevron
- **AND** the content area is hidden

#### Scenario: Toggle section
- **WHEN** the operator clicks the section header
- **THEN** `onToggle` is called

#### Scenario: Render header extra content
- **WHEN** an ExplorerSection is rendered with `headerExtra` content
- **THEN** the extra content appears beneath the main header row and above the collapsible content area

#### Scenario: Render focused section styling
- **WHEN** an ExplorerSection is rendered with `focused={true}`
- **THEN** the section container shows the current focused-section ring styling

### Requirement: CommandChip component
The system SHALL provide a `CommandChip` component in `$lib/components/ui/command-chip/` that renders a compact, emphasized command shortcut control. The component SHALL accept `label` (string), optional `title` (string), and optional `icon` (Svelte component) props, and SHALL forward standard button attributes and click handling. The component SHALL be visually distinct from standard Button variants by using a compact pill-style shape and command-emphasis styling.

#### Scenario: Render command chip with icon
- **WHEN** a CommandChip is rendered with `label="propose"` and `icon={Clipboard}`
- **THEN** it renders a compact pill-style control with the icon and label

#### Scenario: Render emphasized compact styling
- **WHEN** a CommandChip is rendered next to a standard action button
- **THEN** it uses a smaller visual height and denser spacing than the standard button
- **AND** it keeps command-emphasis colors instead of inheriting the default Button look

### Requirement: UnderlineTabs component
The system SHALL provide an `UnderlineTabs` component in `$lib/components/ui/underline-tabs/` that renders an underline-style tab navigation. The component SHALL accept `tabs` (array of `{ id, label, badge? }`), `activeId` (string), and `onSelect` (callback) props. The active tab SHALL show a primary-colored bottom border; inactive tabs SHALL show a transparent border that becomes visible on hover.

#### Scenario: Render tabs with active state
- **WHEN** UnderlineTabs is rendered with `tabs=[{id:"spec",label:"Specification"},{id:"design",label:"Design"}]` and `activeId="spec"`
- **THEN** the "Specification" tab shows a primary bottom border
- **AND** the "Design" tab shows a transparent bottom border

#### Scenario: Switch active tab
- **WHEN** the operator clicks the "Design" tab
- **THEN** `onSelect` is called with `"design"`

#### Scenario: Render tab badge counts
- **WHEN** UnderlineTabs is rendered with `tabs=[{id:"files",label:"Files",badge:3}]`
- **THEN** the "Files" tab renders the badge count inline next to the label without requiring feature-specific badge markup
