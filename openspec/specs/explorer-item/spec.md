# explorer-item Specification

## Purpose
Define the ExplorerItem component that wraps a list item with context menu support, click handling, and selection state styling for the Explorer Pane.

## Requirements

### Requirement: ExplorerItem component
The system SHALL provide an `ExplorerSectionItem` component in `$lib/components/shared/explorer-section/explorer-section-item.svelte` that wraps a list item with context menu support, click handling, and selection styling. The component SHALL determine its active state by comparing `path` with the active tab in `tabStore`, and SHALL generate context menu items internally via `createItemContextMenuItems` from `kind` and `name` rather than accepting them as a prop.

#### Scenario: Component props
- **WHEN** a consumer renders an `ExplorerSectionItem`
- **THEN** it can pass `path` (string for tab path identification), `section` (ExplorerSection for layout focus), `kind` (ItemContextMenuKind for context menu generation), and `name` (string for display and menu)
- **AND** it can pass optional `date` (string) and `specDeltaCount` (number) for metadata display, `taskProgress` (object with done/total/percentage for metadata display), and `showProgress` (boolean to render a progress bar)
- **AND** it can pass optional `displayName` (string to override name display), `class` (string for additional styling), `onItemSelected` (callback), and a `children` snippet for additional content
- **AND** context menu items are not accepted as a prop

#### Scenario: Render item with context menu
- **WHEN** an ExplorerSectionItem is rendered with `kind="spec"` and `name="my-spec"`
- **THEN** right-clicking the item opens a context menu showing spec-appropriate items (Open in New Tab, Search Related Changes)
- **AND** left-clicking the item triggers the internal click handler

#### Scenario: Active item styling
- **WHEN** an ExplorerSectionItem is rendered with `path="/changes/my-change"` and that path matches the active tab
- **THEN** the item shows active background styling (`bg-primary/10 text-foreground`)

#### Scenario: Inactive item styling
- **WHEN** an ExplorerSectionItem is rendered with `path="/changes/my-change"` and that path does NOT match the active tab
- **THEN** the item shows inactive styling (`text-muted-foreground hover:bg-secondary/70 hover:text-foreground`)

#### Scenario: Click opens preview tab
- **WHEN** the operator clicks an ExplorerSectionItem and preview tabs are enabled
- **THEN** a preview tab is opened for the item's path via `tabStore.openPreview`
- **AND** the corresponding section is focused in the layout store

#### Scenario: Click opens confirmed tab
- **WHEN** the operator clicks an ExplorerSectionItem and preview tabs are disabled OR Ctrl is held
- **THEN** a confirmed tab is opened for the item's path via `tabStore.openConfirmed`
- **AND** the corresponding section is focused in the layout store

### Requirement: ExplorerSectionItem uses ItemContextMenu internally
The ExplorerSectionItem component SHALL use the existing `ItemContextMenu` component from `$lib/components/shared/item-context-menu/` to render the context menu. The ExplorerSectionItem SHALL NOT directly use `ContextMenu.Root`.

#### Scenario: ExplorerSectionItem delegates to ItemContextMenu
- **WHEN** ExplorerSectionItem source code is inspected
- **THEN** it imports and uses `ItemContextMenu` from `$lib/components/shared/item-context-menu`
- **AND** it passes internally generated `menuItems` as the `items` prop to ItemContextMenu

### Requirement: ExplorerSectionItem root element is a semantic element
The ExplorerSectionItem component SHALL render its trigger element as a `<button>` element for accessibility. The button SHALL have `type="button"` and appropriate text styling.

#### Scenario: ExplorerSectionItem renders as button
- **WHEN** an ExplorerSectionItem is rendered
- **THEN** the outer clickable element is a `<button type="button">`
- **AND** the button contains the children snippet content
