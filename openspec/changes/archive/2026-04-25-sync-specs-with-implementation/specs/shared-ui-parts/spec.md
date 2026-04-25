## MODIFIED Requirements

### Requirement: LoadingState component
The system SHALL provide a `LoadingState` component in `$lib/components/shared/loading-state/` that renders a centered loading indicator with a configurable height. The loading label SHALL use a fixed English label (`Loading...`) from `$lib/uiText` rather than a localized message.

#### Scenario: Render default loading state
- **WHEN** a LoadingState is rendered without props
- **THEN** it displays a centered English loading message with muted foreground color
- **AND** the container height defaults to `h-64`

#### Scenario: Render loading state with custom height
- **WHEN** a LoadingState is rendered with `height="h-48"`
- **THEN** the container uses the specified height class

### Requirement: Clipboard copy utility
The system SHALL provide a `copyToClipboard` function in `$lib/utils.ts` that accepts a text string and a label, copies the text to the system clipboard, and shows a success or error toast notification. Some components (e.g., TabBar) MAY implement their own inline clipboard logic rather than importing the shared utility.

#### Scenario: Copy text to clipboard successfully
- **WHEN** `copyToClipboard("my-change", "Change name")` is called
- **THEN** the text "my-change" is written to the system clipboard
- **AND** a success toast is shown using the provided label

#### Scenario: Copy fails gracefully
- **WHEN** the clipboard API fails
- **THEN** an error toast is shown

#### Scenario: Components may duplicate clipboard logic
- **WHEN** a component like TabBar needs clipboard functionality
- **THEN** it MAY implement its own inline `copyToClipboard` function
- **AND** this is an accepted divergence from the shared utility pattern
