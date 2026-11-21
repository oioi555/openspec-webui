# Proposal

## Why

`fix-delta-header-parsing` aligned header rules with OpenSpec 2.1.1, but three gaps remain in `parseDeltaOperations()`:
- **Section boundaries.** OpenSpec ends a delta section and its requirement at any `##` header outside a fence. The WebUI only ends them at a delta header, so text under `## Notes` is appended to the previous requirement.
- **Frontmatter.** OpenSpec blanks a leading YAML frontmatter block before parsing. The WebUI parses it as content.
- **Trailing whitespace.** OpenSpec trims trailing whitespace and blank lines from each requirement block. The WebUI keeps them.

## What Changes

- Any `##` header outside a fence ends the current section and requirement.
- A leading frontmatter block is blanked before parsing. Line numbers do not move.
- Requirement content is trimmed at the end.
- The lenient section header (singular `Requirement`, closing `##` run) is kept as an intentional difference.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `spec-browsing`: delta operations follow OpenSpec's section, frontmatter and trimming rules.

## Impact

- `src/parser/changes.ts` (`parseDeltaOperations`) and `changes.test.ts`.
- The change API's `operations` content changes for deltas with trailing blank lines or non-delta `##` sections. No shape change.
