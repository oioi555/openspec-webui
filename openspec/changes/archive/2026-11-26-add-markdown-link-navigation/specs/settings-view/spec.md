# Spec Delta

## ADDED Requirements

### Requirement: General section offers an "Open files with" preference
The Settings General section SHALL offer an "Open files with" preference that controls how links to local files are opened. The choices SHALL be: copy path (default), VS Code, Cursor, Windsurf, VSCodium, Antigravity IDE, Zed, and Custom URL template. The preference SHALL be stored in the browser, persist across reloads, and apply to all projects.

#### Scenario: Default value
- **WHEN** the user opens Settings → General for the first time
- **THEN** "Open files with" shows "Copy path"

#### Scenario: Choose an editor
- **WHEN** the user selects "Zed" and reloads the page
- **THEN** "Open files with" still shows "Zed"

#### Scenario: Custom template input
- **WHEN** the user selects "Custom URL template"
- **THEN** a text field for the template appears with a hint that `{path}` and `{line}` are replaced
- **AND** a template that is not an allowed URL scheme is flagged as invalid and is not used

#### Scenario: Editor opening depends on the local machine
- **WHEN** an editor option is selected
- **THEN** the section explains that the editor must be installed on the machine running the browser and must have its URL handler registered
