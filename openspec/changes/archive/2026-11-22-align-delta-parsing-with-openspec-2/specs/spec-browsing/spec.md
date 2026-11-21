## MODIFIED Requirements

### Requirement: Parse delta operations with OpenSpec header rules
When parsing a change spec delta into operations, the system SHALL follow OpenSpec 2.1:
- A requirement header SHALL match `###`, optional whitespace, then `Requirement:`.
- A closing `#` run after a space or tab SHALL be dropped from names.
- Fenced lines SHALL NOT be headers.
- A BOM and CRLF endings SHALL NOT change the result.
- Any `##` header SHALL end the current section.
- A leading YAML frontmatter block SHALL be ignored.
- Requirement content SHALL have no trailing whitespace.

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

#### Scenario: Non-delta section
- **WHEN** a requirement is followed by `## Notes` and text
- **THEN** that text is not in the requirement's content

#### Scenario: Frontmatter
- **WHEN** a delta starts with a `---` block holding `owner: a`
- **THEN** no frontmatter text appears in any requirement content
- **AND** line numbers still match the file

#### Scenario: Trailing blank lines
- **WHEN** a requirement block ends with blank lines
- **THEN** its content ends at its last non-blank line

#### Scenario: Singular section header
- **WHEN** a delta uses `## ADDED Requirement`
- **THEN** its requirements are still parsed as added
