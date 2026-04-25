## MODIFIED Requirements

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
The system SHALL provide a "Quote Copy" item in the context menu. When selected with text selected, the system SHALL copy the selection to the clipboard in Markdown blockquote format with context information. The format SHALL be:
```
> [change-name] context-label
> selected text
```
Where `context-label` is: in ChangeViewer's file content tab the active file name, in ChangeViewer's spec deltas tab the spec delta capability name, and in SpecViewer the label `Specification`. Each line of the selected text SHALL be prefixed with `> `. If no text is selected, the item SHALL be disabled. The selection scope SHALL be the current `window.getSelection()`, which may include text outside the viewer content area. After a successful copy, the system SHALL show a toast notification confirming the action.

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

#### Scenario: Quote copy item disabled when no text selected
- **WHEN** no text is selected in the window
- **AND** the operator right-clicks
- **THEN** the "Quote Copy" menu item is disabled and cannot be clicked

#### Scenario: Multiline selection in quote copy
- **WHEN** the operator has multiple lines of text selected
- **AND** right-clicks and selects "Quote Copy"
- **THEN** each line of the selection is prefixed with `> `
- **AND** the first line includes the `> [change-name] context-label` header
