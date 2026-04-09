# theme-management Specification

## Purpose
Defines how the UI theme (light, dark, system) is defined, switched, persisted, and applied across all components.

## Requirements
### Requirement: Define semantic color tokens
The system SHALL define semantic color tokens using the shadcn-svelte oklch-based CSS custom properties in the `@theme` block, covering at minimum: background (`--background`), foreground (`--foreground`), primary/brand (`--primary`), secondary (`--secondary`), muted (`--muted`), accent (`--accent`), destructive/danger (`--destructive`), border (`--border`), input (`--input`), and ring (`--ring`). Each token SHALL have distinct values for light and dark themes using oklch color space. The existing custom CSS variable names (e.g., `--color-bg`, `--color-brand`) SHALL be mapped as aliases to the shadcn variables for backward compatibility during migration.

#### Scenario: Light theme colors are applied via shadcn tokens
- **WHEN** the `<html>` element has `data-theme="light"`
- **THEN** all shadcn semantic color tokens resolve to their light theme oklch values
- **AND** existing legacy variable aliases also resolve correctly

#### Scenario: System mode resolves to light colors
- **WHEN** the `<html>` element has no `data-theme` attribute
- **AND** the operating system prefers a light color scheme
- **THEN** all semantic color tokens resolve to their light theme values

#### Scenario: Dark theme colors are applied via shadcn tokens
- **WHEN** the `<html>` element has `data-theme="dark"`
- **THEN** all shadcn semantic color tokens resolve to their dark theme oklch values

#### Scenario: System mode resolves to dark colors
- **WHEN** the `<html>` element has no `data-theme` attribute
- **AND** the operating system prefers a dark color scheme
- **THEN** all semantic color tokens resolve to their dark theme values

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

### Requirement: Switch between light, dark, and system themes
The system SHALL provide three theme modes: Light, Dark, and System. When System is selected, the theme SHALL follow the operating system's `prefers-color-scheme` setting and update in real-time when the OS setting changes.

#### Scenario: User selects Light theme
- **WHEN** the user selects the Light theme option
- **THEN** the UI immediately switches to light colors
- **AND** the `<html>` element gets `data-theme="light"`

#### Scenario: User selects Dark theme
- **WHEN** the user selects the Dark theme option
- **THEN** the UI immediately switches to dark colors
- **AND** the `<html>` element gets `data-theme="dark"`

#### Scenario: User selects System theme
- **WHEN** the user selects the System theme option
- **THEN** the UI follows the OS color scheme preference
- **AND** updates automatically when the OS preference changes

#### Scenario: OS preference changes while System mode is active
- **WHEN** the OS switches from light to dark while System mode is active
- **THEN** the UI updates to dark theme immediately

### Requirement: Persist theme selection
The system SHALL persist the selected theme mode in browser `localStorage` under a dedicated key and SHALL restore it on subsequent visits. When no saved preference exists, the system SHALL default to Dark theme. The theme store implementation SHALL use Svelte 5 `$state` rune instead of `writable()` for internal state, and SHALL expose the current theme as a reactive value that components can import directly.

#### Scenario: Restore saved theme on page load
- **WHEN** the user opens the application after a previous visit
- **THEN** the theme from localStorage is applied immediately

#### Scenario: Saved theme is applied before app mount
- **WHEN** a saved theme exists in localStorage on page load
- **THEN** the initial document theme is applied before the Svelte application mounts
- **AND** the user does not see a flash of the wrong theme

#### Scenario: Default to dark theme for first visit
- **WHEN** the user opens the application for the first time (no localStorage value)
- **THEN** the dark theme is applied

#### Scenario: Theme state is reactive via runes
- **WHEN** the theme store's `$state` value changes
- **THEN** all components reading the theme value update automatically without `$store` prefix syntax

### Requirement: Use semantic colors in all components
All Svelte components and CSS styles SHALL use semantic color tokens instead of hardcoded Tailwind color classes. No component SHALL reference raw gray-N, blue-N, or similar hardcoded colors for themable elements.

#### Scenario: All components respond to theme change
- **WHEN** the user switches from dark to light theme
- **THEN** every visible UI element (navigation, modals, cards, buttons, inputs, text, borders) reflects the light color scheme

#### Scenario: Markdown content responds to theme change
- **WHEN** the user switches themes while viewing markdown content
- **THEN** headings, body text, code blocks, links, tables, and blockquotes all reflect the current theme
