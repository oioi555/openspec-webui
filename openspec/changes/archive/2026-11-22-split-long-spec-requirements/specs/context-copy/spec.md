## MODIFIED Requirements

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
