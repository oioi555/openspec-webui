## MODIFIED Requirements

### Requirement: Activity Bar renders persistent vertical control strip
The system SHALL render a vertical Activity Bar as the leftmost pane of the application layout, fixed at 48px width. The Activity Bar SHALL remain visible even when the Explorer Pane is collapsed. The `decodeName` utility function used in the Activity Bar SHALL be imported from `$lib/utils` instead of being defined locally.

#### Scenario: decodeName imported from shared utils
- **WHEN** the ActivityBar component needs to decode a URI component
- **THEN** it imports `decodeName` from `$lib/utils`
- **AND** no local `decodeName` function is defined in ActivityBar.svelte
