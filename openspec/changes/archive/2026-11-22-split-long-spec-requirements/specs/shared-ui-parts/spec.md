## MODIFIED Requirements

### Requirement: ExplorerSection component
The system SHALL provide an `ExplorerSection` component in `$lib/components/shared/explorer-section/` rendering a collapsible section with header, content area, and the props listed below. The header SHALL display the icon, title in uppercase tracking-wider text, a count badge, and a collapsed/expanded chevron. With `emptyMessage` set and no child content, it SHALL render an `EmptyState` (with `emptyMessage` and optional `emptyIcon`) instead of the children.

#### Scenario: Accept section props
- **WHEN** an ExplorerSection is used
- **THEN** it accepts `title` (string), `count` (number), `open` (boolean), `focused` (boolean, optional), `onToggle` (callback), an optional `icon`, an optional `headerExtra` slot, `emptyMessage` (string, optional), `emptyIcon` (Component, optional), and a default slot for content

#### Scenario: Render expanded section
- **WHEN** an ExplorerSection is rendered with `title="ACTIVE CHANGES"`, `count={3}`, and `open={true}`
- **THEN** the section header shows the icon, title in uppercase tracking-wider text, count badge with "3", and a down chevron
- **AND** the content area is visible

#### Scenario: Render collapsed section
- **WHEN** an ExplorerSection is rendered with `title="ARCHIVE"`, `count={5}`, and `open={false}`
- **THEN** the section header shows the title, count badge with "5", and a right chevron
- **AND** the content area is hidden

#### Scenario: Toggle section
- **WHEN** the operator clicks the section header
- **THEN** `onToggle` is called

#### Scenario: Render header extra content
- **WHEN** an ExplorerSection is rendered with `headerExtra` content
- **THEN** the extra content appears beneath the main header row and above the collapsible content area

#### Scenario: Render focused section styling
- **WHEN** an ExplorerSection is rendered with `focused={true}`
- **THEN** the section container shows the current focused-section ring styling

#### Scenario: Render empty state when emptyMessage provided and no items
- **WHEN** an ExplorerSection is rendered with `emptyMessage="No active changes"`, `emptyIcon={SquarePen}`, and `open={true}` with no children rendered
- **THEN** the section body shows an EmptyState with the provided message and icon
- **AND** no children content area is rendered

#### Scenario: Render children when items exist even with emptyMessage
- **WHEN** an ExplorerSection is rendered with `emptyMessage="No active changes"` and children snippet produces content
- **THEN** the section body shows the children content
- **AND** no EmptyState is rendered

### Requirement: Card surface primitives
The system SHALL provide reusable Card primitives in `$lib/components/ui/card/`, as listed in the import scenario. Shared Card surfaces SHALL compose these primitives directly or through thin wrappers instead of duplicating card markup. Peer Dashboard `SurfaceCard` wrappers SHALL share one default shadow weight unless a capability-specific requirement explicitly needs stronger elevation. Card and surface primitives SHALL support a restrained radius hierarchy without stacked card-in-card chrome.

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
- **AND** no section appears more elevated solely because of a local shadow mismatch, unless a capability-specific requirement explicitly requires stronger elevation

#### Scenario: Preserve outer shell grouping while reducing nested radius
- **WHEN** a major Dashboard or viewer section uses a shared surface wrapper as an outer shell
- **THEN** the shell may retain modest rounding to communicate grouping
- **AND** nested interactive rows or list items inside that shell can use smaller radius or no visible radius
- **AND** the resulting composition does not stack multiple large rounded containers inside each other

#### Scenario: Preserve compound task item boundaries
- **WHEN** a Dashboard Active Changes item contains both a main row and a `Next Step` sub-row whose separator must remain visually distinct from item boundaries
- **THEN** the item may render as a small-radius bounded task card with modest spacing from adjacent items
- **AND** the `Next Step` sub-row uses a weaker internal separator or subtle background so it reads as part of the same change item
- **AND** the item does not use large-radius floating-card styling or shadow-heavy hover treatment

### Requirement: Shared surfaces follow solid radius hierarchy
The system SHALL apply a solid, restrained radius hierarchy across shared UI surfaces. Outer containers such as major cards, dialogs, and section shells MAY keep modest rounding. Inner surfaces SHALL avoid excessive pill or large-rounded treatment unless the component's semantic role explicitly requires it. Dense list, dashboard, and settings surfaces SHALL prefer border separators, background hover states, and focus outlines over hover translation and stacked shadows.

#### Scenario: Inner surfaces covered by the radius hierarchy
- **WHEN** inner list rows, dashboard items, settings controls, callouts, option cards, inset values, badges, chips, or icon boxes render
- **THEN** they avoid excessive pill or large-rounded treatment unless their semantic role explicitly requires it

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

### Requirement: Shared validation status semantics
The system SHALL provide shared validation status semantics for target and result states including not-run, passed, failed, warning, stale, unknown, and info. The shared semantics SHALL define each state's canonical label, icon, icon-box tone, and badge tone. Components rendering validation status SHALL consume them instead of local icon or badge mappings. The status indicator SHALL also support a compact icon-only `minimal` format for list rows.

#### Scenario: Render inline validation target status
- **WHEN** an inline validation target status renders a passed, failed, warning, stale, not-run, or unknown state
- **THEN** it uses the shared validation status semantics for icon, label, and tone

#### Scenario: Render validation panel result status
- **WHEN** the Validation panel renders the latest passed or failed result status
- **THEN** it uses the same status semantics as inline validation status surfaces

#### Scenario: Render icon-only minimal validation status
- **WHEN** a compact Explorer-style row renders `StatusIndicator` with `format="minimal"` for a validation state such as `warning`, `failed`, `info`, or `passed`
- **THEN** the indicator renders only the shared status icon with the corresponding status color treatment
- **AND** it does not render badge chrome or a visible label
- **AND** the status remains accessible through an accessible label or tooltip

#### Scenario: Preserve other validation indicator densities
- **WHEN** another surface renders `StatusIndicator` with `format="badge"` or `format="icon-box"`
- **THEN** those formats continue to use the same shared validation status semantics
- **AND** the compact icon-only behavior remains specific to the `minimal` format
