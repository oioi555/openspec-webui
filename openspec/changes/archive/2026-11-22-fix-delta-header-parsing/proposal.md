# Proposal

## Why

The WebUI parses change spec deltas into `operations`, which the change API returns. Its header rules have drifted from OpenSpec 2.1.1 in four ways:
- **Missing space.** OpenSpec accepts `###Requirement: Foo` (no space after `###`). The WebUI drops that requirement.
- **Closing run.** OpenSpec strips a closing run such as `### Requirement: Foo ###`. The WebUI keeps ` ###` in the requirement name.
- **Fenced code.** OpenSpec ignores headers inside fenced code blocks. The WebUI treats them as real headers, so a delta that shows a header example in a fence is split wrongly.
- **CRLF files.** OpenSpec normalizes CRLF and a leading BOM, so the same file can parse differently on Windows.

## What Changes

- Requirement headers match `^###\s*Requirement:` and drop a closing `#` run.
- Delta section headers allow a closing `#` run (`## ADDED Requirements ##`).
- Lines inside fenced code blocks (backticks and tildes) are never headers.
- Content is normalized (BOM, CRLF) before parsing.
- Behavior for well-formed deltas does not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `spec-browsing`: delta operations follow OpenSpec's header rules.

## Impact

- `src/parser/changes.ts` (`parseDeltaOperations`) and `changes.test.ts`.
- The change API's `operations` field becomes accurate for these inputs. No shape change.
