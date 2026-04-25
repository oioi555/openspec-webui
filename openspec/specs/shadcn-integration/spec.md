# shadcn-integration Specification

## Purpose
Define the shared UI foundation for the redesigned interface using shadcn-svelte, Tailwind CSS v4, and Lucide icons.

## Requirements
### Requirement: shadcn-svelte library integration
The system SHALL integrate shadcn-svelte as the UI component library. The `components.json` configuration file SHALL be created at the frontend root with appropriate path aliases for a plain Vite + Svelte 5 project.

#### Scenario: components.json is configured
- **WHEN** the frontend build runs
- **THEN** `components.json` exists at the frontend root
- **AND** it configures `$lib` as the component alias pointing to `frontend/src/lib`

#### Scenario: shadcn-svelte components are importable
- **WHEN** a Svelte component imports from `$lib/components/ui/`
- **THEN** the shadcn-svelte components resolve without error

### Requirement: Path aliases configured for plain Vite
The system SHALL configure `$lib` as a path alias in both `vite.config.ts` and `tsconfig.json`. The alias SHALL resolve to `frontend/src/lib`.

#### Scenario: Vite resolves $lib alias
- **WHEN** a Svelte component imports `$lib/components/ui/button`
- **THEN** Vite resolves it to `frontend/src/lib/components/ui/button`

#### Scenario: TypeScript resolves $lib alias
- **WHEN** the TypeScript compiler encounters an import from `$lib/`
- **THEN** it resolves the path correctly for type checking

### Requirement: Tailwind CSS v4 integration
The system SHALL configure shadcn-svelte to work with Tailwind CSS v4. The global CSS file SHALL include the shadcn-svelte theme variables using the `@theme` directive.

#### Scenario: shadcn theme variables are available
- **WHEN** the application loads
- **THEN** CSS custom properties for shadcn-svelte components (e.g., `--background`, `--foreground`, `--primary`) are defined and accessible

### Requirement: Lucide icons replace custom Icon component
The system SHALL replace the custom `Icon.svelte` component with `@lucide/svelte` icons throughout the codebase. All icon references SHALL use the `@lucide/svelte` library imports.

#### Scenario: Lucide icons render in Activity Bar
- **WHEN** the Activity Bar renders
- **THEN** all icons are rendered using `@lucide/svelte` components
- **AND** the custom `Icon.svelte` is not imported

#### Scenario: Lucide icons render in Explorer Pane
- **WHEN** the Explorer Pane renders items
- **THEN** file/folder/archive icons use `@lucide/svelte` components

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
