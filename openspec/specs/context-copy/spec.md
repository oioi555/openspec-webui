# context-copy Specification

## Purpose
Provide right-click context menu operations (plain copy and quoted copy) on markdown content in ChangeViewer and SpecViewer.
## Requirements
### Requirement: Context menu on viewer markdown content
The system SHALL display a context menu when the operator right-clicks on the markdown content area in ChangeViewer or SpecViewer. The context menu SHALL use the project's existing ContextMenu component from `$lib/components/ui/context-menu/`. The context menu SHALL appear within the content area. The context menu position SHALL be clamped to the viewport.

#### Scenario: Right-click on ChangeViewer markdown content shows context menu
- **WHEN** the operator right-clicks anywhere on the markdown content area in ChangeViewer
- **THEN** a context menu appears at the cursor position
- **AND** the menu contains "Copy" and "Quote Copy" items

#### Scenario: Context menu appears for ChangeViewer spec delta content
- **WHEN** the operator right-clicks on a spec delta's markdown content in ChangeViewer
- **THEN** a context menu appears with the same items
- **AND** the quoted copy uses the spec delta capability name as context

#### Scenario: Right-click on SpecViewer markdown content shows context menu
- **WHEN** the operator right-clicks anywhere on the markdown content area in SpecViewer
- **THEN** a context menu appears at the cursor position
- **AND** the menu contains "Copy" and "Quote Copy" items

#### Scenario: Context menu appears for SpecViewer design tab
- **WHEN** the operator right-clicks on the Design tab markdown content in SpecViewer
- **THEN** a context menu appears with the same items
- **AND** the quoted copy uses "Design" as the context label

### Requirement: Plain text copy from context menu
The system SHALL provide a "Copy" item in the context menu. When selected, the system SHALL copy the currently selected text to the clipboard using `navigator.clipboard.writeText()`. If no text is selected, the item SHALL be disabled (greyed out, non-clickable). After a successful copy, the system SHALL show a toast notification confirming the action.

#### Scenario: Copy selected text via context menu
- **WHEN** the operator has text selected in the markdown content
- **AND** right-clicks and selects "Copy"
- **THEN** the selected text is copied to the clipboard
- **AND** a toast notification shows "Copied"

#### Scenario: Copy item disabled when no text selected
- **WHEN** no text is selected in the markdown content
- **AND** the operator right-clicks
- **THEN** the "Copy" menu item is disabled and cannot be clicked

### Requirement: Quoted copy from context menu
The system SHALL provide a "Quote Copy" item in the context menu. When selected with text selected, the system SHALL copy the selection to the clipboard in Markdown blockquote format with context information. The format SHALL be:
```
> [change-name] context-label
> selected text
```
Where `context-label` is: in ChangeViewer's file content tab the active file name, in ChangeViewer's spec deltas tab the spec delta capability name, in SpecViewer the active tab label ("Specification" or "Design"). Each line of the selected text SHALL be prefixed with `> `. If no text is selected, the item SHALL be disabled. After a successful copy, the system SHALL show a toast notification confirming the action.

#### Scenario: Quote copy with file context in ChangeViewer
- **WHEN** the operator has text selected in a file content tab in ChangeViewer
- **AND** right-clicks and selects "Quote Copy"
- **THEN** the clipboard contains the selected text in blockquote format with the change name and file name
- **AND** each line of the selected text is prefixed with `> `

#### Scenario: Quote copy with spec delta context in ChangeViewer
- **WHEN** the operator has text selected in a spec delta in ChangeViewer
- **AND** right-clicks and selects "Quote Copy"
- **THEN** the clipboard contains the selected text in blockquote format with the change name and the spec delta capability name
- **AND** each line of the selected text is prefixed with `> `

#### Scenario: Quote copy with spec context in SpecViewer
- **WHEN** the operator has text selected in the Specification tab in SpecViewer
- **AND** right-clicks and selects "Quote Copy"
- **THEN** the clipboard contains the selected text in blockquote format with the spec name and "Specification"
- **AND** each line of the selected text is prefixed with `> `

#### Scenario: Quote copy with design tab context in SpecViewer
- **WHEN** the operator has text selected in the Design tab in SpecViewer
- **AND** right-clicks and selects "Quote Copy"
- **THEN** the clipboard contains the selected text in blockquote format with the spec name and "Design"
- **AND** each line of the selected text is prefixed with `> `

#### Scenario: Quote copy item disabled when no text selected
- **WHEN** no text is selected in the markdown content
- **AND** the operator right-clicks
- **THEN** the "Quote Copy" menu item is disabled and cannot be clicked

#### Scenario: Multiline selection in quote copy
- **WHEN** the operator has multiple lines of text selected
- **AND** right-clicks and selects "Quote Copy"
- **THEN** each line of the selection is prefixed with `> `
- **AND** the first line includes the `> [change-name] context-label` header
