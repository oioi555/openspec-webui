## MODIFIED Requirements

### Requirement: Search the supported content sources only
The system SHALL search project markdown, spec markdown, and change proposal markdown, and SHALL also match each supported search source's document name and path/file identifier. Spec search SHALL include nested `openspec/specs/**/spec.md` files at any depth in addition to top-level `specs/<capability>/spec.md` files. Change search SHALL include spec delta markdown under `changes/<name>/specs/**/spec.md` at any depth in addition to top-level `changes/<name>/specs/<capability>/spec.md` files. The system SHALL return each hit with a result type, result name, and excerpt. When a query matches source metadata without matching markdown body content, the system SHALL still return that document once and SHALL provide result preview data that explains the metadata match.

#### Scenario: Return a spec match from the spec name
- **WHEN** the query matches a capability spec name even if the query does not appear in that spec's markdown body
- **THEN** the system returns a single `spec` result for that capability
- **AND** the result preview explains the metadata match instead of showing an unrelated body excerpt

#### Scenario: Return a match from a nested spec
- **WHEN** the query matches the markdown body or name of a spec located at a nested path such as `openspec/specs/network/auth/spec.md`
- **THEN** the system returns a single `spec` result for the nested capability
- **AND** selecting the result opens the same nested spec detail view as browsing it from the Explorer Pane

#### Scenario: Return a match from a nested change spec delta
- **WHEN** the query matches the markdown body of a spec delta located at a nested path such as `openspec/changes/<name>/specs/network/auth/spec.md`
- **THEN** the system returns a single `change` result for that change
- **AND** selecting the result opens ChangeViewer Spec Deltas for the nested capability `network/auth`

#### Scenario: Return a nested change spec delta from capability-path metadata
- **WHEN** the query matches a nested spec delta's capability identity or path even if the query does not appear in that delta's markdown body
- **THEN** the system returns a single `change` result for that change
- **AND** the result preview explains the metadata match instead of showing an unrelated body excerpt

#### Scenario: Return a change match from source metadata
- **WHEN** the query matches a change's source name or path even if the query does not appear in the proposal body
- **THEN** the system returns a single `change` result for that change
- **AND** selecting the result still opens the same change detail tab as before

#### Scenario: Deduplicate combined content and metadata matches
- **WHEN** a query matches both a supported document's metadata and its markdown body
- **THEN** the system returns that document only once in the Search result list
- **AND** existing result navigation behavior remains unchanged
