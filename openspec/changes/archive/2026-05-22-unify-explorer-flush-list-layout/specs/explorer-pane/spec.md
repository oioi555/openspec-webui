## ADDED Requirements

### Requirement: Default Explorer sections use flush list layout
The Explorer Pane default section group SHALL render Active Changes, Archive, and Specs as adjacent flush full-width list sections instead of visually separated rounded card containers. The default section group SHALL avoid large outer padding and large inter-section gaps so Explorer list items gain horizontal space comparable to Search and Validation panel rows. Each section SHALL retain its collapsible header, icon, count, chevron, sort controls where applicable, Active Changes command shortcut area, empty-state behavior, context menu behavior, item selection behavior, preview/confirmed tab behavior, inline validation indicators, and existing item metadata. Section boundaries SHALL remain visually clear through full-width header styling, separators, or equivalent flush-list-friendly treatment. Programmatic section focus SHALL remain visible without requiring a card-wide rounded focus ring.

#### Scenario: Default Explorer uses adjacent full-width sections
- **WHEN** the Explorer Pane displays the default Active Changes, Archive, and Specs group
- **THEN** the sections render as a contiguous flush list surface rather than as three separated rounded cards
- **AND** there is no large vertical gap between adjacent section containers
- **AND** list rows can use the available Explorer Pane width without extra card-stack inset padding

#### Scenario: Section controls remain available in flush layout
- **WHEN** the default Explorer section group is rendered in the flush layout
- **THEN** each section header still displays its title, icon, count, and collapse/expand control
- **AND** Active Changes, Archive, and Specs still display their sort controls where currently supported
- **AND** Active Changes still displays workspace command shortcuts when available

#### Scenario: Flush layout preserves section wayfinding
- **WHEN** multiple default Explorer sections are expanded next to each other
- **THEN** section headers and separators make the boundary between Active Changes, Archive, and Specs visually clear
- **AND** a programmatically focused section has a visible focused state suitable for a flush list layout

#### Scenario: Existing item behavior is unchanged
- **WHEN** the operator selects, previews, confirms, or opens the context menu for an Active Changes, Archive, or Specs row
- **THEN** the row behavior matches the existing Explorer item behavior
- **AND** inline validation icons, date/spec/task metadata, progress display, and archived-change display names remain unchanged

#### Scenario: Search and Validation panels are not redesigned
- **WHEN** the Explorer Pane switches to Search or Validation mode
- **THEN** those dedicated panels retain their existing header and list structure
- **AND** the default-section flush layout changes do not introduce additional card wrappers or spacing into those panels
