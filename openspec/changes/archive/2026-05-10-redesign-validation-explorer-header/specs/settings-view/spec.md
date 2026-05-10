## MODIFIED Requirements

### Requirement: Settings view includes validation execution preferences
The Settings view SHALL render as a main-tab page in the Main Viewer and include a Validation section alongside the existing settings sections. The Validation section SHALL include validation execution preferences for strict mode, optional concurrency, and automatic validation runs. The Validation section SHALL participate in the existing Settings section navigation, so selecting Validation updates the visible/scroll-targeted settings content without closing or replacing the Settings tab. Other UI surfaces, including the Validation Explorer panel, SHALL be able to open Settings directly to the Validation section.

#### Scenario: Configure validation preferences from Settings
- **WHEN** the operator opens the Validation section in Settings
- **THEN** the settings content includes controls for strict validation, auto-run, and concurrency
- **AND** changing those controls updates the persisted validation preferences used by future validation runs

#### Scenario: Validation Explorer panel does not own preference controls
- **WHEN** the operator opens the Validation panel in the Explorer Pane
- **THEN** persistent validation preference controls are not rendered in the Explorer panel header
- **AND** those preferences remain configurable from Settings

#### Scenario: Open Settings directly to Validation section
- **WHEN** another UI surface requests Settings with the Validation section selected
- **THEN** the Settings tab opens or focuses in the Main Viewer
- **AND** the Validation settings section is selected or scrolled into view
