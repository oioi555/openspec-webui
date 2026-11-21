# Design

## Context

The 500-character rule counts the requirement statement: the text between the `### Requirement:` header and the first `#### Scenario:`. Scenarios are not counted. `openspec validate --specs --strict --json` lists every offending requirement by spec and index.

## Goals / Non-Goals

**Goals:** zero strict warnings with no change in meaning.

**Non-Goals:** rewording for style, merging requirements, or renaming requirements. A rename would break history links. A split keeps the original name for the first behavior.

## Decisions

- **Author the deltas at implementation time.** They are written against the main specs as they stand after the earlier 2.x changes are archived. The other in-flight changes only ADD requirements, so the long ones are unchanged, but writing the deltas last removes any drift risk.
- **Shorten before splitting.** The preferred move is to turn enumerations ("(a) … (b) …", lists of paths, examples) into scenarios. Split only when the statement holds independent behaviors that are tested separately.
- **Batch by spec.** One delta file per spec. Work in batches of about 6 specs, each validated with `openspec validate split-long-spec-requirements --strict` before the next. The batches can be parallelized across agents, because the files are disjoint.
- **Meaning check.** For each modified requirement, a reviewer pass compares the old and new SHALL sets: every old normative clause must map to a new SHALL or scenario line. The check is recorded in the batch's task.

## Risks / Trade-offs

- [A clause is lost while moving it into a scenario] → The reviewer pass, plus the main-spec diff reviewed at archive time.
- [MODIFIED blocks must copy the whole requirement, scenarios included] → Generate each block from the current main spec text with a script, then edit only the statement.
