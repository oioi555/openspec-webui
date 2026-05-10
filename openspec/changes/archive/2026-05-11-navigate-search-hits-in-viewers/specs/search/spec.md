## MODIFIED Requirements

### Requirement: Search the supported content sources only
The system SHALL search project markdown, spec markdown, and change markdown sources, and SHALL also match each supported search source's document name and path/file identifier. For changes, supported markdown sources SHALL include proposal, design, tasks, other change markdown files, and change spec delta markdown. The system SHALL return each hit with a result type, result name, and excerpt. When a query matches source metadata without matching markdown body content, the system SHALL still return that document once and SHALL provide result preview data that explains the metadata match. When a query matches markdown body content within a change, the system SHALL return enough routing metadata for the frontend to identify the first matching change document and matching spec delta capability when applicable.

#### Scenario: Return a change hit from design markdown
- **WHEN** the query matches `design.md` content inside a change
- **THEN** the system returns a single `change` result for that change
- **AND** the result includes routing metadata identifying the design document as the first matching target

#### Scenario: Return a change hit from spec delta markdown
- **WHEN** the query matches a change spec delta markdown document for capability `search`
- **THEN** the system returns a single `change` result for that change
- **AND** the result includes routing metadata identifying the Spec Deltas area and the matching `search` capability

#### Scenario: Metadata-only change result preserves no-body-hit fallback
- **WHEN** the query matches a change name or path but does not appear in any change markdown body content
- **THEN** the system still returns that `change` result
- **AND** the result does not claim a markdown-body hit target that the viewer cannot open to directly
