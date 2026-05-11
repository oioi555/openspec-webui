## MODIFIED Requirements

### Requirement: Search results distinguish archived changes
The system SHALL distinguish archived change results from active change results when rendering mixed Search panel output. A change search result whose name corresponds to an archived change SHALL use archived-change visual semantics; a change search result whose name corresponds to an active change SHALL use active-change visual semantics. Search result rows SHALL also mirror the inline validation-icon rules of the resolved target kind: active change results show `failed`, `warning`, `info`, or `passed`; archived change results show no inline validation icon; spec results show only `failed`, `warning`, or `info`; other result kinds show no inline validation icon. Search result selection and tab-opening behavior SHALL remain unchanged.

#### Scenario: Render active change search result with pass icon
- **WHEN** the Search panel displays a `change` result whose name belongs to an active change and that change's latest validation target status is `passed`
- **THEN** the result uses the shared active-change indicator semantics
- **AND** it also shows the shared pass icon as a compact trailing validation indicator

#### Scenario: Render spec search result with attention icon
- **WHEN** the Search panel displays a `spec` result whose latest validation target status is `failed`, `warning`, or `info`
- **THEN** the result shows the corresponding shared validation icon as a compact trailing validation indicator

#### Scenario: Hide archived search validation icon
- **WHEN** the Search panel displays a `change` result whose name belongs to an archived change
- **THEN** the result uses the shared archived-change indicator semantics
- **AND** it does not show a trailing validation icon

#### Scenario: Hide non-target search validation icon
- **WHEN** the Search panel displays a `project` or `unknown` result
- **THEN** the result uses the corresponding shared entity semantics
- **AND** it does not show a trailing validation icon
