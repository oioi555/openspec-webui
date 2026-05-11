## 1. Spec + reset boundary

- [x] **1.1** Add a `search` delta spec that makes Search query/results project-scoped and requires stale previous-project responses to be ignored after a switch.
- [x] **1.2** Confirm the project-scoped reinitialization path is the single reset boundary for explicit project switches, websocket binding changes, reconnect rebinding, and no-active-project fallback.

## 2. Search reset implementation

- [x] **2.1** Extend Search reset behavior so project changes clear the query, visible results, loading state, and pending Search work together.
- [x] **2.2** Wire the full Search reset into project reinitialization without introducing unstable circular state dependencies.
- [x] **2.3** Ensure stale timers and async responses from the previous project cannot repopulate Search results after a switch.

## 3. Verification

- [x] **3.1** Add or update regression coverage for switching projects while Search results are visible.
- [x] **3.2** Add or update regression coverage for switching projects while a Search request is still pending.
- [x] **3.3** Verify same-project Search behavior still works, and confirm the Search panel is empty after a real project change.
- [x] **3.4** Run targeted frontend checks plus `openspec validate reset-search-state-on-project-switch --strict`.
