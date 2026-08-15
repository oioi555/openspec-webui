## 1. Generation Version Detection

- [x] 1.1 Add `.agents/skills` to the standard roots scanned for `metadata.generatedBy` markers while preserving the existing read-only and stable-order behavior.

## 2. Regression Coverage

- [x] 2.1 Add a scanner test proving that a project with OpenSpec skills only under `.agents/skills` reports its generated version.
- [x] 2.2 Update the read-only filesystem test to cover the shared `.agents/skills` root.
- [x] 2.3 Run the relevant server tests and the project validation commands.
