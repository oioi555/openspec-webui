## ADDED Requirements

### Requirement: Record the OpenSpec install method
When the local OpenSpec CLI supports `openspec version --json`, version status SHALL record the reported install manager and scope, and SHALL take the latest version and the suggested update command from `openspec version --check --json`. CLIs without `version --json` SHALL keep the existing `--version` and npm registry check.

#### Scenario: CLI reports its install
- **WHEN** `openspec version --check --json` returns install manager `npm`, scope `global`, and latest `2.1.1`
- **THEN** version status records those values without querying the npm registry

#### Scenario: Older CLI
- **WHEN** `openspec version --json` exits non-zero or prints non-JSON
- **THEN** version status uses `openspec --version` and the npm registry as before

### Requirement: OpenSpec update command follows the install method
The Versions page SHALL show the CLI-suggested update command when one is recorded. Without one, it SHALL show `npm install -g @fission-ai/openspec@latest` for npm installs, and for any other install manager it SHALL name that manager and link the official installation documentation instead of an npm command.

#### Scenario: Standalone install
- **WHEN** the recorded update command is `openspec install`
- **THEN** the Versions page shows `openspec install` as the OpenSpec update command

#### Scenario: npm install without a suggested command
- **WHEN** the recorded install manager is `npm` and no update command is recorded
- **THEN** the Versions page shows `npm install -g @fission-ai/openspec@latest`
