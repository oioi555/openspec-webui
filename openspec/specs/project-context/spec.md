# project-context Specification

## Purpose
Defines the web UI three-pane layout and project context behavior.

## Requirements

### Requirement: Three-pane layout
The web UI SHALL provide an Obsidian-like three-pane layout with Activity Bar, Explorer Pane, and Main Viewer. The Activity Bar SHALL be the leftmost pane and always visible. The Explorer Pane SHALL be resizable and collapsible. The Main Viewer SHALL fill the remaining space. The layout SHALL support responsive breakpoints. The top-left area and the Activity Bar bottom control SHALL depend on whether a project is active.

#### Scenario: Narrow width turns the Explorer Pane into a drawer
- **WHEN** the viewport is at a narrow-width breakpoint
- **THEN** the Explorer Pane becomes a drawer overlay instead of a side panel

#### Scenario: Active project shows project identity
- **WHEN** an active project exists
- **THEN** the top-left area shows the project name and a project selector dropdown
- **AND** the Activity Bar bottom control toggles the Explorer Pane

#### Scenario: No active project falls back to app identity
- **WHEN** no project is active
- **THEN** the bottom Activity Bar control shows the shared app icon
- **AND** the Main Viewer shows the empty state instead of the Dashboard
- **AND** the Activity Bar bottom control does not toggle the Explorer Pane
