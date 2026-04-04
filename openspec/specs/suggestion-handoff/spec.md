# suggestion-handoff Specification

## Purpose
TBD - created by archiving change capture-baseline-specs. Update Purpose after archive.
## Requirements
### Requirement: Enable suggestion mode for active changes
The system SHALL allow suggestion mode on non-archived change detail views, SHALL make rendered markdown blocks selectable while suggestion mode is active, and SHALL not expose suggestion mode controls for archived changes.

#### Scenario: Enter suggestion mode on an active change
- **WHEN** the operator opens an active change and toggles suggestion mode on
- **THEN** the detail view switches into block-selectable suggestion mode
- **AND** shows the suggestion side panel and popover workflow

#### Scenario: Hide suggestion mode for archived changes
- **WHEN** the operator opens an archived change
- **THEN** the UI does not show a suggestion mode toggle

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
- **AND** shows a success toast describing how many suggestions were resolved

### Requirement: Generate clipboard-ready implementation instructions
The system SHALL generate a text instructions document from the current suggestions, SHALL include each suggestion's original text and suggested change, SHALL include a best-effort file path and line number when the original text can be located in markdown content or spec deltas, and SHALL support copying the generated instructions to the clipboard.

#### Scenario: Generate instructions with resolved locations
- **WHEN** the operator generates instructions for suggestions whose original text can be located in change markdown content
- **THEN** the system includes the related file path and line number in the generated instructions

#### Scenario: Generate instructions when no location can be resolved
- **WHEN** the operator generates instructions for a suggestion whose original text cannot be located in supported content
- **THEN** the system still includes the original text and suggested change in the generated instructions
- **AND** omits the location details for that suggestion

