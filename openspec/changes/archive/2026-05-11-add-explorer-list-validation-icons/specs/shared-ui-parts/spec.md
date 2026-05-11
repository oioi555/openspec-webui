## MODIFIED Requirements

### Requirement: Shared validation status semantics
The system SHALL provide shared validation status semantics for target and result states including not-run, passed, failed, warning, stale, unknown, and info. The shared semantics SHALL define the canonical label, icon, icon-box tone, and badge tone for each state. Components that render validation status SHALL consume the shared semantics instead of defining local status icon or badge mappings. The reusable status indicator SHALL also support a compact icon-only presentation for list-row use via its `minimal` format.

#### Scenario: Render icon-only minimal validation status
- **WHEN** a compact Explorer-style row renders `StatusIndicator` with `format="minimal"` for a validation state such as `warning`, `failed`, `info`, or `passed`
- **THEN** the indicator renders only the shared status icon with the corresponding status color treatment
- **AND** it does not render badge chrome or a visible label
- **AND** the status remains accessible through an accessible label or tooltip

#### Scenario: Preserve other validation indicator densities
- **WHEN** another surface renders `StatusIndicator` with `format="badge"` or `format="icon-box"`
- **THEN** those formats continue to use the same shared validation status semantics
- **AND** the compact icon-only behavior remains specific to the `minimal` format
