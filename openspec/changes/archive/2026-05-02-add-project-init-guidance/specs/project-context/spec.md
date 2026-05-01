## MODIFIED Requirements

### Requirement: Three-pane layout
The web UI SHALL provide an Obsidian-like three-pane layout with Activity Bar, Explorer Pane, and Main Viewer. The Activity Bar SHALL be the leftmost pane and always visible. The Explorer Pane SHALL be resizable and collapsible. The Main Viewer SHALL fill the remaining space. The layout SHALL support responsive breakpoints: at narrow widths the Explorer Pane SHALL become a drawer overlay instead of a side panel. When an active project exists, the top-left area SHALL show the project name and a project selector dropdown. When no project is active, the Main Viewer SHALL show the empty state instead of the Dashboard. The Activity Bar bottom control SHALL toggle the Explorer Pane only when an active project exists.

#### Scenario: No active project falls back to app identity
- **WHEN** no project is active
- **THEN** the bottom Activity Bar control shows the shared app icon
- **AND** the Main Viewer shows the empty state instead of the Dashboard
