# context-copy Specification

## Purpose
Provide right-click context menu operations (plain copy and quoted copy) on markdown content in ChangeViewer and SpecViewer.

## Requirements

### Requirement: Context menu on viewer markdown content
The system SHALL display a context menu when the operator right-clicks on the markdown content area in ChangeViewer or SpecViewer. The context menu SHALL use the project's existing ContextMenu component from `$lib/components/ui/context-menu/`. The context menu SHALL appear within the content area. The context menu position SHALL be clamped to the viewport.

#### Scenario: Right-click on ChangeViewer markdown content shows viewer text actions
- **WHEN** the operator right-clicks anywhere on the markdown content area in ChangeViewer
- **THEN** a context menu appears at the cursor position
- **AND** the menu contains `Copy`, `Quote Copy`, and `Search` items

#### Scenario: Context menu appears for ChangeViewer spec delta content
- **WHEN** the operator right-clicks on a spec delta's markdown content in ChangeViewer
- **THEN** a context menu appears with the same items
- **AND** the quoted copy uses the spec delta capability name as context

#### Scenario: Right-click on SpecViewer markdown content shows viewer text actions
- **WHEN** the operator right-clicks anywhere on the markdown content area in SpecViewer
- **THEN** a context menu appears at the cursor position
- **AND** the menu contains `Copy`, `Quote Copy`, and `Search` items

### Requirement: Search from viewer selection context menu
The system SHALL provide a `Search` item in the viewer markdown context menu. The item SHALL use the current `window.getSelection()` text as its source selection, but SHALL only be enabled when the trimmed selection is a valid search keyword. A valid search keyword SHALL be 2 to 80 characters long after trimming outer whitespace and SHALL NOT contain newline, carriage-return, or tab characters. When the selection is invalid, the `Search` item SHALL be disabled and cannot be clicked.

#### Scenario: Enable Search for a valid ChangeViewer selection
- **WHEN** the operator selects a single-line phrase in ChangeViewer whose trimmed length is between 2 and 80 characters and contains no tab characters
- **AND** right-clicks inside the markdown content area
- **THEN** the `Search` item is enabled

#### Scenario: Enable Search for a valid ChangeViewer spec delta selection
- **WHEN** the operator selects a single-line phrase inside ChangeViewer spec delta content whose trimmed length is between 2 and 80 characters and contains no tab characters
- **AND** right-clicks inside that markdown content area
- **THEN** the `Search` item is enabled

#### Scenario: Enable Search for a valid SpecViewer selection
- **WHEN** the operator selects a single-line phrase in SpecViewer whose trimmed length is between 2 and 80 characters and contains no tab characters
- **AND** right-clicks inside the markdown content area
- **THEN** the `Search` item is enabled

#### Scenario: Disable Search for multiline or tabbed selection
- **WHEN** the current viewer selection contains a newline, carriage return, or tab character
- **AND** the operator right-clicks inside the markdown content area
- **THEN** the `Search` item is disabled and cannot be clicked

#### Scenario: Disable Search for too-short or too-long selection
- **WHEN** the trimmed viewer selection is shorter than 2 characters or longer than 80 characters
- **AND** the operator right-clicks inside the markdown content area
- **THEN** the `Search` item is disabled and cannot be clicked

### Requirement: Plain text copy from context menu
The system SHALL provide a "Copy" item in the context menu. When selected, the system SHALL copy the currently selected text to the clipboard using `navigator.clipboard.writeText()`. If no text is selected, the item SHALL be disabled (greyed out, non-clickable). The selection scope SHALL be the current `window.getSelection()`, which may include text outside the viewer content area. After a successful copy, the system SHALL show a toast notification confirming the action.

#### Scenario: Copy selected text via context menu
- **WHEN** the operator has text selected in the window
- **AND** right-clicks on the markdown content and selects "Copy"
- **THEN** the selected text is copied to the clipboard
- **AND** a toast notification shows "Text copied"

#### Scenario: Copy item disabled when no text selected
- **WHEN** no text is selected in the window
- **AND** the operator right-clicks
- **THEN** the "Copy" menu item is disabled and cannot be clicked

### Requirement: Quoted copy from context menu
The system SHALL provide a "Quote Copy" context menu item. With text selected, it SHALL copy the current `window.getSelection()` to the clipboard as a Markdown blockquote: a `> [change-name] context-label` header line, then each selected line prefixed with `> `. The context label SHALL identify the viewed file, spec delta, or specification. The item SHALL be disabled when no text is selected, and a successful copy SHALL show a confirming toast notification.

#### Scenario: Quote copy with file context in ChangeViewer
- **WHEN** the operator has text selected in a file content tab in ChangeViewer
- **AND** right-clicks and selects "Quote Copy"
- **THEN** the clipboard contains the selected text in blockquote format with the change name and the active file name as context label
- **AND** each line of the selected text is prefixed with `> `

#### Scenario: Quote copy with spec delta context in ChangeViewer
- **WHEN** the operator has text selected in a spec delta in ChangeViewer
- **AND** right-clicks and selects "Quote Copy"
- **THEN** the clipboard contains the selected text in blockquote format with the change name and the spec delta capability name
- **AND** each line of the selected text is prefixed with `> `

#### Scenario: Quote copy with spec context in SpecViewer
- **WHEN** the operator has text selected in the Specification tab in SpecViewer
- **AND** right-clicks and selects "Quote Copy"
- **THEN** the clipboard contains the selected text in blockquote format with the spec name and the label `Specification`
- **AND** each line of the selected text is prefixed with `> `

#### Scenario: Quote copy item disabled when no text selected
- **WHEN** no text is selected in the window
- **AND** the operator right-clicks
- **THEN** the "Quote Copy" menu item is disabled and cannot be clicked

#### Scenario: Multiline selection in quote copy
- **WHEN** the operator has multiple lines of text selected
- **AND** right-clicks and selects "Quote Copy"
- **THEN** each line of the selection is prefixed with `> `
- **AND** the first line includes the `> [change-name] context-label` header
- **AND** the clipboard text has the form `> [change-name] context-label` followed by `> selected text` lines

#### Scenario: Quote copy uses the whole window selection
- **WHEN** the current `window.getSelection()` includes text outside the viewer content area
- **AND** the operator selects "Quote Copy"
- **THEN** the copied blockquote covers the whole window selection

#### Scenario: Quote copy confirms with a toast
- **WHEN** a "Quote Copy" action copies text successfully
- **THEN** the system shows a toast notification confirming the action
