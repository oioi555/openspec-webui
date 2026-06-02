# validation-dashboard-summary Specification

## Purpose
Displays validation status summary on the Dashboard.

## Requirements

### Requirement: Dashboard displays validation summary card
The system SHALL display a Validation summary card in the Dashboard's top summary card area. The card SHALL show the latest validation health for the active project using the validation state introduced by the Validation panel capability. The card SHALL support at least not-run/unknown, running, passed, and failed states without implying that a project has passed validation before a validation result exists.

#### Scenario: Validation has not run
- **WHEN** the Dashboard renders before validation has been run for the active project
- **THEN** the Validation card shows a not-run or unknown validation state
- **AND** it does not display the project as passing validation

#### Scenario: Validation is running
- **WHEN** validation is currently running
- **THEN** the Validation card indicates that validation is in progress
- **AND** it does not show stale failures as if they were the final result of the current run

#### Scenario: Validation passed
- **WHEN** the latest validation result for the active project passed
- **THEN** the Validation card shows a passing status
- **AND** it shows zero failed items or an equivalent pass indicator

#### Scenario: Validation failed
- **WHEN** the latest validation result for the active project contains failed items
- **THEN** the Validation card shows a failed status
- **AND** it displays the failed item count

### Requirement: Dashboard validation card opens Validation panel
Activating the Dashboard Validation card SHALL open the Validation panel in the Explorer Pane using the existing Validate Activity/Explorer preset. The card SHALL NOT open a standalone validation route or create a Main Viewer validation tab.

#### Scenario: Click validation card
- **WHEN** the operator clicks the Validation summary card on the Dashboard
- **THEN** the Explorer Pane opens if collapsed
- **AND** the Explorer Pane switches to the Validation panel
- **AND** no validation-specific Main Viewer tab is opened

#### Scenario: Card preserves current validation result
- **WHEN** the operator clicks the Validation summary card after a validation result exists
- **THEN** the Validation panel opens with the current validation result still visible
- **AND** validation is not automatically re-run solely because the card was clicked

### Requirement: Dashboard validation card follows existing card visual patterns
The Dashboard Validation card SHALL follow the same interactive card structure, responsive grid behavior, icon treatment, and concise label/value/description pattern as the existing Dashboard summary cards.

#### Scenario: Dashboard summary cards render responsively
- **WHEN** the Dashboard summary card row renders at narrow or wide viewport sizes
- **THEN** the Validation card participates in the same responsive grid behavior as the other summary cards
- **AND** it remains readable without overlapping adjacent cards

#### Scenario: Validation card uses concise content
- **WHEN** the Validation card renders any supported state
- **THEN** the card shows a concise label, primary value, and short description
- **AND** it does not render a detailed validation issue list inside the card
