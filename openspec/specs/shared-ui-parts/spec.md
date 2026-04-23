# shared-ui-parts Specification

## Purpose
Define reusable shared UI primitives that standardize state presentation, command affordances, section headers, and tab navigation across the application.
## Requirements
### Requirement: ErrorBanner component
The system SHALL provide an `ErrorBanner` component in `$lib/components/ui/error-banner/` that renders a styled error container. The component SHALL accept an `error` message string prop and an optional `onRetry` callback prop. When `onRetry` is provided, the component SHALL render a retry button whose label is localized for the active locale.

#### Scenario: Render error message without retry
- **WHEN** an ErrorBanner is rendered with `error="Failed to load"`
- **THEN** it displays the error text in a bordered container with danger styling
- **AND** no retry button is shown

#### Scenario: Render error message with localized retry button
- **WHEN** an ErrorBanner is rendered with `error="Network error"` and `onRetry={handleRetry}`
- **THEN** it displays the error text in a bordered container
- **AND** a retry button with localized copy is shown
- **AND** clicking the retry button calls `onRetry`

### Requirement: LoadingState component
The system SHALL provide a `LoadingState` component in `$lib/components/ui/loading-state/` that renders a centered loading indicator with a configurable height. The loading label SHALL be localized for the active locale.

#### Scenario: Render default loading state
- **WHEN** a LoadingState is rendered without props
- **THEN** it displays a centered localized loading message with muted foreground color
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
- **WHEN** an IconBox is rendered with `size="md"` and `variant="info"` and `icon={FileText}`
- **THEN** it renders a rounded box with info background color containing the FileText icon

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
The system SHALL provide an `ExplorerSection` component in `$lib/components/shared/explorer-section/` that renders a collapsible section with header and content area. The component SHALL accept `title` (string), `count` (number), `open` (boolean), `focused` (boolean, optional), `onToggle` (callback), an optional `icon`, an optional `headerExtra` slot, `emptyMessage` (string, optional), `emptyIcon` (Component, optional), and a default slot for content. The header SHALL display the icon, title in uppercase tracking-wider text, a count badge, and a chevron icon indicating collapsed/expanded state. When `emptyMessage` is provided and the children snippet produces no content (i.e., the section is empty), the component SHALL render an `EmptyState` with the `emptyMessage` and optional `emptyIcon` instead of rendering the children.

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

#### Scenario: Render empty state when emptyMessage provided and no items
- **WHEN** an ExplorerSection is rendered with `emptyMessage="No active changes"`, `emptyIcon={SquarePen}`, and `open={true}` with no children rendered
- **THEN** the section body shows an EmptyState with the provided message and icon
- **AND** no children content area is rendered

#### Scenario: Render children when items exist even with emptyMessage
- **WHEN** an ExplorerSection is rendered with `emptyMessage="No active changes"` and children snippet produces content
- **THEN** the section body shows the children content
- **AND** no EmptyState is rendered

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

### Requirement: TaskProgress removed in favor of shadcn Progress
The system SHALL NOT provide a custom `TaskProgress` component. All call sites SHALL use the shared `<Progress>` component from `$lib/components/ui/progress/` directly, passing `value={progress.percentage}`. The `size` prop SHALL be handled via standard CSS classes (`h-2` for compact, default height otherwise).

#### Scenario: Progress bar renders with percentage
- **WHEN** a change's task progress is displayed
- **THEN** it uses `<Progress value={progress.percentage} />` from `$lib/components/ui/progress/`
- **AND** no custom `TaskProgress` component exists in `frontend/src/components/`

#### Scenario: Compact progress bar in ExplorerPane
- **WHEN** the ExplorerPane renders a change's progress
- **THEN** it uses `<Progress value={progress.percentage} class="h-2" />` for a compact variant

### Requirement: ItemContextMenu shared component
The system SHALL provide an `ItemContextMenu` component in `$lib/components/ui/item-context-menu/` as part of the shared UI parts. The component SHALL be importable via `$lib/components/ui/item-context-menu`.

#### Scenario: Import ItemContextMenu
- **WHEN** a component imports from `$lib/components/ui/item-context-menu`
- **THEN** the `ItemContextMenu` component is available for use

### Requirement: Shared item context menu definitions
The system SHALL provide a shared helper in `$lib/itemContextMenu.ts` that builds consistent menu item definitions for `active-change`, `archived-change`, and `spec` items from their kind and required callbacks.

#### Scenario: Build change context menu items
- **WHEN** a consumer builds menu items for an `active-change` or `archived-change` with a name and an open callback
- **THEN** the resulting menu contains `Open in New Tab` and `Copy Name`

#### Scenario: Build spec context menu items
- **WHEN** a consumer builds menu items for a `spec` with a name, an open callback, and a search callback
- **THEN** the resulting menu contains `Open in New Tab`, `Copy Name`, and `Search Related Changes`

### Requirement: Clipboard copy utility
The system SHALL provide a `copyToClipboard` function in `$lib/utils.ts` (or equivalent shared utility module) that accepts a text string and a label, copies the text to the system clipboard, and shows a success or error toast notification whose feedback copy is localized for the active locale.

#### Scenario: Copy text to clipboard successfully
- **WHEN** `copyToClipboard("my-change", "Change name")` is called
- **THEN** the text "my-change" is written to the system clipboard
- **AND** a localized success toast is shown using the provided label

#### Scenario: Copy fails gracefully
- **WHEN** the clipboard API fails
- **THEN** a localized error toast is shown

### Requirement: Card surface primitives
The system SHALL provide reusable Card surface primitives in `$lib/components/ui/card/` for standard container, header, title, description, content, and footer layouts. Feature surfaces that use the shared Card pattern SHALL compose these primitives directly or through thin shared wrappers instead of duplicating feature-local card container markup.

#### Scenario: Import Card primitives from shared UI
- **WHEN** a feature component imports from `$lib/components/ui/card/`
- **THEN** `Root`, `Header`, `Title`, `Description`, `Content`, and `Footer` are available
- **AND** they can be composed into a bordered card surface with shared card styling

#### Scenario: Shared wrapper builds on Card primitives
- **WHEN** a reusable feature-neutral card wrapper is added under `$lib/components/shared/`
- **THEN** it composes the shared Card primitives or their class pattern
- **AND** it does not reintroduce a separate feature-local card foundation
