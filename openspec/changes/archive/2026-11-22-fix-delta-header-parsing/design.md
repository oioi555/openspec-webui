# Design

## Context

OpenSpec 2.1.1 (`dist/core/parsers/requirement-blocks.js`, `spec-structure.js`) uses these rules:
- requirement header: `/^###\s*Requirement:\s*(.+)\s*$/i`;
- delta header: `/^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\s+Requirements(?:[ \t]+#+)?\s*$/i`;
- `stripClosingSequence` = `/[ \t]+#+[ \t]*$/`;
- a code-fence mask;
- BOM and CRLF normalization.

The WebUI's `parseDeltaOperations()` has none of these.

## Goals / Non-Goals

**Goals:** produce the same requirement names and boundaries as OpenSpec for these inputs.

**Non-Goals:**
- Validation diagnostics. `openspec validate` stays the authority.
- Rendering changes. Markdown rendering already follows CommonMark.

## Decisions

- **Mirror the rules.** Port them rather than call the CLI, because parsing is synchronous file reading on every refresh. The upstream regexes are cited in a comment with the version.
- **Keep the singular form.** The WebUI keeps accepting `## ADDED Requirement` (singular), which it accepts today, so existing user files do not regress. This is deliberately more lenient than upstream.
- **Fence mask.** A line opens a fence with three or more backticks or tildes after any leading whitespace, as in the OpenSpec 2.1.1 CLI. A backtick opener whose info string contains a backtick is inline code, not a fence. It closes on the same character with at least the same length. Masked lines are appended to the current requirement's content unchanged.

## Risks / Trade-offs

- [Unclosed fence swallows the rest of the file] → This matches CommonMark and upstream. A test documents it.
