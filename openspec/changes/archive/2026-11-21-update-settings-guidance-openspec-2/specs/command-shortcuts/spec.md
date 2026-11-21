## ADDED Requirements

### Requirement: Deprecate the CLI delivery value for OpenSpec 2.x
The command availability API SHALL keep its `delivery` field for compatibility. When the local OpenSpec CLI reports major version 2 or later, the server SHALL NOT read the CLI `delivery` setting and SHALL return `delivery` as `null`. Candidate selection and the Settings view SHALL NOT depend on the CLI `delivery` value.

#### Scenario: OpenSpec 2.1.1 CLI
- **WHEN** the availability API runs against an OpenSpec 2.1.1 CLI whose config still contains `delivery: both`
- **THEN** the response's `delivery` is `null`
- **AND** command candidates are unchanged
