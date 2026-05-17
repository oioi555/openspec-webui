## Context

`openspec-webui` is a local-first CLI and browser UI that necessarily performs local-tool actions: it serves a loopback WebUI, reads selected OpenSpec project files, runs `openspec validate` on request, and checks package versions against the npm registry. Socket.dev reports these as supply-chain-risk heuristics alongside dependency advisories for `openspec-webui@0.3.2`.

The user preference is to keep useful local functionality and address the issue through transparent documentation plus dependency maintenance, not by removing core workflows.

## Goals / Non-Goals

**Goals:**
- Add lightweight README documentation explaining why the package requests network, shell, environment, and filesystem access.
- Update dependency metadata and lockfile entries to remove known npm audit findings where safe fixes are available.
- Preserve the existing validation, update-check, local server, project browsing, and file-reading behavior.
- Verify the updated dependency set through the existing build/test/typecheck/release checks.

**Non-Goals:**
- Removing update checks, validation execution, filesystem browsing, or local server behavior solely to reduce heuristic alerts.
- Re-architecting the permission model or adding new runtime permission prompts.
- Guaranteeing Socket.dev will hide all heuristic supply-chain-risk labels; the goal is to make the behavior clear and keep dependencies patched.

## Decisions

1. **Document intentional permissions rather than remove features.**
   - Rationale: The flagged behaviors are expected for a local CLI/WebUI and are tied to user-visible features.
   - Alternative considered: Disable or make opt-in all network/shell/filesystem behavior. Rejected because it would degrade normal usage disproportionally.

2. **Keep shell execution constrained to existing safe patterns.**
   - Rationale: The current implementation uses `execFile` with fixed command names, structured arguments, explicit `cwd`, and timeouts instead of interpolated shell strings.
   - Alternative considered: Remove `openspec validate` integration. Rejected because validation is a core workflow.

3. **Use regular dependency upgrades and audit fixes first.**
   - Rationale: `npm audit fix` can update several transitive packages without code changes, while `@fastify/static` needs an explicit major-version update and compatibility verification.
   - Alternative considered: Pin or override only vulnerable transitive packages. Rejected unless normal upgrades fail, because direct dependency updates are easier to maintain.

## Risks / Trade-offs

- **Risk:** `@fastify/static` major update changes static serving behavior. → **Mitigation:** Run integration/smoke tests and verify the packaged CLI still serves the frontend.
- **Risk:** README wording overpromises privacy/security guarantees. → **Mitigation:** Keep claims narrow and factual: local binding by default, selected-project file access, explicit validation execution, npm registry version checks, and no install-time scripts.
- **Risk:** Socket.dev heuristic alerts remain visible after the change. → **Mitigation:** Treat README transparency and patched dependencies as the acceptance criteria; heuristic labels are expected for local tooling.
