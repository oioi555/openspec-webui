# Design

## Context

OpenSpec 2.1.1 `parseDeltaSpec()` (`dist/core/parsers/requirement-blocks.js`):
- `findFrontmatterEnd()` detects a block that starts with `---` on line 1, ends at the next `---`, and has a key-like first entry (`FRONTMATTER_KEY_REGEX`) or only blank lines. It returns 0 if a `##`–`######` heading or a requirement header comes first, or if the block holds a comment but no key. The lines are then blanked with `lines.fill('', 0, end)`, so line numbers stay stable.
- `splitTopLevelSections()` splits at every non-fenced `/^(##)\s+(.+)$/` line. A requirement block ends at the next requirement header or `/^##\s+/`.
- Each block is `buf.join('\n').trimEnd()`.

## Goals / Non-Goals

**Goals:** produce the same requirement names, boundaries and content as OpenSpec.

**Non-Goals:** validation diagnostics such as orphaned requirements or unapplied content. `openspec validate` stays the authority.

## Decisions

- **Port `findFrontmatterEnd` verbatim.** It is small, and matching its guards keeps `---` thematic breaks from hiding text.
- **Blank, not cut.** As upstream, so `startLine`/`endLine` keep matching the file.
- **Boundary on any `##`.** A non-delta `##` header closes the requirement and sets the section to none, so the requirements under it are ignored, as upstream.
- **`endLine` unchanged.** It is still the line before the next boundary. Only `content` is trimmed.
- **Keep the lenient section header.** `## ADDED Requirement` (singular) and a closing run are still accepted, so existing user files do not regress. This intentionally differs from upstream.

## Risks / Trade-offs

- [Operations content changes for existing changes] → Expected. Tasks record a before/after diff classification.
