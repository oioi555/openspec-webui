## MODIFIED Requirements

### Requirement: Card surface primitives
The system SHALL provide reusable Card surface primitives in `$lib/components/ui/card/` for standard container, header, title, description, content, and footer layouts. Feature surfaces that use the shared Card pattern SHALL compose these primitives directly or through thin shared wrappers instead of duplicating feature-local card container markup. Dashboard section wrappers built on shared `SurfaceCard` styling SHALL use a consistent default shadow weight across peer panels unless a stronger elevation is explicitly required by a capability-specific requirement. Shared card and surface primitives SHALL support a restrained radius hierarchy where major outer shells may retain modest rounding, while nested item/list surfaces can render with smaller radius or no visible radius to avoid stacked card-in-card chrome. Compound dashboard task items MAY retain a small-radius bounded surface when they contain internal sub-rows whose separators must remain visually distinct from item boundaries.

#### Scenario: Import Card primitives from shared UI
- **WHEN** a feature component imports from `$lib/components/ui/card/`
- **THEN** `Root`, `Header`, `Title`, `Description`, `Content`, and `Footer` are available
- **AND** they can be composed into a bordered card surface with shared card styling

#### Scenario: Base Card uses restrained outer-shell radius
- **WHEN** the base Card root renders without a local radius override
- **THEN** it uses the restrained outer-shell radius level
- **AND** it does not default to an extra-large rounded treatment that conflicts with the solid surface hierarchy

#### Scenario: Shared wrapper builds on Card primitives
- **WHEN** a reusable feature-neutral card wrapper is added under `$lib/components/shared/`
- **THEN** it composes the shared Card primitives or their class pattern
- **AND** it does not reintroduce a separate feature-local card foundation

#### Scenario: Render dashboard section surfaces consistently
- **WHEN** the Dashboard renders peer section panels such as Active Changes and Recent Activity
- **THEN** their shared `SurfaceCard` wrappers use the same default shadow weight
- **AND** no section appears more elevated solely because of a local shadow mismatch

#### Scenario: Preserve outer shell grouping while reducing nested radius
- **WHEN** a major Dashboard or viewer section uses a shared surface wrapper as an outer shell
- **THEN** the shell may retain modest rounding to communicate grouping
- **AND** nested interactive rows or list items inside that shell can use smaller radius or no visible radius
- **AND** the resulting composition does not stack multiple large rounded containers inside each other

#### Scenario: Preserve compound task item boundaries
- **WHEN** a Dashboard Active Changes item contains both a main row and a `Next Step` sub-row
- **THEN** the item may render as a small-radius bounded task card with modest spacing from adjacent items
- **AND** the `Next Step` sub-row uses a weaker internal separator or subtle background so it reads as part of the same change item
- **AND** the item does not use large-radius floating-card styling or shadow-heavy hover treatment

## ADDED Requirements

### Requirement: Shared surfaces follow solid radius hierarchy
The system SHALL apply a solid, restrained radius hierarchy across shared UI surfaces. Outer containers such as major cards, dialogs, and section shells MAY keep modest rounding. Inner list rows, dashboard items, settings controls, callouts, option cards, inset values, badges, chips, and icon boxes SHALL avoid excessive pill or large-rounded treatment unless the component's semantic role explicitly requires it. Dense list, dashboard, and settings surfaces SHALL prefer border separators, background hover states, and focus outlines over hover translation and stacked shadows.

#### Scenario: Inner dashboard items render as solid rows
- **WHEN** the Dashboard renders Active Changes or Recent Activity inside an outer section shell
- **THEN** each item appears as a solid row, restrained list tile, or small-radius bounded task card rather than a large rounded floating card
- **AND** row boundaries remain clear through borders, separators, spacing, or background state
- **AND** the item remains visibly interactive on hover and focus

#### Scenario: Summary cards use restrained rounding
- **WHEN** the Dashboard renders top-level summary cards
- **THEN** the cards use a calmer radius and hover treatment than dense nested cards
- **AND** activating a summary card still focuses the same Explorer/Dashboard destination as before

#### Scenario: Badges and icon boxes avoid unnecessary pill styling
- **WHEN** badges, chips, or icon boxes appear inside dense dashboard or list rows
- **THEN** they use compact radius appropriate to labels and icons
- **AND** they do not create a visually dominant pill-heavy appearance unless the component's semantic role requires a pill

#### Scenario: Callouts use inner-surface radius
- **WHEN** a `Callout` renders inside a major shell or settings section
- **THEN** it uses a smaller radius than the surrounding shell
- **AND** its semantic state remains clear through border, background, and text color

#### Scenario: Settings option cards avoid playful nested rounding
- **WHEN** the Settings page renders option cards for theme or workflow choices
- **THEN** the option card uses restrained card radius
- **AND** its icon container is not circular by default
- **AND** hover feedback uses grounded color or border changes rather than scale or shadow emphasis

#### Scenario: Settings grouped controls use medium or small radius
- **WHEN** the Settings page renders navigation buttons, grouped command/validation controls, preview-tab rows, or inline command containers
- **THEN** those inner settings surfaces use medium or small radius according to nesting depth
- **AND** they do not use the same large radius as the outer settings `SurfaceCard` shell

#### Scenario: Solid hover state replaces floaty nested-card motion
- **WHEN** the operator hovers or focuses an interactive row inside a dense section
- **THEN** the row communicates interactivity through background, border, or focus styling
- **AND** it does not rely on vertical translation or increased shadow as the primary affordance

#### Scenario: Existing behavior remains unchanged
- **WHEN** surface radius and hover styling are updated
- **THEN** navigation, context menus, command shortcuts, sorting, validation indicators, progress display, and localization behavior remain unchanged
