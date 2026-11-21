## ADDED Requirements

### Requirement: Supported Node.js runtime floor
The published package SHALL declare `engines.node` as `>=22.22.0`, which is not lower than the Node.js floor of the supported OpenSpec 2.x CLI (`>=22.20.0`) and satisfies the file-watching dependency. The root entry of the lockfile SHALL declare the same range, and the README SHALL state the same minimum Node.js version.

#### Scenario: Engines match the documented floor
- **WHEN** a user inspects the package metadata, lockfile root, and README prerequisites
- **THEN** each states Node.js 22.22.0 as the minimum

#### Scenario: Floor is not below OpenSpec's
- **WHEN** the supported OpenSpec CLI raises its Node.js floor
- **THEN** the WebUI floor is not lower than it
