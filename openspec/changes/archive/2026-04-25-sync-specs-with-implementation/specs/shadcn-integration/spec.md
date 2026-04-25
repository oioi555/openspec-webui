## MODIFIED Requirements

### Requirement: Install required shadcn-svelte components
The system SHALL install the following shadcn-svelte components: Button, Tabs, Tooltip, ScrollArea, Collapsible, Resizable, Separator, Dialog, DropdownMenu, Sheet, Input, Badge, Progress, and Sonner. The Badge component SHALL support a `success` variant in addition to the standard variants (`default`, `secondary`, `outline`, `destructive`). General action buttons SHALL use the shared shadcn `<Button>` component, while command shortcut controls SHALL use the dedicated `<CommandChip>` shared component. No feature component SHALL keep inline button or badge styling once the corresponding shared UI component exists. The `toast()` function SHALL be imported directly from `svelte-sonner` rather than from `$lib/components/ui/sonner/`; the Sonner component requirement applies only to the `<Toaster>` root mount component.

#### Scenario: All required components are available
- **WHEN** the frontend is built
- **THEN** all listed shadcn-svelte components are importable from `$lib/components/ui/`

#### Scenario: Badge success variant renders
- **WHEN** a Badge is rendered with `variant="success"`
- **THEN** it displays with success background and text colors

#### Scenario: General actions use Button component
- **WHEN** any feature component renders a primary, ghost, destructive, or icon utility action
- **THEN** it uses `<Button>` from `$lib/components/ui/button`
- **AND** no feature-local inline action button classes remain for those controls

#### Scenario: Command shortcuts use dedicated CommandChip
- **WHEN** any feature component renders a copy-command shortcut control
- **THEN** it renders the shared `<CommandChip>` component instead of a generic `<Button>` or feature-local inline button markup

#### Scenario: No inline badge implementations remain
- **WHEN** any feature component renders a count or status badge
- **THEN** it uses `<Badge>` or `UnderlineTabs` badge support from shared UI components
- **AND** the `badge-num` CSS class does not exist in `app.css`

#### Scenario: Progress component is available
- **WHEN** a feature component needs to render a progress bar
- **THEN** it imports `<Progress>` from `$lib/components/ui/progress/`

#### Scenario: Sonner toast component is available
- **WHEN** a feature component needs to show a toast notification
- **THEN** it imports `toast()` directly from `svelte-sonner`
- **AND** the `<Toaster>` component is mounted at the application root

#### Scenario: Raw button elements remain in some components
- **WHEN** certain shared components (e.g., ExplorerSectionItem) render interactive elements
- **THEN** they may use raw `<button>` HTML elements instead of the shared `<Button>` component
- **AND** this is acceptable where the component's styling requirements diverge from `<Button>` variants
