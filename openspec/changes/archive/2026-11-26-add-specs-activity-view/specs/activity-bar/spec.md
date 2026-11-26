# Spec Delta

## MODIFIED Requirements

### Requirement: Activity Bar icons trigger explorer section or actions
The system SHALL respond to Activity Bar control clicks as each control's scenarios define. When the operator clicks the icon for the currently active explorer preset while its explorer surface is open, the Explorer Pane SHALL toggle between expanded and collapsed in wide layout, or between open and closed drawer states in narrow layout. The highlighted icon SHALL follow the active explorer preset even when the Main Viewer tab does not change.

#### Scenario: Explorer toggle opens collapsed pane
- **WHEN** the operator activates the bottom Explorer control while the Explorer Pane is collapsed
- **THEN** the Explorer Pane opens without changing the active explorer preset
- **AND** this applies only when an active project exists

#### Scenario: Explorer toggle closes expanded pane
- **WHEN** the operator activates the bottom Explorer control while the Explorer Pane is open
- **THEN** the Explorer Pane closes

#### Scenario: Explorer toggle is inert without active project
- **WHEN** the operator activates the bottom Explorer control while no project is active
- **THEN** no explorer or navigation state changes

#### Scenario: Dashboard icon focuses active changes
- **WHEN** the operator clicks the Dashboard icon
- **THEN** the Explorer Pane opens with the Dashboard tab focused in the Main Viewer
- **AND** the existing Dashboard tab is focused without opening a new tab
- **AND** the ACTIVE CHANGES section is expanded and focused
- **AND** the ARCHIVE section is expanded below it

#### Scenario: Dashboard icon toggles explorer visibility
- **WHEN** the operator clicks the Dashboard icon while it is already active and the explorer surface is open
- **THEN** the explorer surface closes in the current responsive layout
- **AND** the Dashboard icon remains highlighted
- **AND** the Dashboard tab remains focused

#### Scenario: Archive icon focuses archive section
- **WHEN** the operator clicks the Archive icon
- **THEN** the Explorer Pane opens with the Archive section focused
- **AND** the ACTIVE CHANGES section is collapsed
- **AND** no tab is opened or focused in the Main Viewer
- **AND** the Archive icon is highlighted even though the current Main Viewer tab does not change

#### Scenario: Archive icon toggles explorer visibility
- **WHEN** the operator clicks the Archive icon while it is already active and the explorer surface is open
- **THEN** the explorer surface closes in the current responsive layout
- **AND** the Archive icon remains highlighted

#### Scenario: Specs icon focuses specs
- **WHEN** the operator clicks the Specs icon
- **THEN** the Explorer Pane opens with the Specs panel shown instead of the Active Changes and Archive sections
- **AND** no tab is opened or focused in the Main Viewer


#### Scenario: Specs icon toggles explorer visibility
- **WHEN** the operator clicks the Specs icon while it is already active and the explorer surface is open
- **THEN** the explorer surface closes in the current responsive layout
- **AND** the Specs icon remains highlighted

#### Scenario: Search icon opens Search panel
- **WHEN** the operator clicks the Search icon
- **THEN** the Explorer Pane opens with the Search panel active
- **AND** no tab is opened or focused in the Main Viewer

#### Scenario: Validate icon opens Validation panel
- **WHEN** the operator clicks the Validate icon
- **THEN** the Explorer Pane opens with the Validation panel active
- **AND** no tab is opened or focused in the Main Viewer

#### Scenario: No-project app identity stays inert
- **WHEN** the operator clicks the bottom control in the Activity Bar while no project is active
- **THEN** no project selector opens
- **AND** the current view is not navigated away from
- **AND** no Explorer Pane state changes

#### Scenario: Settings icon opens settings tab
- **WHEN** the operator clicks the Settings icon
- **THEN** the Settings tab opens or focuses in the Main Viewer
- **AND** the current Explorer Pane preset is not changed

## ADDED Requirements

### Requirement: Activity Bar highlight ignores spec tabs outside the Specs panel
The Activity Bar SHALL NOT move its highlight to Specs, and SHALL NOT switch the Explorer Pane to the Specs panel, when a spec tab becomes active. Only the Specs icon and the Dashboard Specs summary card SHALL show the Specs panel.

#### Scenario: Spec tab does not move the highlight
- **WHEN** the Dashboard preset is active and the operator opens a spec tab from the Dashboard or from a change
- **THEN** the Dashboard icon stays highlighted
- **AND** the Explorer Pane keeps showing the default section group

#### Scenario: Dashboard Specs summary card opens the Specs panel
- **WHEN** the operator clicks the Specs summary card on the Dashboard
- **THEN** the Explorer Pane shows the Specs panel
- **AND** the Specs icon is highlighted
