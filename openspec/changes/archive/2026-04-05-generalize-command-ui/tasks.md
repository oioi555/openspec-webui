## 1. Command availability and preferences

- [x] 1.1 Add a backend workflow-availability API that reads local OpenSpec workflow support without mutating CLI configuration.
- [x] 1.2 Add a command-preferences store and helpers for AI tool syntax, expanded-command visibility, and localStorage persistence.

## 2. Settings modal

- [x] 2.1 Add a navigation-end settings launcher and a reusable modal/dialog shell for command preferences.
- [x] 2.2 Implement AI tool selection plus workflow-aware expanded-command toggles, including disabled states when availability cannot be loaded.

## 3. Command surfaces

- [x] 3.1 Add workspace command copy buttons to Dashboard and Changes using the requested visibility rules for incomplete and completed active changes.
- [x] 3.2 Replace the legacy floating apply shortcut in ChangeViewer with change-scoped command buttons that use the change name only.
- [x] 3.3 Validate clipboard output, UI labels, and build/typecheck behavior for both `default` and `Claude Code` command modes.
