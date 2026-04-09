## MODIFIED Requirements

### Requirement: Use semantic color roles consistently
The system SHALL define not only semantic color tokens but also their usage roles. Components SHALL apply the same color family consistently across default, hover, active, and status states so that interaction meaning does not drift.

#### Scenario: Primary family is used for current selection and major action
- **WHEN** a component represents the current location, selected navigation item, active tab, or primary call-to-action
- **THEN** it uses the `primary` token family for its active or emphasized state
- **AND** its hover state uses either a subtle `primary` tint or a neutral surface hover instead of switching to `accent`

#### Scenario: Secondary family is used for neutral hover and low-emphasis surfaces
- **WHEN** a component needs a neutral hover, low-emphasis background, or count badge
- **THEN** it uses the `secondary` token family
- **AND** it does not imply selected or success state meaning

#### Scenario: Accent family is reserved for special differentiated affordances
- **WHEN** a component is a differentiated but non-selected affordance such as command shortcut chips or another explicitly special interaction pattern
- **THEN** it MAY use the `accent` token family
- **AND** it SHALL NOT be used as the generic hover color for navigation items whose active state is represented by `primary`

#### Scenario: Success family is used only for success or done semantics
- **WHEN** a component communicates completion, successful outcome, or done state
- **THEN** it uses the `success` token family
- **AND** the same color family is not reused for unrelated generic hover states

#### Scenario: Warning, danger, and info families retain status semantics
- **WHEN** a component communicates caution, destructive/error state, or informational help
- **THEN** it uses `warning`, `danger`/`destructive`, or `info` respectively
- **AND** those token families are not repurposed as generic navigation hover colors

#### Scenario: Muted family is used for supporting text
- **WHEN** a component renders placeholder text, secondary metadata, or de-emphasized labels
- **THEN** it uses the `muted` token family

#### Scenario: Hover and active states keep semantic alignment
- **WHEN** a navigation or interactive control has a defined active state color family
- **THEN** its hover state remains within the same semantic family or uses a neutral family
- **AND** it does not switch to a different semantic family that implies a different meaning
