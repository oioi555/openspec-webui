## MODIFIED Requirements

### Requirement: Define semantic color tokens
The system SHALL define semantic color tokens using the shadcn-svelte oklch-based CSS custom properties in the `@theme` block, covering at minimum: background (`--background`), foreground (`--foreground`), primary/brand (`--primary`), secondary (`--secondary`), muted (`--muted`), accent (`--accent`), destructive/danger (`--destructive`), border (`--border`), input (`--input`), and ring (`--ring`). Each token SHALL have distinct values for light and dark themes using oklch color space. Legacy CSS variable aliases (e.g., `--color-bg`, `--color-brand`) are NOT defined in the current implementation; the migration directly uses shadcn semantic tokens without backward-compatible aliases.

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

### Requirement: Use semantic colors in all components
All Svelte components and CSS styles SHOULD use semantic color tokens instead of hardcoded Tailwind color classes. In practice, a small number of hardcoded color usages remain — for example, `text-white` is used for the checked checkbox checkmark in `app.css`. These residual hardcoded colors exist in CSS-only contexts where semantic token mapping would be impractical or where the color is absolute (pure white on a success-colored background).

#### Scenario: All components respond to theme change
- **WHEN** the user switches from dark to light theme
- **THEN** every visible UI element (navigation, modals, cards, buttons, inputs, text, borders) reflects the light color scheme

#### Scenario: Markdown content responds to theme change
- **WHEN** the user switches themes while viewing markdown content
- **THEN** headings, body text, code blocks, links, tables, and blockquotes all reflect the current theme

#### Scenario: Residual hardcoded colors are tolerated
- **WHEN** certain CSS-only elements (e.g., checkbox checkmarks) use hardcoded colors like `text-white`
- **THEN** this is an accepted exception where the color is absolute and contextually correct
