## MODIFIED Requirements

### Requirement: Enable suggestion mode for active changes
The system SHALL allow suggestion mode on non-archived change detail views opened in tabs. When suggestion mode is active, the Suggestion Panel SHALL appear as a collapsible right sidebar adjacent to the Main Viewer. The system SHALL not expose suggestion mode controls for archived changes. The SuggestionPanel and SuggestionPopover SHALL use shadcn `<Button>` components for all action buttons instead of inline button classes. The `truncateText` utility function SHALL be imported from `$lib/utils` instead of being defined locally.

#### Scenario: SuggestionPanel uses Button component for actions
- **WHEN** the SuggestionPanel renders a "Generate Instructions" button
- **THEN** it uses `<Button variant="default">` from `$lib/components/ui/button`

#### Scenario: SuggestionPanel cancel button uses Button ghost
- **WHEN** the SuggestionPanel renders a cancel or dismiss button
- **THEN** it uses `<Button variant="ghost">` from `$lib/components/ui/button`

#### Scenario: truncateText imported from shared utils
- **WHEN** SuggestionPanel or SuggestionPopover needs to truncate text
- **THEN** it imports `truncateText` from `$lib/utils`
- **AND** no local `truncateText` function is defined in either component
