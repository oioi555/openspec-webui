## ADDED Requirements

### Requirement: Dashboard header shows version status badge
The system SHALL display a version status badge in the dashboard header, positioned to the right of the FolderPen button. The badge SHALL read from the existing `versionStatusStore` snapshot data.

#### Scenario: All tools up-to-date
- **WHEN** the version snapshot has loaded and no tool updates are available
- **THEN** the badge displays the app version string with a quiet outline variant
- **AND** clicking the badge opens the Settings modal to the Versions page

#### Scenario: Updates available
- **WHEN** the version snapshot has loaded and one or more tool updates are available
- **THEN** the badge displays a warning-style badge showing "current → latest" with an arrow icon
- **AND** clicking the badge opens the Settings modal to the Versions page

#### Scenario: Version snapshot not yet loaded
- **WHEN** the version snapshot has not yet been fetched
- **THEN** the badge is not rendered (or shows a loading placeholder)
- **AND** once the snapshot loads, the badge appears per the above scenarios

### Requirement: Version badge navigates to Versions settings
The system SHALL open the Settings modal directly to the Versions page when the operator clicks the version badge. This SHALL use the same settings navigation mechanism used by other settings entry points.

#### Scenario: Click badge to open Versions settings
- **WHEN** the operator clicks the version badge in the dashboard header
- **THEN** the Settings modal opens with the Versions page active
- **AND** the Versions sidebar item is highlighted
