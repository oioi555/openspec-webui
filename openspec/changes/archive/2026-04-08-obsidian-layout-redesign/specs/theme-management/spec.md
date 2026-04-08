## MODIFIED Requirements

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
