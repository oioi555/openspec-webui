# theme-management Specification

## Purpose
Defines how the UI theme (light, dark, system) is defined, switched, persisted, and applied across all components.

## Requirements

### Requirement: Define semantic color tokens
The system SHALL define semantic color tokens as shadcn-svelte oklch-based CSS custom properties in the `@theme` block, covering at minimum background, foreground, primary/brand, secondary, muted, accent, destructive/danger, border, input, and ring. Each token SHALL have distinct oklch values for light and dark themes. The system SHALL NOT define legacy backward-compatible CSS variable aliases.

#### Scenario: Light theme colors are applied via shadcn tokens
- **WHEN** the `<html>` element has `data-theme="light"`
- **THEN** all shadcn semantic color tokens resolve to their light theme oklch values

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

#### Scenario: Minimum shadcn token set is defined
- **WHEN** the `@theme` block is inspected
- **THEN** it defines at least `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, and `--ring`
- **AND** each has distinct light and dark oklch values

#### Scenario: No legacy aliases
- **WHEN** the theme CSS is inspected
- **THEN** legacy aliases such as `--color-bg` and `--color-brand` are not defined
- **AND** components use the shadcn semantic tokens directly

### Requirement: Use semantic colors in all components
All Svelte components and CSS styles SHALL use semantic color tokens instead of hardcoded Tailwind color classes. A small number of hardcoded color usages MAY remain — for example, `text-white` is used for the checked checkbox checkmark in `app.css`. These residual hardcoded colors SHALL be limited to CSS-only contexts where semantic token mapping would be impractical or where the color is absolute (pure white on a success-colored background).

#### Scenario: All components respond to theme change
- **WHEN** the user switches from dark to light theme
- **THEN** every visible UI element (navigation, modals, cards, buttons, inputs, text, borders) reflects the light color scheme

#### Scenario: Markdown content responds to theme change
- **WHEN** the user switches themes while viewing markdown content
- **THEN** headings, body text, code blocks, links, tables, and blockquotes all reflect the current theme

#### Scenario: Residual hardcoded colors are tolerated
- **WHEN** certain CSS-only elements (e.g., checkbox checkmarks) use hardcoded colors like `text-white`
- **THEN** this is an accepted exception where the color is absolute and contextually correct
