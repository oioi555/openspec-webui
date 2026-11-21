## ADDED Requirements

### Requirement: Parse delta operations with OpenSpec header rules
When parsing a change spec delta into operations, the system SHALL use the requirement header rules of OpenSpec 2.1:
- A requirement header SHALL match `###`, optional whitespace, then `Requirement:`.
- A closing run of `#` characters preceded by a space or tab SHALL be removed from requirement names and SHALL be allowed on delta section headers.
- Lines inside fenced code blocks SHALL NOT be treated as headers.
- A leading byte-order mark and CRLF line endings SHALL NOT change the result.

#### Scenario: Header without a space
- **WHEN** an ADDED section contains `###Requirement: Compact header`
- **THEN** the operations include an added requirement named `Compact header`

#### Scenario: Closing run of hashes
- **WHEN** a delta contains `## MODIFIED Requirements ##` followed by `### Requirement: Foo ###`
- **THEN** the operations include a modified requirement named `Foo`

#### Scenario: Header example in a code fence
- **WHEN** a requirement body contains a fenced code block with the line `### Requirement: Example`
- **THEN** no separate requirement named `Example` is produced
- **AND** the fenced lines stay in the enclosing requirement's content

#### Scenario: CRLF file
- **WHEN** a delta file uses CRLF line endings
- **THEN** its operations equal those of the same file with LF line endings
