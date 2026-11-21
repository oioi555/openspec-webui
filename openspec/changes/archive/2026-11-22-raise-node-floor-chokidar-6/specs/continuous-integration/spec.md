## MODIFIED Requirements

### Requirement: Run repository checks on every push and pull request
The repository SHALL run its unit tests, type checks, and production build automatically for every push to `main` and every pull request, on both Linux and Windows, using a Node.js version within the supported `engines` range. At least one Linux job SHALL use exactly the minimum version declared in `engines` (currently `22.22.0`). The workflow SHALL use read-only repository permissions and bounded job timeouts.

#### Scenario: Pull request is opened
- **WHEN** a pull request is opened or updated
- **THEN** tests, type checks, and the build run on Linux and on Windows
- **AND** any failing step marks the run as failed

#### Scenario: Minimum supported Node.js
- **WHEN** the checks run
- **THEN** at least one Linux job uses exactly the minimum Node.js version declared in `engines`
- **AND** every other job uses a Node.js version that satisfies `engines`
