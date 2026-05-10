## ADDED Requirements

### Requirement: Search panel exposes a persistent viewer highlight toggle
The Search panel SHALL expose a toggle in its sticky header that lets the operator enable or disable in-page highlighting of the current search query inside open markdown viewers. The toggle SHALL use the `Highlighter` icon, SHALL appear in the Search header action area, and SHALL use warning-tone styling when enabled. The system SHALL persist the operator's chosen state locally and SHALL restore that state in later sessions. The Search header SHALL keep result status readable without relying on a separate redundant result-count badge.

#### Scenario: Enable viewer highlighting from the Search header
- **WHEN** the operator enables the Search panel's highlight toggle while a valid search query is present
- **THEN** the toggle renders in its enabled warning-tone state
- **AND** open markdown viewers may show in-page highlights for the current query

#### Scenario: Restore persisted Search highlight preference
- **WHEN** the operator previously disabled the Search panel's highlight toggle and later reopens the app
- **THEN** the Search panel restores the toggle in the disabled state
- **AND** markdown viewers do not render query highlights until the operator enables it again
