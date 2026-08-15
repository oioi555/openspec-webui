## 1. Command Code Integration Detection

- [x] 1.1 Add Command Code to the tool signature table with `.commandcode/commands` as filename-shaped `opsx-dash` evidence and `.commandcode/skills` as `skill-slash` evidence.
- [x] 1.2 Add detector tests for Command Code commands, skills, dual-delivery inventories, source paths, and representative invocation forms.
- [x] 1.3 Add Command Code to the supported-tool catalog regression expectations without changing existing tool ordering semantics.

## 2. Generation Version Detection

- [x] 2.1 Append `.commandcode/skills` to the representative generation-version scan roots while preserving existing first-readable-marker precedence and read-only behavior.
- [x] 2.2 Add scanner coverage proving a Command Code-only project reports `metadata.generatedBy`, including the read-only filesystem invariant.

## 3. Verification

- [x] 3.1 Run the relevant server tests for tool integration and skill scanning.
- [x] 3.2 Run the full test suite and typecheck.
- [x] 3.3 Run strict OpenSpec validation for the completed change.
