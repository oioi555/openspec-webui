## MODIFIED Requirements

### Requirement: Show a Versions page in settings
The settings dialog SHALL include a `Versions` category that displays installed/current version, latest version, and update status for both `openspec-webui` and OpenSpec CLI. The page SHALL show representative npm global-install update commands as the primary examples for both tools. Each tool section SHALL include a small copy action for its command text and a link to that tool's GitHub releases page. The Versions section header SHALL show the latest version-snapshot check time and an icon-only manual refresh action, with the timestamp rendered immediately to the left of the refresh action.

#### Scenario: View Versions page with snapshot freshness metadata
- **WHEN** the operator opens Settings and selects `Versions`
- **AND** the server has already built a version snapshot
- **THEN** the Versions section header shows when the snapshot was last checked
- **AND** the header shows an icon-only refresh action to the right of that timestamp

#### Scenario: Trigger a manual version refresh from the header
- **WHEN** the operator clicks the refresh action in the Versions section header
- **THEN** the client triggers a fresh server-side version snapshot lookup for both tools
- **AND** the refresh action becomes disabled while that lookup is in flight
- **AND** the Versions page updates to reflect the refreshed snapshot when the lookup completes

#### Scenario: View Versions page before any successful check time exists
- **WHEN** the operator opens Settings and selects `Versions`
- **AND** the current snapshot has no `checkedAt` value yet
- **THEN** the Versions section header shows a clear fallback instead of a timestamp
- **AND** the refresh action remains available unless a lookup is already in progress
