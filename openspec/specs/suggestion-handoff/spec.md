# suggestion-handoff Specification

## Purpose
TBD - created by archiving change capture-baseline-specs. Update Purpose after archive.
## Requirements
### Requirement: Enable suggestion mode for active changes
The system SHALL allow suggestion mode on non-archived change detail views opened in tabs. When suggestion mode is active, the Suggestion Panel SHALL appear as a collapsible right sidebar adjacent to the Main Viewer. The system SHALL not expose suggestion mode controls for archived changes.

#### Scenario: Enter suggestion mode on an active change tab
- **WHEN** the operator opens an active change in a tab and toggles suggestion mode on
- **THEN** the right sidebar appears showing the suggestion panel
- **AND** the rendered markdown in the tab becomes block-selectable

#### Scenario: Hide suggestion mode for archived changes
- **WHEN** the operator opens an archived change
- **THEN** the UI does not show a suggestion mode toggle
- **AND** the right sidebar does not appear

### Requirement: Persist and manage suggestions per change in the browser
The system SHALL store suggestions per change in browser localStorage, SHALL reload saved suggestions when the operator re-enters suggestion mode for the same change, and SHALL support updating and removing saved suggestions.

#### Scenario: Restore saved suggestions for a change
- **WHEN** the operator exits suggestion mode and later re-enters it for the same change in the same browser
- **THEN** the system reloads the saved suggestions for that change from localStorage

#### Scenario: Edit an existing suggestion from the panel
- **WHEN** the operator chooses to edit a saved suggestion from the side panel
- **THEN** the system scrolls the related markdown block into view
- **AND** reopens the suggestion editor for that block

#### Scenario: Remove a saved suggestion
- **WHEN** the operator removes a suggestion from the side panel
- **THEN** the system deletes it from the in-memory list
- **AND** updates the persisted localStorage state

### Requirement: Reconcile suggestions against refreshed content
When suggestion mode is active and change content hot-refreshes, the system SHALL remove any saved suggestion whose original text no longer appears in the combined markdown and spec delta content for the change.

#### Scenario: Resolve suggestions after content changes
- **WHEN** a hot reload removes the original text associated with one or more saved suggestions
- **THEN** the system drops those suggestions from the current change state

### Requirement: Generate clipboard-ready implementation instructions
The system SHALL generate a text instructions document from the current suggestions, SHALL include each suggestion's original text and suggested change, and SHALL support copying the generated instructions to the clipboard.

#### Scenario: Generate instructions with resolved locations
- **WHEN** the operator generates instructions for suggestions whose original text can be located in change markdown content
- **THEN** the system includes the related file path and line number in the generated instructions
