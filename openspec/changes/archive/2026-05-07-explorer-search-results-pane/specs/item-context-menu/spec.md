## ADDED Requirements

### Requirement: Context menu search actions target Explorer Search panel
When an item context menu provides a search action, the action SHALL initiate search through the shared Explorer Search panel rather than opening a transient search dialog.

#### Scenario: Context menu search opens Explorer Search panel
- **WHEN** the operator selects a search action from an item context menu
- **THEN** the Explorer Search panel receives the action keyword as its query
- **AND** the Explorer Pane switches to the Search panel
- **AND** selecting a result opens or focuses a Main Viewer tab while preserving the result list
