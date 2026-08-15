## Context

See `proposal.md` for motivation. Command Code's v1.9 artifact layout already matches two shapes supported by the server: flat `opsx-<id>` command filenames and slash-invoked `openspec-*` skill directories. Integration detection is driven by one static signature table, while generation-version detection scans a separate ordered list of representative skill roots and returns the first readable `metadata.generatedBy` marker.

## Goals / Non-Goals

**Goals:**

- Represent Command Code through the existing signature and invocation-form model.
- Preserve workflow-level Commands and Skills evidence without introducing a Command Code-specific parser.
- Detect a generation version from Command Code-only projects while preserving existing scan precedence.

**Non-Goals:**

- Detect whether the Command Code executable is installed.
- Execute `openspec init`, regenerate Command Code artifacts, or validate their file bodies.
- Change API contracts, frontend rendering, or command candidate priority rules.
- Add support for unrelated OpenSpec v1.9 opt-in commands such as `validate --archived`.

## Decisions

### Model Command Code as an existing opsx-dash tool

Add Command Code to the static tool signature table with `.commandcode/commands` using the filename-shaped `opsx-dash` form and `.commandcode/skills` using `skill-slash`. This reuses the existing inventory, source-path, example-invocation, supported-catalog, and candidate-resolution behavior.

Alternative considered: add a Command Code-specific detector. Rejected because its paths and naming conventions require no parsing behavior that the shared detector does not already provide, and a separate path would create unnecessary drift.

### Append the Command Code skill root to version scan order

Add `.commandcode/skills` after the existing representative roots. A Command Code-only project then exposes its marker, while a project with multiple generated skill trees keeps the same first-readable-marker result it had before this change.

Alternative considered: prioritize `.commandcode/skills` ahead of existing roots. Rejected because it could change the reported version for existing multi-tool projects even when their current marker remains readable.

### Cover commands, skills, catalog membership, and version detection at the server boundary

Use temporary repository fixtures in the existing server tests to prove both Command Code deliveries, supported-tool catalog inclusion, and Command Code-only version scanning. Existing integration tests already cover how the resulting evidence flows through the API and frontend, so no new end-to-end test surface is needed unless implementation reveals a contract mismatch.

## Risks / Trade-offs

- [Risk] A hand-written file matching OpenSpec's Command Code naming pattern can be treated as generated evidence. -> Mitigation: retain the existing repository-artifact detection contract and require the same `opsx-*` and `openspec-*/SKILL.md` shapes used for every supported tool.
- [Risk] Multiple skill roots can contain different generation markers. -> Mitigation: append the new root so existing deterministic first-readable precedence remains unchanged.
- [Risk] Upstream Command Code paths or invocation syntax could change later. -> Mitigation: pin regression fixtures to the v1.9 documented layout so future upstream changes produce an explicit maintenance decision.

## Migration Plan

No data migration is required. Deploy the signature and scan-root additions together; rollback consists of reverting those entries and their tests.
