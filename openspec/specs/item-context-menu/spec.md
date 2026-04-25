# item-context-menu Specification

## Purpose
Define the ItemContextMenu component that wraps trigger elements with a configurable context menu for explorer and other list items.

## Requirements
### Requirement: ItemContextMenu component
The system SHALL provide an `ItemContextMenu` component in `$lib/components/shared/item-context-menu/` that wraps a trigger element with a context menu. The component SHALL accept an `items` prop (array of `{ label: string; icon?: Component; onSelect: () => void }`) and render the trigger element via the children snippet. Each menu item SHALL render the optional icon followed by the label text.

#### Scenario: Render context menu with items
- **WHEN** an ItemContextMenu is rendered with `items=[{label:"Open",icon:FileText,onSelect:fn},{label:"Copy",icon:Clipboard,onSelect:fn}]` and a button as children
- **THEN** right-clicking the button opens a context menu showing "Open" and "Copy" items with their icons

#### Scenario: Menu item triggers callback
- **WHEN** the operator selects a menu item
- **THEN** the item's `onSelect` callback is invoked
- **AND** the context menu closes

#### Scenario: Render without icons
- **WHEN** an ItemContextMenu is rendered with items that have no `icon` property
- **THEN** the menu items render with label text only, without icon spacing
