## MODIFIED Requirements

### Requirement: Dashboard routes pointer projects to their planning Store
When the active project declares a `store:` pointer (externalized planning with a declared root source), the Dashboard SHALL display the relationship as a single compact navigation line that directly shows the pointer's planning Store together with its state, and SHALL provide a direct action on that line that opens the planning Store in one operation by activating the matching Store row/root in the unified Project Selector list (for example `Open planning Store` or a localized equivalent). The compact line SHALL NOT include explanatory description text. Because the pointer project's local OpenSpec may be config-only or empty, the Dashboard SHALL NOT suggest initializing local specs. When the declared Store cannot be resolved from CLI registration, the Dashboard SHALL directly show a non-blocking unavailable relationship with the official Store documentation link and SHALL NOT fabricate a local planning root.

#### Scenario: Pointer card identifies the planning destination
- **WHEN** the active project declares a `store:` pointer with a declared root source
- **THEN** the Dashboard displays a single compact line directly identifying the pointer's planning Store with its state
- **AND** does not suggest initializing local specs in the pointer project
- **AND** does not show explanatory description text

#### Scenario: Direct action activates the planning Store row
- **WHEN** the operator activates the planning-Store action on a pointer project's compact line
- **THEN** the matching Store row/root activates in the unified Project Selector list in one operation
- **AND** no new planning content is created locally

#### Scenario: Unresolved pointer is non-blocking with docs
- **WHEN** a `store:` pointer targets a Store that is not registered with the CLI
- **THEN** the Dashboard directly shows a non-blocking unavailable relationship
- **AND** provides the official Store documentation link
- **AND** does not prompt local spec initialization or fabricate a local planning root

### Requirement: Dashboard preserves the local root for references projects
When the active project declares `references:`, the Dashboard SHALL keep the current project's own planning root and SHALL show the references as read-only context in a single compact navigation line that displays the entry count by default. The compact line SHALL expand on operator activation to reveal the navigation list of the referenced Stores, and SHALL NOT include explanatory description text. Related registered Stores SHALL be navigable by activating their rows in the unified Project Selector list. When a referenced Store cannot be resolved from CLI registration, the Dashboard SHALL directly show a non-blocking unavailable relationship with the official Store documentation link. `references` entries SHALL be handled by `id` only: the `remote` field SHALL NOT be used for display, resolution, or verification.

#### Scenario: References card preserves the local planning root
- **WHEN** the active project declares `references:`
- **THEN** the Dashboard keeps the current project's own planning root
- **AND** shows the references as read-only context in a compact line with the entry count by default

#### Scenario: References count expands into Store navigation
- **WHEN** the operator expands the references compact line
- **THEN** the compact line reveals the navigation list of the referenced Stores
- **AND** the current project's planning root is preserved

#### Scenario: Registered referenced Store is navigable
- **WHEN** a referenced Store is registered with the CLI
- **THEN** the Dashboard can activate the referenced Store's row in the unified Project Selector list
- **AND** the current project's planning root is preserved

#### Scenario: Unresolved reference is non-blocking with docs
- **WHEN** a `references:` entry targets a Store that is not registered with the CLI
- **THEN** the Dashboard directly shows a non-blocking unavailable relationship
- **AND** provides the official Store documentation link

#### Scenario: References are handled by id only
- **WHEN** the Dashboard displays, resolves, or verifies `references:` entries
- **THEN** it uses each entry's `id`
- **AND** does not use the `remote` field for display, resolution, or verification

### Requirement: Dashboard shows a compact badge for Store root and a conditional card for pointer/references
When the active project is a Store root, the Dashboard SHALL show a compact `OpenSpec Store` badge beside the project name in the header for passive identification. The Dashboard SHALL render the Store relationship display — a single compact navigation line — only when the active project declares a `store:` pointer or declares `references:`. The relationship display SHALL NOT render for pure Store roots without pointer or references, and SHALL NOT render for projects with no Store relationship. The system SHALL NOT fabricate a local planning root for any relationship state.

#### Scenario: Pure Store root gets header badge only
- **WHEN** the active project is a Store root but declares no `store:` pointer and no `references:`
- **THEN** the Dashboard shows a compact `OpenSpec Store` badge beside the project name in the header
- **AND** does not render the Store relationship display

#### Scenario: Pointer or references get the relationship card
- **WHEN** the active project declares a `store:` pointer or `references:`
- **THEN** the Dashboard renders the single compact navigation line with pointer or reference content
- **AND** if the project is also a Store root, the header badge is also shown

#### Scenario: No card on unrelated projects
- **WHEN** the active project is not a Store root and declares no `store:` pointer and no `references:`
- **THEN** the Dashboard does not render the Store relationship display or the Store root badge
