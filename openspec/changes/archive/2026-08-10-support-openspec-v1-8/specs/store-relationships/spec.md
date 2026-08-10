## Purpose

Defines the official Store relationship model — Store roots, `store:` pointers with declared root sources, and read-only `references:` — and the conditional Dashboard relationship card that routes pointer projects to their planning Store, preserves the local planning root for references projects, and never fabricates local planning content.

## ADDED Requirements

### Requirement: Dashboard routes pointer projects to their planning Store
When the active project declares a `store:` pointer (externalized planning with a declared root source), the Dashboard SHALL prominently identify the project's planning Store and provide a direct action that activates the matching Store row/root in the unified Project Selector list (for example `Open planning Store` or a localized equivalent). Because the pointer project's local OpenSpec may be config-only or empty, the Dashboard SHALL NOT suggest initializing local specs. When the declared Store cannot be resolved from CLI registration, the Dashboard SHALL show a non-blocking unavailable relationship with the official Store documentation link and SHALL NOT fabricate a local planning root.

#### Scenario: Pointer card identifies the planning destination
- **WHEN** the active project declares a `store:` pointer with a declared root source
- **THEN** the Dashboard prominently identifies the pointer's planning Store
- **AND** does not suggest initializing local specs in the pointer project

#### Scenario: Direct action activates the planning Store row
- **WHEN** the operator activates the planning-Store action on a pointer project's card
- **THEN** the matching Store row/root activates in the unified Project Selector list
- **AND** no new planning content is created locally

#### Scenario: Unresolved pointer is non-blocking with docs
- **WHEN** a `store:` pointer targets a Store that is not registered with the CLI
- **THEN** the Dashboard shows a non-blocking unavailable relationship
- **AND** provides the official Store documentation link
- **AND** does not prompt local spec initialization or fabricate a local planning root

### Requirement: Dashboard preserves the local root for references projects
When the active project declares `references:`, the Dashboard SHALL keep the current project's own planning root and SHALL show the references as read-only context separately. Related registered Stores SHALL be navigable by activating their rows in the unified Project Selector list. When a referenced Store cannot be resolved from CLI registration, the Dashboard SHALL show a non-blocking unavailable relationship with the official Store documentation link.

#### Scenario: References card preserves the local planning root
- **WHEN** the active project declares `references:`
- **THEN** the Dashboard keeps the current project's own planning root
- **AND** shows the references as read-only context separately

#### Scenario: Registered referenced Store is navigable
- **WHEN** a referenced Store is registered with the CLI
- **THEN** the Dashboard can activate the referenced Store's row in the unified Project Selector list
- **AND** the current project's planning root is preserved

#### Scenario: Unresolved reference is non-blocking with docs
- **WHEN** a `references:` entry targets a Store that is not registered with the CLI
- **THEN** the Dashboard shows a non-blocking unavailable relationship
- **AND** provides the official Store documentation link

### Requirement: Dashboard shows a compact badge for Store root and a conditional card for pointer/references
When the active project is a Store root, the Dashboard SHALL show a compact `OpenSpec Store` badge beside the project name in the header for passive identification. The Dashboard SHALL render a Store relationship card only when the active project declares a `store:` pointer or declares `references:`. The card SHALL NOT render for pure Store roots without pointer or references, and SHALL NOT render for projects with no Store relationship. The system SHALL NOT fabricate a local planning root for any relationship state.

#### Scenario: Pure Store root gets header badge only
- **WHEN** the active project is a Store root but declares no `store:` pointer and no `references:`
- **THEN** the Dashboard shows a compact `OpenSpec Store` badge beside the project name in the header
- **AND** does not render the Store relationship card

#### Scenario: Pointer or references get the relationship card
- **WHEN** the active project declares a `store:` pointer or `references:`
- **THEN** the Dashboard renders the Store relationship card with pointer or reference content
- **AND** if the project is also a Store root, the header badge is also shown

#### Scenario: No card on unrelated projects
- **WHEN** the active project is not a Store root and declares no `store:` pointer and no `references:`
- **THEN** the Dashboard does not render the Store relationship card or the Store root badge

### Requirement: Store relationships use official non-hierarchical concepts
The system SHALL express Store relationships using only the official concepts: a Store is a standalone planning repo; a `store:` project is a pointer whose resolved root source is `declared` (externalized planning); `references:` are read-only context. The system SHALL NOT use master/slave, parent/child, owner, or any other terminology implying hierarchy or Store ownership.

#### Scenario: Pointer relationship uses official terminology
- **WHEN** the system describes a `store:` pointer project
- **THEN** it uses pointer and planning-destination terminology such as `Points to: <id>` or equivalent localized copy
- **AND** does not use master/slave, parent/child, or owner terminology

#### Scenario: References described as read-only context
- **WHEN** the system describes a project with `references:`
- **THEN** it uses read-only context terminology such as `References: N`
- **AND** does not imply ownership or hierarchy
