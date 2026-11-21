## MODIFIED Requirements

### Requirement: Install required shadcn-svelte components
The system SHALL install the required shadcn-svelte components. The Badge component SHALL support a `success` variant in addition to the standard variants. General actions SHALL use the shared shadcn `<Button>`; command shortcuts SHALL use the shared `<CommandChip>`. Feature components SHALL NOT keep inline button or badge styling once a shared component exists. `toast()` SHALL be imported directly from `svelte-sonner`; the Sonner component is required only for the `<Toaster>` root mount.

#### Scenario: All required components are available
- **WHEN** the frontend is built
- **THEN** Button, Tabs, Tooltip, ScrollArea, Collapsible, Resizable, Separator, Dialog, DropdownMenu, Sheet, Input, Badge, Progress, and Sonner are importable from `$lib/components/ui/`

#### Scenario: Badge success variant renders
- **WHEN** a Badge is rendered with `variant="success"`
- **THEN** it displays with success background and text colors
- **AND** the standard variants `default`, `secondary`, `outline`, and `destructive` remain available

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
- **THEN** it imports `toast()` directly from `svelte-sonner` rather than from `$lib/components/ui/sonner/`
- **AND** the `<Toaster>` component is mounted at the application root

#### Scenario: Raw button elements remain in some components
- **WHEN** certain shared components (e.g., ExplorerSectionItem) render interactive elements
- **THEN** they may use raw `<button>` HTML elements instead of the shared `<Button>` component
- **AND** this is acceptable where the component's styling requirements diverge from `<Button>` variants
