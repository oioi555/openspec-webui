## MODIFIED Requirements

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
